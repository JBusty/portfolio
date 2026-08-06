/**
 * Where the swept index lives.
 *
 * Vercel Blob, public JSON. The index is a few hundred KB, written a handful of
 * times an hour and read by every visitor, which is exactly what Blob is for —
 * and being public means the browser fetches it straight from the CDN with no
 * function in the path.
 *
 * Each shard owns its own object and only ever writes that one; the merged
 * index is rebuilt from all of them. The obvious alternative — read index,
 * merge, write index — looks fine and silently loses data: blob URLs are
 * CDN-cached, so a shard reading immediately after the previous shard wrote
 * gets the stale copy and overwrites it. That is not a race you can win by
 * being careful about ordering, because the staleness is downstream of the
 * write. Sharded objects remove the read-modify-write entirely: a stale read of
 * someone else's shard costs you one refresh cycle of freshness, never a
 * posting.
 *
 * Nothing personal is stored here. The index is public job postings; applied,
 * applied and hidden state stays in the visitor's own localStorage.
 */

import { head, list, put } from '@vercel/blob';
import { EMPTY_INDEX, type IndexedJob, type JobIndex } from './sweep';
import type { SourceKind } from './types';

const INDEX_PATH = 'jobwatch/index.json';
const SHARD_PREFIX = 'jobwatch/shard-';
const HARVEST_PATH = 'jobwatch/harvest.json';

export type ShardFile = {
  shard: number;
  at: number;
  probed: number;
  /**
   * The job types this shard was swept with.
   *
   * Recorded because it is the only way to answer the question the Sweep button
   * exists for: is there a term the boards have not actually been searched for?
   * A posting can only be in the index if some shard was run with a term that
   * matched it, so the terms are as much a part of a shard's result as its
   * postings are. Empty means the shard ran on the built-in design test.
   */
  types: string[];
  jobs: IndexedJob[];
};

export const hasBlobStore = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/**
 * Reads a blob. There is no way to make this bypass the CDN — measured.
 *
 * This used to append `?t=${Date.now()}` on the reasoning that a unique query
 * string forces a fresh copy. It does not: Blob's CDN does not include the
 * query in its cache key, and three requests with different `?t=` values came
 * back with the same `age` and the same `etag`, all `x-vercel-cache: HIT`.
 *
 * Blob also floors `cacheControlMaxAge` at 60 seconds, so even an object
 * written with 0 is served `public, max-age=60`. Between them, anything read
 * back within a minute of being written may be the previous version.
 *
 * The consequence is a rule rather than a workaround: never re-read something
 * this process just wrote. `refresh/route.ts` merges its own shard from memory
 * for exactly this reason.
 */
async function readJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** The public URL of the merged index, or null before the first sweep. */
export async function indexUrl(): Promise<string | null> {
  if (!hasBlobStore()) return null;
  try {
    return (await head(INDEX_PATH)).url;
  } catch {
    // `head` throws rather than returning null when the object is absent,
    // which is the normal state before the first cron run.
    return null;
  }
}

export async function readIndex(): Promise<JobIndex> {
  const url = await indexUrl();
  if (!url) return EMPTY_INDEX;
  const parsed = await readJson<JobIndex>(url);
  return parsed?.version === 1 && Array.isArray(parsed.jobs) ? parsed : EMPTY_INDEX;
}

function requireStore(): void {
  if (!hasBlobStore()) {
    throw new Error(
      'No Blob store connected. Add one to the project so BLOB_READ_WRITE_TOKEN is set.',
    );
  }
}

/** Writes one shard's results. The only object this shard ever touches. */
export async function writeShard(file: ShardFile): Promise<void> {
  requireStore();
  await put(`${SHARD_PREFIX}${file.shard}.json`, JSON.stringify(file), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    // Asks for no caching. Blob floors this at 60 seconds and serves the object
    // `public, max-age=60` regardless — verified against the live store — so
    // this is a statement of intent, not a guarantee. The merge step does not
    // rely on it; see `readJson`.
    cacheControlMaxAge: 0,
  });
}

/**
 * When each shard was last written, per the Blob API rather than its contents.
 *
 * The `at` inside a shard file is read back through the CDN, so for the first
 * minute after a write it still reports the previous run. Choosing the stalest
 * shard from that made the Sweep button re-pick the shard it had just finished:
 * pressed twice in a row it swept shard 1, then shard 1 again.
 *
 * `list()` answers from the API, so `uploadedAt` is accurate the moment a write
 * lands. It is the only clock here that can be trusted immediately.
 */
export async function shardWrittenAt(): Promise<Map<number, number>> {
  requireStore();
  const { blobs } = await list({ prefix: SHARD_PREFIX });

  const out = new Map<number, number>();
  for (const blob of blobs) {
    const n = Number(blob.pathname.slice(SHARD_PREFIX.length).replace(/\.json$/, ''));
    if (Number.isInteger(n)) out.set(n, new Date(blob.uploadedAt).getTime());
  }
  return out;
}

