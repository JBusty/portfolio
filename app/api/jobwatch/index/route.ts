/**
 * The index the browser reads.
 *
 * One request, a few hundred KB, already filtered to the job types being
 * watched — instead of the client opening a connection per board and pulling
 * tens of megabytes it would immediately throw away.
 *
 * Redirects to the Blob object rather than proxying it, so the payload comes
 * off the CDN and this function stays out of the data path.
 */

import { indexUrl } from '@/lib/jobwatch/index-store';
import { EMPTY_INDEX } from '@/lib/jobwatch/sweep';

export const dynamic = 'force-dynamic';

/**
 * There is deliberately no "give me a fresh one" mode.
 *
 * The obvious one — redirect to `${url}?t=${Date.now()}` — does nothing: Blob's
 * CDN does not include the query string in its cache key, so three requests
 * with different values come back with one `age` and one `etag`. Proxying the
 * body through this function instead would not help either, because the
 * server-side fetch hits the same edge.
 *
 * So the copy served here is always up to 60 seconds old, and that is fine for
 * arriving on the page. The one caller that cannot tolerate it — the client
 * immediately after a sweep — gets the index back in the sweep's own response
 * instead. See `refresh/route.ts`.
 */
export async function GET() {
  const url = await indexUrl();

  if (!url) {
    // No Blob store, or the first sweep hasn't run. An empty index is a valid
    // answer — the client renders "nothing tracked yet" rather than an error.
    return Response.json(EMPTY_INDEX, {
      headers: { 'cache-control': 'public, max-age=30' },
    });
  }

  return Response.redirect(url, 307);
}
