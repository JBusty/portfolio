/**
 * Jobwatch's user state — preferences, per-job triage, and the watchlist.
 *
 * This is the durable copy. localStorage remains as a fast local cache and as
 * the source for the one-time import, but the answer of record lives here so
 * clearing a browser, switching machines, or Safari evicting storage after a
 * week of inactivity no longer loses an application history.
 *
 * Every method is behind the same session check as the page. `isAuthed`
 * verifies the cookie signature — the proxy only checks that a cookie exists,
 * so this is the gate that actually holds.
 */

import {
  readCompanies, readJobState, readPrefs,
  writeCompanies, writeJobState, writePrefs, type CompanyRow,
} from '@/lib/jobwatch/db';
import { isAuthed } from '@/lib/jobwatch/session';
import type { JobState, Prefs } from '@/lib/jobwatch/types';

export const dynamic = 'force-dynamic';

const unauthorized = () => Response.json({ error: 'Unauthorized' }, { status: 401 });

export async function GET() {
  if (!(await isAuthed())) return unauthorized();

  try {
    const [prefs, jobState, companies] = await Promise.all([
      readPrefs(), readJobState(), readCompanies(),
    ]);
    return Response.json({ prefs, jobState, companies });
  } catch (err) {
    return Response.json(
      { error: (err as Error)?.message ?? 'Read failed' },
      { status: 500 },
    );
  }
}

type Payload = {
  prefs?: Prefs;
  jobState?: JobState;
  companies?: CompanyRow[];
};

/**
 * Partial by design: the client sends only the slice that changed, so flipping
 * one posting to applied does not rewrite the watchlist. An absent key is
 * "leave alone"; a present one is authoritative and replaces what is stored.
 */
export async function PUT(request: Request) {
  if (!(await isAuthed())) return unauthorized();

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return Response.json({ error: 'Malformed JSON' }, { status: 400 });
  }

  try {
    const writes: Array<Promise<void>> = [];
    if (body.prefs) writes.push(writePrefs(body.prefs));
    if (body.jobState) writes.push(writeJobState(body.jobState));
    if (body.companies) writes.push(writeCompanies(body.companies));

    if (writes.length === 0) {
      return Response.json({ error: 'Nothing to write' }, { status: 400 });
    }

    await Promise.all(writes);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: (err as Error)?.message ?? 'Write failed' },
      { status: 500 },
    );
  }
}