/**
 * Every shard file in the store.
 *
 * `shard` has to be an integer to count, not merely present. A run given a
 * junk `?shard=` used to write a file whose number serialized as `null`, and a
 * null shard reads as 0 in every comparison downstream — it sorted, it passed
 * range filters, and it counted toward the "have all shards reported?" test in
 * `mergeShards` while contributing no postings. The route rejects that request
 * now, but the files it already wrote are still sitting in Blob, so the guard
 * belongs on the read as well as the write.
 */
export async function readShards(): Promise<ShardFile[]> {
  requireStore();
  const { blobs } = await list({ prefix: SHARD_PREFIX });

  const files = await Promise.all(blobs.map((b) => readJson<ShardFile>(b.url)));
  return files
    .filter((f): f is ShardFile =>
      f != null && Array.isArray(f.jobs) && Number.isInteger(f.shard) && f.shard >= 0)
    .sort((a, b) => a.shard - b.shard);
}

/**
 * Rebuilds the merged index from every shard that has reported.
 *
 * Job ids carry a source prefix and are unique across boards, so the dedupe is
 * exact. A shard that has never run simply contributes nothing rather than
 * blanking anything.
 */
export function mergeShards(
  shards: ShardFile[],
  now = Date.now(),
  shardCount = shards.length,
): JobIndex {
  const jobs: IndexedJob[] = [];
  const seen = new Set<string>();
  const meta: JobIndex['shards'] = {};

  /**
   * A term counts as swept only when *every* shard has run with it.
   *
   * The intersection, not the union: shards cover different thirds of the board
   * list, so a term one shard has searched for has been searched across a third
   * of the boards. Claiming that as covered is how the button would go quiet
   * while two thirds of the list had never been asked the question.
   */
  let covered: Set<string> | null = null;

  for (const file of shards) {
    meta[file.shard] = { at: file.at, probed: file.probed, jobs: file.jobs.length };

    const theirs = new Set<string>(file.types ?? []);
    if (covered === null) {
      covered = theirs;
    } else {
      const previous: Set<string> = covered;
      covered = new Set([...previous].filter((term) => theirs.has(term)));
    }

    for (const job of file.jobs) {
      if (seen.has(job.id)) continue;
      seen.add(job.id);
      jobs.push(job);
    }
  }

  // A shard that has never reported has searched for nothing, so nothing is
  // fully covered until all of them have run at least once.
  const complete = shards.length >= shardCount;

  return {
    version: 1,
    updatedAt: now,
    shards: meta,
    types: complete ? [...(covered ?? [])] : [],
    jobs,
  };
}

/* --------------------------------------------------------------- harvest */

/**
 * Board tokens found by crawling, kept beside the index.
 *
 * These are the tokens no upstream list publishes — SmartRecruiters, Workday,
 * Breezy and Rippling boards discovered through Built In. They live in Blob
 * rather than in the source because they change as companies start and stop
 * hiring, and a committed list would go stale between deploys.
 */
export type HarvestFile = {
  version: 1;
  updatedAt: number;
  tokens: Partial<Record<SourceKind, string[]>>;
};

const EMPTY_HARVEST: HarvestFile = { version: 1, updatedAt: 0, tokens: {} };

export async function readHarvest(): Promise<HarvestFile> {
  if (!hasBlobStore()) return EMPTY_HARVEST;
  let url: string;
  try {
    url = (await head(HARVEST_PATH)).url;
  } catch {
    // Absent until the first harvest run, which is the normal state.
    return EMPTY_HARVEST;
  }
  const parsed = await readJson<HarvestFile>(url);
  return parsed?.version === 1 && parsed.tokens ? parsed : EMPTY_HARVEST;
}

/**
 * Merges new tokens into the stored set.
 *
 * Additive on purpose, and symmetrical with the rule in `discover.ts` that
 * nothing ever removes a board. A harvest that hits a Cloudflare interstitial
 * and comes back with three tokens must not be able to delete the four hundred
 * a good run found yesterday.
 */
export async function writeHarvest(
  found: Array<{ source: SourceKind; token: string }>,
  now = Date.now(),
): Promise<HarvestFile> {
  requireStore();
  const existing = await readHarvest();

  const tokens: Partial<Record<SourceKind, string[]>> = {};
  for (const [source, list_] of Object.entries(existing.tokens)) {
    tokens[source as SourceKind] = [...(list_ ?? [])];
  }
  for (const { source, token } of found) {
    const bucket = (tokens[source] ??= []);
    if (!bucket.includes(token)) bucket.push(token);
  }
  for (const key of Object.keys(tokens) as SourceKind[]) {
    tokens[key]?.sort();
  }

  const file: HarvestFile = { version: 1, updatedAt: now, tokens };
  await put(HARVEST_PATH, JSON.stringify(file), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
  return file;
}

export async function writeIndex(index: JobIndex): Promise<string> {
  requireStore();
  const blob = await put(INDEX_PATH, JSON.stringify(index), {
    access: 'public',
    contentType: 'application/json',
    // Overwrite in place — a suffixed pathname would change the URL on every
    // write and leave the client chasing it.
    addRandomSuffix: false,
    allowOverwrite: true,
    // Short enough that a visitor never sits on an hour-old board, long enough
    // that repeat views come off the edge.
    cacheControlMaxAge: 60,
  });
  return blob.url;
}
