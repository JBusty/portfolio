import 'server-only';

import { neon } from '@neondatabase/serverless';
import type { DismissReason, JobSnapshot, JobState, Prefs } from './types';

/**
 * Jobwatch's own storage.
 *
 * Every row belongs to an account. That was not true until recently — there was
 * one user, one row of prefs under the literal id 'owner', and job state keyed
 * by the ATS's job id alone — and the shape of that assumption reached further
 * than it looked: keying triage by job id meant two people could not both hold
 * an opinion about the same posting, which is the one thing a job board has to
 * support. The key is `(user_id, job_id)` now, and `user_id` is not optional
 * anywhere.
 *
 * Identity itself lives at Clerk. What lives here is a `users` row per account,
 * so a posting's history is addressed by our own id rather than a vendor's —
 * see `resolveUser`, which is the only place the two are joined.
 *
 * Timestamps are `timestamptz`, not epoch numbers, so the database can be read
 * and reasoned about on its own. The app works in epoch milliseconds, so the
 * conversion happens at this boundary and nowhere else.
 */

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

/* ------------------------------------------------------------------ users */

/**
 * The local account id for a Clerk identity, creating it on first sight.
 *
 * Two lookups rather than one, because the second is a claim as well as an
 * insert. A `users` row can exist before its Clerk account does — the migration
 * seeded one holding everything the single-user version wrote — so signing up
 * with that address has to adopt the existing row instead of starting a second,
 * empty one beside it. `on conflict (email)` is what performs the adoption, and
 * it is safe to key on because Clerk only reports an email once it is verified;
 * an unverified address could otherwise claim somebody else's history.
 *
 * Called on every authenticated request. It is two indexed lookups against a
 * table with one row per user, and the first one hits on every request after
 * the first, so it is not worth a cache that could go stale against a rebind.
 */
export type Account = {
  id: string;
  /** May run the sweep and the harvest. Set in the database, not in code. */
  isAdmin: boolean;
};

export async function resolveUser(clerkId: string, email: string): Promise<Account> {
  const bound = await sql()`select id, is_admin from users where clerk_id = ${clerkId}`;
  if (bound[0]) return { id: bound[0].id as string, isAdmin: bound[0].is_admin === true };

  const rows = await sql()`
    insert into users (clerk_id, email)
    values (${clerkId}, ${email.toLowerCase()})
    on conflict (email) do update set clerk_id = excluded.clerk_id
    returning id, is_admin
  `;
  return { id: rows[0].id as string, isAdmin: rows[0].is_admin === true };
}

/* ------------------------------------------------------------------ prefs */

export async function readPrefs(userId: string): Promise<Prefs | null> {
  const rows = await sql()`select data from prefs where user_id = ${userId}`;
  return (rows[0]?.data as Prefs | undefined) ?? null;
}

export async function writePrefs(userId: string, prefs: Prefs): Promise<void> {
  await sql()`
    insert into prefs (user_id, data, updated_at)
    values (${userId}, ${JSON.stringify(prefs)}::jsonb, now())
    on conflict (user_id) do update set data = excluded.data, updated_at = now()
  `;
}

/**
 * Every job type any account is watching, lowercased and de-duplicated.
 *
 * This is what the sweep indexes on. One shared index built from the union,
 * rather than a sweep per account: the run visits every board on the internet
 * either way — the terms only decide what is *kept* — so per-user sweeps would
 * multiply the expensive half of the job to change the cheap half. Each browser
 * then narrows the shared index with its own filters, which is what the client
 * already did when there was one user.
 *
 * The consequence worth knowing: a term one person adds surfaces those postings
 * for everybody on the next sweep, and the index has a size cap. See the
 * `unionTypes` count reported by the refresh route, which is the number to watch
 * if it ever starts hitting that cap.
 */
export async function readAllJobTypes(): Promise<string[]> {
  const rows = await sql()`
    select distinct lower(trim(t.term)) as term
    from prefs p, jsonb_array_elements_text(p.data -> 'jobTypes') as t(term)
    where jsonb_typeof(p.data -> 'jobTypes') = 'array'
  `;
  return rows.map((row) => row.term as string).filter(Boolean);
}

/* -------------------------------------------------------------- job state */

/**
 * `saved` is deliberately not selected. The column is still there — it is
 * `not null default false`, so leaving it alone costs nothing and dropping it
 * would throw away the only record of what was starred — but the feature is
 * gone and nothing reads the flag.
 */
