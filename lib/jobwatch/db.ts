import 'server-only';

import { neon } from '@neondatabase/serverless';
import type { JobSnapshot, JobState, Prefs } from './types';

/**
 * Jobwatch's own storage.
 *
 * Everything here is single-user by construction: one row of prefs under a
 * fixed id, and job state keyed by the ATS's own job id. There are no accounts
 * and no user column, because there is one user and the gate in
 * `session.ts` is what decides whether a request gets this far.
 *
 * Timestamps are `timestamptz`, not epoch numbers, so the database can be read
 * and reasoned about on its own. The app works in epoch milliseconds, so the
 * conversion happens at this boundary and nowhere else.
 */

const OWNER = 'owner';

/**
 * Lazy, and deliberately not a module-level `neon(...)` call: that throws when
 * DATABASE_URL is absent, and Next evaluates module scope during `next build`,
 * so a missing env var would fail the build rather than the request.
 */
function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

const toMs = (value: Date | string | null): number | null =>
  value == null ? null : new Date(value).getTime();

/* ------------------------------------------------------------------ prefs */

export async function readPrefs(): Promise<Prefs | null> {
  const rows = await sql()`select data from prefs where id = ${OWNER}`;
  return (rows[0]?.data as Prefs | undefined) ?? null;
}

export async function writePrefs(prefs: Prefs): Promise<void> {
  await sql()`
    insert into prefs (id, data, updated_at)
    values (${OWNER}, ${JSON.stringify(prefs)}::jsonb, now())
    on conflict (id) do update set data = excluded.data, updated_at = now()
  `;
}

/* -------------------------------------------------------------- job state */

export async function readJobState(): Promise<JobState> {
  const rows = await sql()`
    select job_id, first_seen, applied, applied_at, hidden, saved, snapshot, changed_at
    from job_state
  `;

  const state: JobState = {};
  for (const row of rows) {
    const entry: JobState[string] = {
      firstSeen: toMs(row.first_seen as Date) ?? 0,
    };
    // Only set the optional fields when true/present, so the shape matches what
    // the client wrote rather than gaining a pile of explicit falses.
    if (row.applied) entry.applied = true;
    if (row.applied_at != null) entry.appliedAt = toMs(row.applied_at as Date) ?? undefined;
    if (row.hidden) entry.hidden = true;
    if (row.saved) entry.saved = true;
    if (row.snapshot) entry.snapshot = row.snapshot as JobSnapshot;
    if (row.changed_at != null) entry.updatedAt = toMs(row.changed_at as Date) ?? undefined;
    state[row.job_id as string] = entry;
  }
  return state;
}

/**
 * Writes the whole map in one statement.
 *
 * `unnest` turns the arrays into rows so this stays a single round trip
 * regardless of size — the alternative, one insert per job, is thousands of
 * network hops on a serverless connection.
 *
 * Upsert only: rows absent from `state` are left alone rather than deleted.
 * This started as a mirror, on the reasoning that the table should not grow
 * without bound — which is correct for one browser and destructive for two. A
 * second browser pushing its own map deleted the first one's applied and saved
 * flags, and neither the user nor the code had any way to notice. Flags still
 * propagate correctly without the delete, because clearing one leaves the row
 * present with the flag false; only a wholesale prune needs removal, and that
 * should be an explicit act rather than a side effect of every save.
 */
export async function writeJobState(state: JobState): Promise<void> {
  const ids = Object.keys(state);
  if (ids.length === 0) return;

  const firstSeen = ids.map((id) => new Date(state[id].firstSeen ?? Date.now()).toISOString());
  const applied = ids.map((id) => state[id].applied === true);
  const appliedAt = ids.map((id) =>
    state[id].appliedAt != null ? new Date(state[id].appliedAt as number).toISOString() : null);
  const hidden = ids.map((id) => state[id].hidden === true);
  const saved = ids.map((id) => state[id].saved === true);
  const snapshot = ids.map((id) =>
    state[id].snapshot ? JSON.stringify(state[id].snapshot) : null);
  // The client's own stamp, not now(): `updated_at` records when the row was
  // written, `changed_at` records when you last decided something. Only the
  // second is comparable across browsers, which is what reconciling needs.
  const changedAt = ids.map((id) =>
    state[id].updatedAt != null ? new Date(state[id].updatedAt as number).toISOString() : null);

  await sql()`
    insert into job_state (job_id, first_seen, applied, applied_at, hidden, saved, snapshot, changed_at, updated_at)
    select t.job_id, t.first_seen, t.applied, t.applied_at, t.hidden, t.saved, t.snapshot, t.changed_at, now()
    from unnest(
      ${ids}::text[],
      ${firstSeen}::timestamptz[],
      ${applied}::boolean[],
      ${appliedAt}::timestamptz[],
      ${hidden}::boolean[],
      ${saved}::boolean[],
      ${snapshot}::jsonb[],
      ${changedAt}::timestamptz[]
    ) as t(job_id, first_seen, applied, applied_at, hidden, saved, snapshot, changed_at)
    on conflict (job_id) do update set
      first_seen = excluded.first_seen,
      applied    = excluded.applied,
      applied_at = excluded.applied_at,
      hidden     = excluded.hidden,
      saved      = excluded.saved,
      snapshot   = excluded.snapshot,
      changed_at = excluded.changed_at,
      updated_at = now()
  `;
}

/* -------------------------------------------------------------- companies */

export type CompanyRow = {
  key: string;
  source: string;
  token: string;
  label: string;
  industry: string;
};

export async function readCompanies(): Promise<CompanyRow[]> {
  const rows = await sql()`
    select key, source, token, label, industry from companies order by key
  `;
  return rows as CompanyRow[];
}

export async function writeCompanies(companies: CompanyRow[]): Promise<void> {
  if (companies.length === 0) {
    await sql()`delete from companies`;
    return;
  }

  const keys = companies.map((c) => c.key);
  await sql()`
    insert into companies (key, source, token, label, industry)
    select * from unnest(
      ${keys}::text[],
      ${companies.map((c) => c.source)}::text[],
      ${companies.map((c) => c.token)}::text[],
      ${companies.map((c) => c.label)}::text[],
      ${companies.map((c) => c.industry)}::text[]
    )
    on conflict (key) do update set
      source = excluded.source,
      token = excluded.token,
      label = excluded.label,
      industry = excluded.industry
  `;
  await sql()`delete from companies where key <> all(${keys}::text[])`;
}
