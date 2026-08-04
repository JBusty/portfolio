/**
 * The sweep — server-side only.
 *
 * Probes a shard of boards, keeps only the design roles, and returns them in a
 * compact shape. This is the whole reason the work moved off the browser: a
 * full pass is roughly 15,900 requests and several hundred megabytes, of which
 * the useful residue is a few hundred postings and about 300KB.
 */

import { isDesignRole } from './classify';
import { fetchCompany } from './sources';
import type { Company, Job } from './types';
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

export type IndexedJob = Omit<Job, 'descriptionHtml'>;

export type SweepResult = {
  jobs: IndexedJob[];
  probed: number;
  live: number;
  withDesign: number;
  errors: number;
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
    industry: 'other',
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
  { deadline, signal }: { deadline: number; signal?: AbortSignal },
): Promise<SweepResult> {
  const jobs: IndexedJob[] = [];
  let probed = 0;
  let live = 0;
  let withDesign = 0;
  let errors = 0;

  let cursor = 0;

  const worker = async () => {
    while (cursor < boards.length && Date.now() < deadline && !signal?.aborted) {
      const ref = boards[cursor++];
      probed += 1;

      const timeout = AbortSignal.timeout(BOARD_TIMEOUT_MS);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

      try {
        const fetched = await fetchCompany(asCompany(ref), combined);
        if (fetched.length === 0) continue;
        live += 1;

        // The design test is the entire point of doing this server-side: it
        // turns ~13k postings a shard into a few dozen worth sending anywhere.
        const design = fetched.filter((job) => isDesignRole(job.title));
        if (design.length === 0) continue;
        withDesign += 1;

        for (const job of design) {
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

  return { jobs, probed, live, withDesign, errors };
}

/* ----------------------------------------------------------------- index */

export type JobIndex = {
  version: 1;
  /** When the last shard finished, epoch ms. */
  updatedAt: number;
  /** Which shards have reported in, so partial coverage is visible. */
  shards: Record<string, { at: number; probed: number; jobs: number }>;
  jobs: IndexedJob[];
};

export const EMPTY_INDEX: JobIndex = {
  version: 1,
  updatedAt: 0,
  shards: {},
  jobs: [],
};

/**
 * Folds a finished shard into the index.
 *
 * Every shard replaces only its own postings, so a shard that failed or has not
 * run yet leaves the previous pass's results in place rather than blanking
 * them. Job ids carry a source prefix and are unique across boards, so the
 * dedupe is exact rather than heuristic.
 */
export function mergeShard(
  index: JobIndex,
  shard: number,
  result: SweepResult,
  boardsInShard: BoardRef[],
  now = Date.now(),
): JobIndex {
  const keysInShard = new Set(boardsInShard.map((b) => `${b.source}:${b.token}`));

  const kept = index.jobs.filter((job) => !keysInShard.has(job.companyKey));
  const seen = new Set(kept.map((job) => job.id));

  for (const job of result.jobs) {
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    kept.push(job);
  }

  return {
    version: 1,
    updatedAt: now,
    shards: {
      ...index.shards,
      [shard]: { at: now, probed: result.probed, jobs: result.jobs.length },
    },
    jobs: kept,
  };
}