export async function readJobState(userId: string): Promise<JobState> {
  const rows = await sql()`
    select job_id, first_seen, applied, applied_at, hidden,
           dismiss_reason, dismiss_note, snapshot, changed_at
    from job_state
    where user_id = ${userId}
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
    // Validated on the way in rather than here: `store.ts` drops a reason this
    // build doesn't know, which is the same guard every reader needs.
    if (row.dismiss_reason) entry.dismissReason = row.dismiss_reason as DismissReason;
    if (row.dismiss_note) entry.dismissNote = row.dismiss_note as string;
    if (row.snapshot) entry.snapshot = row.snapshot as JobSnapshot;
    if (row.changed_at != null) entry.updatedAt = toMs(row.changed_at as Date) ?? undefined;
    state[row.job_id as string] = entry;
  }
  return state;
}

/**
 * Writes one account's whole map in one statement.
 *
 * `unnest` turns the arrays into rows so this stays a single round trip
 * regardless of size — the alternative, one insert per job, is thousands of
 * network hops on a serverless connection. The account id is a scalar in the
 * select rather than a fourth array: it is the same for every row by
 * definition, and sending 12,000 copies of it would only be a way to get one of
 * them wrong.
 *
 * Upsert only: rows absent from `state` are left alone rather than deleted.
 * This started as a mirror, on the reasoning that the table should not grow
 * without bound — which is correct for one browser and destructive for two. A
 * second browser pushing its own map deleted the first one's flags, and neither
 * the user nor the code had any way to notice. Flags still propagate correctly
 * without the delete, because clearing one leaves the row present with the flag
 * false; only a wholesale prune needs removal, and that should be an explicit
 * act rather than a side effect of every save.
 */
export async function writeJobState(userId: string, state: JobState): Promise<void> {
  const ids = Object.keys(state);
  if (ids.length === 0) return;

  const firstSeen = ids.map((id) => new Date(state[id].firstSeen ?? Date.now()).toISOString());
  const applied = ids.map((id) => state[id].applied === true);
  const appliedAt = ids.map((id) =>
    state[id].appliedAt != null ? new Date(state[id].appliedAt as number).toISOString() : null);
  const hidden = ids.map((id) => state[id].hidden === true);
  // Null rather than absent, so restoring a posting clears the reason here too
  // — an upsert that left the old value behind would keep a retracted
  // dismissal in the tuning counts forever.
  const dismissReason = ids.map((id) => state[id].dismissReason ?? null);
  const dismissNote = ids.map((id) => state[id].dismissNote ?? null);
  const snapshot = ids.map((id) =>
    state[id].snapshot ? JSON.stringify(state[id].snapshot) : null);
  // The client's own stamp, not now(): `updated_at` records when the row was
  // written, `changed_at` records when you last decided something. Only the
  // second is comparable across browsers, which is what reconciling needs.
  const changedAt = ids.map((id) =>
    state[id].updatedAt != null ? new Date(state[id].updatedAt as number).toISOString() : null);

  await sql()`
    insert into job_state (
      user_id, job_id, first_seen, applied, applied_at, hidden,
      dismiss_reason, dismiss_note, snapshot, changed_at, updated_at
    )
    select ${userId}::uuid, t.job_id, t.first_seen, t.applied, t.applied_at, t.hidden,
           t.dismiss_reason, t.dismiss_note, t.snapshot, t.changed_at, now()
    from unnest(
      ${ids}::text[],
      ${firstSeen}::timestamptz[],
      ${applied}::boolean[],
      ${appliedAt}::timestamptz[],
      ${hidden}::boolean[],
      ${dismissReason}::text[],
      ${dismissNote}::text[],
      ${snapshot}::jsonb[],
      ${changedAt}::timestamptz[]
    ) as t(
      job_id, first_seen, applied, applied_at, hidden,
      dismiss_reason, dismiss_note, snapshot, changed_at
    )
    on conflict (user_id, job_id) do update set
      first_seen     = excluded.first_seen,
      applied        = excluded.applied,
      applied_at     = excluded.applied_at,
      hidden         = excluded.hidden,
      dismiss_reason = excluded.dismiss_reason,
      dismiss_note   = excluded.dismiss_note,
      snapshot       = excluded.snapshot,
      changed_at     = excluded.changed_at,
      updated_at     = now()
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

export async function readCompanies(userId: string): Promise<CompanyRow[]> {
  const rows = await sql()`
    select key, source, token, label, industry
    from companies where user_id = ${userId} order by key
  `;
  return rows as CompanyRow[];
}

export async function writeCompanies(userId: string, companies: CompanyRow[]): Promise<void> {
  if (companies.length === 0) {
    await sql()`delete from companies where user_id = ${userId}`;
    return;
  }

  const keys = companies.map((c) => c.key);
  await sql()`
    insert into companies (user_id, key, source, token, label, industry)
    select ${userId}::uuid, * from unnest(
      ${keys}::text[],
      ${companies.map((c) => c.source)}::text[],
      ${companies.map((c) => c.token)}::text[],
      ${companies.map((c) => c.label)}::text[],
      ${companies.map((c) => c.industry)}::text[]
    )
    on conflict (user_id, key) do update set
      source = excluded.source,
      token = excluded.token,
      label = excluded.label,
      industry = excluded.industry
  `;
  // Scoped, unlike everything above it — this one deletes, and an unscoped
  // delete here would clear every other account's watchlist on every save.
  await sql()`
    delete from companies where user_id = ${userId} and key <> all(${keys}::text[])
  `;
}
