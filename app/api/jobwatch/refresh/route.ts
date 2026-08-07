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

import { currentAccount } from '@/lib/jobwatch/auth';
import { isDesignRole, matchesJobType } from '@/lib/jobwatch/classify';
import { readAllJobTypes } from '@/lib/jobwatch/db';
import { discoverBoards, shardOf } from '@/lib/jobwatch/discover';
import {
  mergeShards, readIndex, readShards, shardWrittenAt, writeIndex, writeShard, type ShardFile,
} from '@/lib/jobwatch/index-store';
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
 * How long a hand-triggered sweep has to wait behind the last one.
 *
 * This exists because registration is open. "Any signed-in user" used to mean
 * one person, and it was a perfectly good rule when the alternative was typing
 * a shared password; it now means anybody on the internet who wants to spend
 * fifteen thousand outbound requests, as often as they can click. A per-user
 * limit would not help — the cost is global, so the limit has to be too.
 *
 * Ten minutes is picked off what a sweep is worth rather than what it costs: a
 * shard takes minutes to run and the boards behind it are updated daily, so two
 * sweeps inside ten minutes cannot return meaningfully different postings even
 * when they are free.
 */
const SWEEP_COOLDOWN_MS = 10 * 60 * 1000;

type Gate =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Who may spend a sweep.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on every firing once
 * that variable is set on the project, and it is never subject to the cooldown
 * — the schedule *is* the rate limit, and making the cron wait behind a user's
 * press is how a shard silently stops being covered.
 *
 * Everyone signed in may still press the button, which matters more than it
 * looks: adding a job type does nothing until the boards have been asked about
 * it, so taking the button away would leave a field that appears to work and
 * silently does not for up to three days. Admins skip the cooldown, because
 * somebody has to be able to force one.
 *
 * Fails closed otherwise. An unconfigured deployment should do nothing at all,
 * not run the sweep for anyone who finds the URL. Local development stays
 * exempt so the sweep is testable without either.
 */
async function authorized(request: Request): Promise<Gate> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') === `Bearer ${secret}`) return { ok: true };

  const account = await currentAccount();
  if (account) {
    if (account.isAdmin) return { ok: true };

    const written = await shardWrittenAt();
    const last = Math.max(0, ...written.values());
    const waited = Date.now() - last;
    if (last > 0 && waited < SWEEP_COOLDOWN_MS) {
      const minutes = Math.ceil((SWEEP_COOLDOWN_MS - waited) / 60_000);
      return {
        ok: false,
        status: 429,
        error: `Swept moments ago — the boards refresh daily, so try again in ${minutes} min.`,
      };
    }
    return { ok: true };
  }

  if (!secret && process.env.NODE_ENV === 'development') return { ok: true };
  return { ok: false, status: 401, error: 'Unauthorized' };
}

