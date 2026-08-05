/**
 * The sweep — server-side only.
 *
 * Probes a shard of boards, keeps the titles worth keeping, and returns them in
 * a compact shape. This is the whole reason the work moved off the browser: a
 * full pass is roughly 15,900 requests and several hundred megabytes, of which
 * the useful residue is a few hundred postings and about 300KB.
 *
 * Which titles are worth keeping is the caller's decision now — it comes from
 * the saved job types — so the ~13k-to-a-few-hundred cut this makes is the
 * user's own filter running before the network, rather than a rule compiled in.
 */

import { fetchCompany } from './sources';
import { PRE_EXISTING, type Company, type Job } from './types';
import type { BoardRef } from './discover';

/**
 * How many boards to probe at once.
 *
 * Higher finishes the shard sooner but these are three small public APIs being
 * hit by a scheduled job with no business degrading them, so this stays modest.
 */
const CONCURRENCY = 16;

/** A board that answers slowly is not worth the shard's remaining budget. */
const BOARD_TIMEOUT_MS = 15_000;

/**
 * Ceiling on a shard's contribution to the index.
 *
 * The title test used to be a fixed rule, so its yield was known — a few
 * hundred postings a shard. It is editable now, and a term like "engineer" or
 * "manager" matches a large fraction of everything on 5,000 boards. Without a
 * stop, one careless entry writes a blob every visitor then downloads. At this
 * size the index stays well under a megabyte; past it the sweep stops keeping
 * and says so in `capped`.
 */
const MAX_JOBS = 4_000;

export type IndexedJob = Omit<Job, 'descriptionHtml'>;

export type SweepResult = {
  jobs: IndexedJob[];
  probed: number;
  live: number;
  /** Boards that had at least one posting matching the job types. */
  withMatches: number;
  errors: number;
  /** True when the cap stopped the shard early — the job types are too broad. */
  capped: boolean;
};

/**
 * `fetchCompany` wants a full `Company`; discovery only has a source and token.
 * The label is corrected from the payload for Greenhouse (which reports a real
 * company name) and falls back to the token elsewhere.
 */
function asCompany({ source, token }: BoardRef): Company {
  return {
    key: `${source}:${token}`,
    source,
    token,
    label: token,
  };
}

/**
 * Sweeps a slice of boards.
 *
 * `deadline` is a wall-clock cutoff: a serverless invocation is capped, and
 * returning a partial shard is far better than being killed mid-write and
 * leaving the index stale. Boards not reached this run are reached next run.
 */
export async function sweepBoards(
  boards: BoardRef[],
  { deadline, signal, keep, cap = MAX_JOBS }: {
    deadline: number;
    signal?: AbortSignal;
    /** Title test. The saved job types, compiled by the caller. */
    keep: (title: string) => boolean;
    /** Ceiling on what one shard contributes — see `MAX_JOBS`. */
    cap?: number;
  },
): Promise<SweepResult> {
  const jobs: IndexedJob[] = [];
  let probed = 0;
  let live = 0;
  let withMatches = 0;
  let errors = 0;
  let capped = false;

  let cursor = 0;

  const worker = async () => {
    while (
      cursor < boards.length
      && Date.now() < deadline
      && !signal?.aborted
      && jobs.length < cap
    ) {
      const ref = boards[cursor++];
      probed += 1;

      const timeout = AbortSignal.timeout(BOARD_TIMEOUT_MS);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

      try {
        const fetched = await fetchCompany(asCompany(ref), combined);
        if (fetched.length === 0) continue;
        live += 1;

        // The title test is the entire point of doing this server-side: it
        // turns ~13k postings a shard into a few dozen worth sending anywhere.
        const matched = fetched.filter((job) => keep(job.title));
        if (matched.length === 0) continue;
        withMatches += 1;

        for (const job of matched) {
          if (jobs.length >= cap) { capped = true; break; }
          const { descriptionHtml: _drop, ...rest } = job;
          jobs.push(rest);
        }
      } catch {
        // A dead token, a 404, a rename. Expected at this volume and not worth
        // a log line each — the counts are the signal.
        errors += 1;
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, boards.length) }, worker),
  );

  return { jobs, probed, live, withMatches, errors, capped: capped || jobs.length >= cap };
}

/* ----------------------------------------------------------------- index */

export type JobIndex = {
  version: 1;
  /** When the last shard finished, epoch ms. */
  updatedAt: number;
  /** Which shards have reported in, so partial coverage is visible. */
  shards: Record<string, { at: number; probed: number; jobs: number }>;
  /**
   * Job types every shard has been swept with — see `mergeShards`.
   *
   * This is what makes "your terms are ahead of the index" a real question
   * rather than a guess. A term missing from here has not been put to the
   * boards, so no amount of filtering will surface it and the only remedy is a
   * sweep. Empty on an index built before this field existed, which reads as
   * "nothing known to be covered" — conservative in the right direction.
   */
  types: string[];
  jobs: IndexedJob[];
};

export const EMPTY_INDEX: JobIndex = {
  version: 1,
  updatedAt: 0,
  shards: {},
  types: [],
  jobs: [],
};

/**
 * Stamps each posting with when the index first saw it.
 *
 * "New" has to be a property of the posting, not of your browser. It used to be
 * neither: `observeJobs` writes a per-browser stamp on the local-watchlist path,
 * and that path stops running the moment the index has postings — so nothing in
 * the index carried a first-seen date at all and every reader of one silently
 * gave up (see `firstSeenOf`).
 *
 * `known` is the previous *merged* index's stamps rather than this shard's own
 * previous file, because `shardOf` cuts a growing list into contiguous slices:
 * boards found by the next harvest push everything after them along, so a
 * posting changes shard routinely without being any newer than it was
 * yesterday. Keyed by job id, the merged index is immune to that.
 *
 * `firstRun` says the index has never stamped anything, so every posting is
 * unrecorded for want of a record rather than for being new. Stamping those
 * `now` would declare a few thousand postings new and keep declaring them new
 * for a week; they get `PRE_EXISTING` instead — the same baseline `observeJobs`
 * writes on the client, for the same reason. It costs one quiet lap, after
 * which the number means what it says.
 */
export function stampFirstSeen(
  jobs: IndexedJob[],
  known: Map<string, number>,
  { firstRun, now = Date.now() }: { firstRun: boolean; now?: number },
): IndexedJob[] {
  return jobs.map((job) => ({
    ...job,
    firstSeen: known.get(job.id) ?? (firstRun ? PRE_EXISTING : now),
  }));
}
