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
import { mergeShards, readShards, writeIndex, writeShard } from '@/lib/jobwatch/index-store';
import { sweepBoards } from '@/lib/jobwatch/sweep';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** One shard per run; the whole watchlist is covered every SHARD_COUNT runs. */
const SHARD_COUNT = 12;

/** Stop sweeping with time left to merge and write, rather than being killed. */
const WRITE_BUDGET_MS = 25_000;

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on every firing once
 * that variable is set on the project.
 *
 * Fails closed: a missing secret refuses the request rather than leaving the
 * route open. This endpoint spends real time and money — fifteen thousand
 * outbound requests a run — so an unconfigured deployment should do nothing at
 * all, not run the sweep for anyone who finds the URL. Local development is
 * exempt so the sweep stays testable without a token.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
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
  //
  // The bucket has to match the cron interval or the walk stops walking. This
  // was a 5-minute bucket while the cron fired every 5 minutes; against the
  // daily schedule it pinned every run to the same shard, because a day is
  // exactly 288 buckets and 288 % 12 === 0. One bucket per day advances by one.
  const shard = override != null
    ? Number(override) % SHARD_COUNT
    : Math.floor(started / (24 * 60 * 60 * 1000)) % SHARD_COUNT;

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

    // Write our own shard, then rebuild the merged index from every shard that
    // has reported. No read-modify-write, so shards can never clobber each
    // other — see the note in index-store.
    await writeShard({ shard, at: Date.now(), probed: result.probed, jobs: result.jobs });
    const merged = mergeShards(await readShards());
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