export async function GET(request: Request) {
  const started = Date.now();

  const gate = await authorized(request);
  if (!gate.ok) {
    return Response.json({ error: gate.error }, { status: gate.status });
  }

  const url = new URL(request.url);
  // Empty and whitespace-only fold to absent rather than to a number: `?shard=`
  // reads as `Number('') === 0`, which is a valid shard and not remotely what
  // the caller asked for. No override means the clock decides, as below.
  const override = url.searchParams.get('shard')?.trim() || null;

  /**
   * `stale` — what the Sweep button asks for.
   *
   * The clock rotation below is right for a cron firing on a fixed schedule and
   * wrong for a button: press it twice in a minute and the clock hands you the
   * same third of the list both times, so the other two-thirds never refresh no
   * matter how many times you press. Picking the shard that reported longest
   * ago means repeated presses walk the whole list, and one press refreshes
   * whatever is most out of date — which is what someone pressing it wants.
   *
   * Takes the write times rather than reading them, because the same map
   * answers a second question further down — see `firstRun`.
   */
  const stalest = (written: Map<number, number>) => {
    let oldest = 0;
    for (let i = 1; i < SHARD_COUNT; i++) {
      // A shard that has never been written has no timestamp and wins outright.
      if ((written.get(i) ?? 0) < (written.get(oldest) ?? 0)) oldest = i;
    }
    return oldest;
  };

  /**
   * An explicit `shard=N`, validated rather than trusted.
   *
   * `Number('abc') % SHARD_COUNT` is `NaN`, and NaN sails straight through the
   * modulo: it slices nothing, then writes a blob named literally
   * `shard-NaN.json` whose body serializes `"shard": null`. That file is a
   * valid-looking shard forever after — it comes back from `readShards`, passes
   * `null < SHARD_COUNT`, and counts toward the "have all shards reported?"
   * test in `mergeShards`, so two real shards plus one ghost publishes a
   * coverage claim the boards never earned. A negative is the same story with a
   * `shard--1.json`. Refusing the request is the cheap end of that.
   */
  const requested = override != null && override !== 'stale' ? Number(override) : null;
  if (requested !== null && !Number.isInteger(requested)) {
    return Response.json(
      { error: `Invalid shard "${override}" — expected an integer or "stale"` },
      { status: 400 },
    );
  }

  // Held outside the try so a failed *write* still reports what the sweep
  // found. Those are separate failures and conflating them makes a missing
  // Blob store look like a broken sweep.
  let stats: Record<string, unknown> = {};

  try {
    /**
     * When each shard last reported, per the Blob API rather than the file
     * bodies — see `shardWrittenAt`. Read once and used twice: to pick the
     * stalest slice, and to tell a shard's first run from its later ones.
     *
     * Inside the try because it needs the Blob store, and a missing store
     * should come back as this route's own JSON error rather than an unhandled
     * throw on the way to it.
     */
    const written = await shardWrittenAt();

    // Default to the clock so consecutive cron firings walk the whole list.
    //
    // The bucket has to match the cron interval or the walk stops walking. This
    // was a 5-minute bucket while the cron fired every 5 minutes; against the
    // daily schedule it pinned every run to the same shard, because a day is
    // exactly 288 buckets and 288 % 12 === 0. One bucket per day advances by one.
    const shard = override === 'stale'
      ? stalest(written)
      // Double modulo so a negative lands in range rather than staying negative,
      // which JS `%` would otherwise carry through.
      : requested !== null
        ? ((requested % SHARD_COUNT) + SHARD_COUNT) % SHARD_COUNT
        : Math.floor(started / (24 * 60 * 60 * 1000)) % SHARD_COUNT;

    const boards = await discoverBoards();
    const slice = shardOf(boards, shard, SHARD_COUNT);

    // What to keep is the union of every account's job types, so one sweep
    // serves everybody and each browser narrows the result with its own
    // filters. Per-account sweeps would multiply the expensive half of this job
    // — the run visits every board either way, and the terms only decide what
    // survives — to change the half that is already free.
    //
    // The consequence to keep an eye on is size rather than time: the union
    // only grows, and the index has a cap. `unionTypes` in the response is that
    // number, reported on every run so it is visible before it is a problem.
    //
    // Falls back to the old design test on the paths that mean "no answer
    // stored": no database yet, no accounts yet, or every saved list edited down
    // to nothing. An empty list means "no narrowing" on the client, which is a
    // fine answer for 1,000 rows already in hand and a terrible one for 5,000
    // live boards.
    const jobTypes = await readAllJobTypes().catch(() => [] as string[]);

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
      // The number to watch: this only grows as accounts are added, and the
      // index has a size cap it will eventually meet.
      unionTypes: jobTypes.length,
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
      /**
       * Either test alone gets a different run wrong, so this asks both.
       *
       * "Nothing has ever been stamped" is what the migration run needs: the
       * index in Blob already had shard metadata for every shard and a
       * first-seen date on none of them, so asking whether the shard had
       * reported answered yes and would have stamped four thousand postings
       * `now` — the flood the baseline exists to prevent, on the one run where
       * it mattered most.
       *
       * On its own, though, it is wrong for every fresh deployment. `known`
       * comes from the *merged* index, so once any shard has run it is
       * non-empty — while `shardOf` hands the next shard a disjoint slice of
       * boards whose ids appear nowhere in it. Runs two and three of the first
       * lap therefore found nothing known, read that as "all new", and stamped
       * two thirds of the index with `now`. Every one of those postings then
       * carried a NEW badge for a week. Two presses of the Sweep button on a
       * new deployment were enough to do it.
       *
       * A shard that has never written a file has never baselined its boards,
       * whatever the rest of the index says — so that is the question, and the
       * emptiness test stays alongside it for the migration case.
       */
      firstRun: known.size === 0 || !written.has(shard),
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
