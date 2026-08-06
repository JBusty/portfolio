/**
 * Creates Jobwatch's tables. Idempotent — safe to re-run.
 *
 *   node --env-file=.env.local scripts/db-init.mjs
 *
 * Node loads .env.local here; only Next does that automatically, and this is a
 * plain script.
 */
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Run: vercel env pull .env.local --yes');
  process.exit(1);
}

const sql = neon(url);

// Single-user by construction: no user column anywhere, because the gate in
// session.ts decides whether a request reaches this data at all.
const STATEMENTS = [
  `create table if not exists prefs (
     id          text primary key,
     data        jsonb not null,
     updated_at  timestamptz not null default now()
   )`,

  `create table if not exists job_state (
     job_id         text primary key,
     first_seen     timestamptz not null,
     applied        boolean not null default false,
     applied_at     timestamptz,
     hidden         boolean not null default false,
     saved          boolean not null default false,
     dismiss_reason text,
     dismiss_note   text,
     snapshot       jsonb,
     updated_at     timestamptz not null default now()
   )`,

  // For databases created before the reason was asked for: `create table if
  // not exists` is a no-op on those, so the two columns have to be added on
  // their own. This is what re-running the script is for.
  //
  // Plain text, not an enum or a check constraint. The set of reasons belongs
  // to the client and will grow; constraining it here would turn adding one
  // into a migration, while an unrecognised value costs nothing — both readers
  // drop what they don't know.
  `alter table job_state add column if not exists dismiss_reason text`,
  `alter table job_state add column if not exists dismiss_note text`,

  `create table if not exists companies (
     key       text primary key,
     source    text not null,
     token     text not null,
     label     text not null,
     industry  text not null default 'other',
     added_at  timestamptz not null default now()
   )`,

  // The Applied tab is the one view that filters rather than reading everything,
  // and it is a small slice of the table — a partial index keeps it that size.
  `create index if not exists job_state_applied_idx
     on job_state (applied_at desc) where applied`,
];

for (const statement of STATEMENTS) {
  // `sql(...)` is tagged-template-only in @neondatabase/serverless v1; a plain
  // call throws. DDL has no interpolation, so `sql.query` is the right door.
  await sql.query(statement);
  console.log('ok:', statement.trim().split('\n')[0]);
}

const [{ count }] = await sql`
  select count(*)::int as count from information_schema.tables
  where table_schema = 'public' and table_name in ('prefs', 'job_state', 'companies')
`;
console.log(`\ntables present: ${count}/3`);
