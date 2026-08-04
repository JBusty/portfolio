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
 * saved and hidden state stays in the visitor's own localStorage.
 */

import { head, list, put } from '@vercel/blob';
import { EMPTY_INDEX, type IndexedJob, type JobIndex } from './sweep';

const INDEX_PATH = 'jobwatch/index.json';
const SHARD_PREFIX = 'jobwatch/shard-';

export type ShardFile = {
  shard: number;
  at: number;
  probed: number;
  jobs: IndexedJob[];
};

export const hasBlobStore = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/**
 * Blob serves these through the CDN, and `cache: 'no-store'` only bypasses
 * Next's own fetch cache — not the edge. A unique query string is what actually
 * gets a fresh copy.
 */
async function readJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
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
    // Shard files are internal plumbing read only by the merge step, and that
    // step needs them fresh.
    cacheControlMaxAge: 0,
  });
}

export async function readShards(): Promise<ShardFile[]> {
  requireStore();
  const { blobs } = await list({ prefix: SHARD_PREFIX });

  const files = await Promise.all(blobs.map((b) => readJson<ShardFile>(b.url)));
  return files
    .filter((f): f is ShardFile => f != null && Array.isArray(f.jobs))
    .sort((a, b) => a.shard - b.shard);
}

/**
 * Rebuilds the merged index from every shard that has reported.
 *
 * Job ids carry a source prefix and are unique across boards, so the dedupe is
 * exact. A shard that has never run simply contributes nothing rather than
 * blanking anything.
 */
export function mergeShards(shards: ShardFile[], now = Date.now()): JobIndex {
  const jobs: IndexedJob[] = [];
  const seen = new Set<string>();
  const meta: JobIndex['shards'] = {};

  for (const file of shards) {
    meta[file.shard] = { at: file.at, probed: file.probed, jobs: file.jobs.length };
    for (const job of file.jobs) {
      if (seen.has(job.id)) continue;
      seen.add(job.id);
      jobs.push(job);
    }
  }

  return { version: 1, updatedAt: now, shards: meta, jobs };
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
