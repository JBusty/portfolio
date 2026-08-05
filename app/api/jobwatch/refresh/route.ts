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

import { isDesignRole, matchesJobType } from '@/lib/jobwatch/classify';
import { readPrefs } from '@/lib/jobwatch/db';
import { discoverBoards, shardOf } from '@/lib/jobwatch/discover';
import {
  mergeShards, readIndex, readShards, shardWrittenAt, writeIndex, writeShard, type ShardFile,
} from '@/lib/jobwatch/index-store';
import { isAuthed } from '@/lib/jobwatch/session';
import { stampFirstSeen, sweepBoards } from '@/lib/jobwatch/sweep';
import { PRE_EXISTING } from '@/lib/jobwatch/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * One shard per run; the whole watchlist is covered every SHARD_COUNT runs.
 *
 * Measured, not guessed: a shard of 1,321 boards took ~30s against a usable
 * budget of 275s, so twelve shards was about ten times more cautious than the
 * timeout required — and on a daily cron that meant a twelve-day lap, long
 * enough for a closed req to sit in the index for a week and a half. Three
 * shards is ~5,300 boards and ~120s, still better than 2x headroom, and the
 * lap drops to three days.
 *
 * This does not raise the request *rate* against the three ATS APIs — same
 * concurrency, same total requests, just fewer and fuller invocations. Going
 * further (one daily full sweep) would mean raising `CONCURRENCY`, which
 * `sweep.ts` deliberately declines to do.
 */
const SHARD_COUNT = 3;

/** Stop sweeping with time left to merge and write, rather than being killed. */
const WRITE_BUDGET_MS = 25_000;

/**
 * Two callers, both of them trusted, and nobody else.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on every firing once
 * that variable is set on the project. The signed-in operator is the other:
 * there is a Sweep button in the tool now, and a browser cannot send the cron
 * secret — nor should it, since shipping it to the client would put it in every
 * page load. The session cookie is already the thing that says who you are, and
 * `isAuthed` verifies its signature rather than merely its presence.
 *
 * Fails closed otherwise. This endpoint spends real time and money — fifteen
 * thousand outbound requests a run — so an unconfigured deployment should do
 * nothing at all, not run the sweep for anyone who finds the URL. Local
 * development stays exempt so the sweep is testable without either.
 */
async function authorized(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') === `Bearer ${secret}`) return true;
  if (await isAuthed()) return true;
  return !secret && process.env.NODE_ENV === 'development';
}

