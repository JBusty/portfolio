/**
 * Where the swept index lives.
 *
 * Vercel Blob, one public JSON object. The index is a few hundred KB, written
 * a handful of times an hour and read by every visitor, which is exactly what
 * Blob is for — and being public means the browser can fetch it straight from
 * the CDN without a function in the path.
 *
 * Nothing personal is stored here. The index is public job postings; applied,
 * saved and hidden state stays in the visitor's own localStorage and is never
 * sent anywhere.
 */

import { head, put } from '@vercel/blob';
import { EMPTY_INDEX, type JobIndex } from './sweep';

/** Fixed pathname so the public URL is stable across writes. */
const INDEX_PATH = 'jobwatch/index.json';

export const hasBlobStore = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** The public URL of the index, or null before the first sweep has written one. */
export async function indexUrl(): Promise<string | null> {
  if (!hasBlobStore()) return null;
  try {
    const meta = await head(INDEX_PATH);
    return meta.url;
  } catch {
    // `head` throws rather than returning null when the object doesn't exist,
    // which is the normal state before the first cron run.
    return null;
  }
}

export async function readIndex(): Promise<JobIndex> {
  const url = await indexUrl();
  if (!url) return EMPTY_INDEX;

  try {
    // `cache: 'no-store'` because the refresh job needs the current index to
    // merge into; a stale read here would silently drop other shards' results.
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return EMPTY_INDEX;
    const parsed = (await res.json()) as JobIndex;
    return parsed?.version === 1 && Array.isArray(parsed.jobs) ? parsed : EMPTY_INDEX;
  } catch {
    return EMPTY_INDEX;
  }
}

export async function writeIndex(index: JobIndex): Promise<string> {
  if (!hasBlobStore()) {
    throw new Error(
      'No Blob store connected. Add one to the project (Vercel dashboard → Storage → Blob) so BLOB_READ_WRITE_TOKEN is set.',
    );
  }

  const blob = await put(INDEX_PATH, JSON.stringify(index), {
    access: 'public',
    contentType: 'application/json',
    // Overwrite in place — a suffixed pathname would change the URL on every
    // write and leave the client chasing it.
    addRandomSuffix: false,
    allowOverwrite: true,
    // The client revalidates against the route handler, not this object.
    cacheControlMaxAge: 60,
  });

  return blob.url;
}
