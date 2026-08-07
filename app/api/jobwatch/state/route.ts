/**
 * One account's state — preferences, per-job triage, and the watchlist.
 *
 * This is now the *only* copy. It used to be the durable one behind a
 * localStorage working copy, and the pair had to be reconciled on every load
 * because either could be ahead. With accounts that arrangement stops being a
 * convenience and starts being a bug: the browser copy has no idea who is
 * signed in, so signing out and signing in as somebody else inherited the
 * previous person's filters and application log from local storage.
 *
 * So there is one answer, it lives here, and it is addressed by account. Being
 * signed out is not an error — it means there is nothing to read and nothing to
 * write, which the client renders as a session that works and does not persist.
 */

import {
  readCompanies, readJobState, readPrefs,
  writeCompanies, writeJobState, writePrefs, type CompanyRow,
} from '@/lib/jobwatch/db';
import { currentUserId } from '@/lib/jobwatch/auth';
import type { JobState, Prefs } from '@/lib/jobwatch/types';

export const dynamic = 'force-dynamic';

/**
 * 200 with an empty body, not 401.
 *
 * An anonymous visitor is using Jobwatch as intended, and answering their one
 * state request with an error would put a failure in the console of a session
 * that is working correctly — and tempt the client into retrying something that
 * will never succeed. `anonymous: true` says the same thing without lying about
 * whether the request went wrong.
 */
const anonymous = () =>
  Response.json({ anonymous: true, prefs: null, jobState: {}, companies: [] });

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return anonymous();

  try {
    const [prefs, jobState, companies] = await Promise.all([
      readPrefs(userId), readJobState(userId), readCompanies(userId),
    ]);
    return Response.json({ anonymous: false, prefs, jobState, companies });
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
 *
 * This one does refuse anonymously, and the asymmetry with GET is the point —
 * there is no row to write to, and silently accepting the write would tell the
 * client its changes were saved when nothing was.
 */
export async function PUT(request: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return Response.json(
      { error: 'Sign in to save', anonymous: true },
      { status: 401 },
    );
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return Response.json({ error: 'Malformed JSON' }, { status: 400 });
  }

  try {
    const writes: Array<Promise<void>> = [];
    if (body.prefs) writes.push(writePrefs(userId, body.prefs));
    if (body.jobState) writes.push(writeJobState(userId, body.jobState));
    if (body.companies) writes.push(writeCompanies(userId, body.companies));

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