export async function GET(request: Request) {
  const started = Date.now();

  if (!(await authorized(request))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const override = url.searchParams.get('shard');

  /**
   * `stale` — what the Sweep button asks for.
   *
   * The clock rotation below is right for a cron firing on a fixed schedule and
   * wrong for a button: press it twice in a minute and the clock hands you the
   * same third of the list both times, so the other two-thirds never refresh no
   * matter how many times you press. Picking the shard that reported longest
   * ago means repeated presses walk the whole list, and one press refreshes
   * whatever is most out of date — which is what someone pressing it wants.
   */
  const stalest = async () => {
    // Off the Blob API, not the file contents — see `shardWrittenAt`. Reading
    // `at` out of the shard body made two presses in a row sweep the same third
    // twice, because the just-written file still read as its previous version.
    const written = await shardWrittenAt();
    let oldest = 0;
    for (let i = 1; i < SHARD_COUNT; i++) {
      // A shard that has never been written has no timestamp and wins outright.
      if ((written.get(i) ?? 0) < (written.get(oldest) ?? 0)) oldest = i;
    }
    return oldest;
  };

  // Default to the clock so consecutive cron firings walk the whole list.
  //
  // The bucket has to match the cron interval or the walk stops walking. This
  // was a 5-minute bucket while the cron fired every 5 minutes; against the
  // daily schedule it pinned every run to the same shard, because a day is
  // exactly 288 buckets and 288 % 12 === 0. One bucket per day advances by one.
  const shard = override === 'stale'
    ? await stalest()
    : override != null
      ? Number(override) % SHARD_COUNT
      : Math.floor(started / (24 * 60 * 60 * 1000)) % SHARD_COUNT;

  // Held outside the try so a failed *write* still reports what the sweep
  // found. Those are separate failures and conflating them makes a missing
  // Blob store look like a broken sweep.
  let stats: Record<string, unknown> = {};

  try {
    const boards = await discoverBoards();
    const slice = shardOf(boards, shard, SHARD_COUNT);

    // What to keep comes from the saved job types, so the sweep goes looking
    // for what you actually asked for rather than a rule compiled in here.
    //
    // Falls back to the old design test on two paths that both mean "no answer
    // stored": no database yet, and a saved list edited down to nothing. An
    // empty list means "no narrowing" on the client, which is a fine answer for
    // 1,000 rows already in hand and a terrible one for 5,000 live boards.
    const jobTypes = await readPrefs()
      .then((prefs) => prefs?.jobTypes ?? [])
      .catch(() => [] as string[]);

    // Title only. Seniority is a client-side band now, so a posting is indexed
    // on what it is called and the band re-cuts what is already in hand —
    // moving it never costs a sweep.
    const keep = jobTypes.length > 0
      ? (title: string) => matchesJobType(title, jobTypes)
      : (title: string) => isDesignRole(title);

    const deadline = started + (maxDuration * 1000 - WRITE_BUDGET_MS);
    const result = await sweepBoards(slice, { deadline, keep });

    stats = {
      shard,
      shardCount: SHARD_COUNT,
      jobTypes: jobTypes.length > 0 ? jobTypes : ['(default design test)'],
      discovered: boards.length,
      boardsInShard: slice.length,
      probed: result.probed,
      live: result.live,
      withMatches: result.withMatches,
      errors: result.errors,
      matched: result.jobs.length,
      capped: result.capped,
    };

    /**
     * Carry the index's own first-seen stamps forward before writing anything.
     *
     * This is what makes "new" mean new to Jobwatch rather than new to whichever
     * browser is looking — see `stampFirstSeen`, which explains why the source
     * is the merged index and not this shard's previous file.
     *
     * Read *before* the write for the usual reason: a blob read inside a minute
     * of a write comes back as the previous version. Here that would cost a
     * handful of stamps rather than a posting, but the rule is the rule.
     */
    const prior = await readIndex();
    const known = new Map<string, number>();
    for (const job of prior.jobs) {
      if (job.firstSeen !== undefined) known.set(job.id, job.firstSeen);
    }

    const stamped = stampFirstSeen(result.jobs, known, {
      // "Nothing has ever been stamped", not "this shard has never reported".
      //
      // The two come apart exactly once, on the run that first ships this: the
      // index in Blob already has shard metadata for every shard and a first-seen
      // date on none of them, so asking whether the shard had reported answers
      // yes and stamps four thousand postings `now` — the flood the baseline
      // exists to prevent, on the one run where it matters most. Asking whether
      // any stamp exists gets that run right, and every later run reads the same
      // either way.
      firstRun: known.size === 0,
    });

    // Write our own shard, then rebuild the merged index from every shard that
    // has reported. No read-modify-write, so shards can never clobber each
    // other — see the note in index-store.
    // `types` is what this shard actually searched for, which is why it is
    // written alongside the postings rather than derived later: once the saved
    // prefs change, there is no way to recover what a shard was run with.
    const mine: ShardFile = {
      shard,
      at: Date.now(),
      probed: result.probed,
      types: jobTypes,
      jobs: stamped,
    };
    await writeShard(mine);

    /**
     * Our own shard comes from memory, never from the read back.
     *
     * Reading it again is a read-after-write against a CDN that floors
     * cache-control at 60 seconds and ignores query strings, so the copy that
     * comes back is very often the *previous* run's — and the merged index then
     * gets written with results this invocation already replaced. It showed up
     * as an index stamped 15:54 whose shard-0 row still held the 14:26 numbers.
     *
     * Shard files from a previous, finer split are also still sitting in Blob
     * and `readShards` returns every one it finds. Left in, they would
     * contribute postings that no run ever refreshes again — permanently stale
     * rows that look live. The current shards cover the whole list between
     * them, so anything numbered beyond the count is discarded.
     */
    const others = (await readShards())
      .filter((file) => file.shard < SHARD_COUNT && file.shard !== shard);

    const reported = [...others, mine].sort((a, b) => a.shard - b.shard);
    const merged = mergeShards(reported, Date.now(), SHARD_COUNT);
    await writeIndex(merged);

    return Response.json({
      ok: true,
      ...stats,
      // The index itself, not just its size.
      //
      // The caller is a button, and the page behind it has to show the result.
      // Re-fetching would go back through the Blob CDN, which serves a 60-second
      // copy and cannot be cache-busted — so the client would routinely be told
      // "994 matched" and then shown the previous index. Handing back the object
      // this request just built removes the race instead of racing it. Costs
      // ~800KB on a press somebody asked for.
      index: merged,
      indexSize: merged.jobs.length,
      coveredTypes: merged.types,
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
