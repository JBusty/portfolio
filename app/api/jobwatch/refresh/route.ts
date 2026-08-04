/**
 * The sweep job.
 *
 * A full pass over ~15,900 boards is far longer than one invocation allows, so
 * the work is sharded: each run takes one slice, probes it, and merges its
 * results into the index. Shards it doesn't reach keep their previous results
 * rather than being blanked, so the index is always usable and never empty
 * mid-cycle.
 *
 * Driven by cron (see `vercel.ts`), which picks the shard from the clock.
 */

import { discoverBoards, shardOf } from '@/lib/jobwatch/discover';
import { readIndex, writeIndex } from '@/lib/jobwatch/index-store';
import { mergeShard, sweepBoards } from '@/lib/jobwatch/sweep';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** One shard per run; the whole watchlist is covered every SHARD_COUNT runs. */
const SHARD_COUNT = 12;

/** Stop sweeping with time left to merge and write, rather than being killed. */
const WRITE_BUDGET_MS = 25_000;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when it is set. With
  // no secret configured the route is open, which is fine for a private tool
  // but worth knowing.
  if (!secret) return true;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  const started = Date.now();

  if (!authorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const override = url.searchParams.get('shard');
  // Default to the clock so consecutive cron firings walk the whole list.
  const shard = override != null
    ? Number(override) % SHARD_COUNT
    : Math.floor(started / (5 * 60 * 1000)) % SHARD_COUNT;

  // Held outside the try so a failed *write* still reports what the sweep
  // found. Those are separate failures and conflating them makes a missing
  // Blob store look like a broken sweep.
  let stats: Record<string, unknown> = {};

  try {
    const boards = await discoverBoards();
    const slice = shardOf(boards, shard, SHARD_COUNT);

    const deadline = started + (maxDuration * 1000 - WRITE_BUDGET_MS);
    const result = await sweepBoards(slice, { deadline });

    stats = {
      shard,
      shardCount: SHARD_COUNT,
      discovered: boards.length,
      boardsInShard: slice.length,
      probed: result.probed,
      live: result.live,
      withDesign: result.withDesign,
      errors: result.errors,
      designRoles: result.jobs.length,
    };

    const merged = mergeShard(await readIndex(), shard, result, slice);
    await writeIndex(merged);

    return Response.json({
      ok: true,
      ...stats,
      indexSize: merged.jobs.length,
      shardsReported: Object.keys(merged.shards).length,
      elapsedMs: Date.now() - started,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        ...stats,
        error: (err as Error)?.message ?? 'Sweep failed',
        elapsedMs: Date.now() - started,
      },
      { status: 500 },
    );
  }
}
