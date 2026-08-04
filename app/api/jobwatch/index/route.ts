/**
 * The index the browser reads.
 *
 * One request, a few hundred KB, already filtered to design roles — instead of
 * the client opening a connection per board and pulling tens of megabytes it
 * would immediately throw away.
 *
 * Redirects to the Blob object rather than proxying it, so the payload comes
 * off the CDN and this function stays out of the data path.
 */

import { indexUrl } from '@/lib/jobwatch/index-store';
import { EMPTY_INDEX } from '@/lib/jobwatch/sweep';

export const dynamic = 'force-dynamic';

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
