/**
 * Creates and migrates Jobwatch's tables. Idempotent — safe to re-run, and
 * meant to be, since the statements are the schema's definition rather than a
 * one-shot migration.
 *
 *   node --env-file=.env.local scripts/db-init.mjs
 *
 * Node loads .env.local here; only Next does that automatically, and this is a
 * plain script. The statements themselves live in `db-schema.mjs` so the
 * rehearsal in `db-migrate-check.mjs` runs the real ones.
 */
import { neon } from '@neondatabase/serverless';
import { OWNER_EMAIL, statements } from './db-schema.mjs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Run: vercel env pull .env.local --yes');
  process.exit(1);
}

const sql = neon(url);

for (const statement of statements()) {
  // `sql(...)` is tagged-template-only in @neondatabase/serverless v1; a plain
  // call throws. DDL has no interpolation, so `sql.query` is the right door.
  await sql.query(statement);
  console.log('ok:', statement.trim().split('\n')[0].slice(0, 76));
}

/* --------------------------------------------------------------- report */

const [{ count }] = await sql`
  select count(*)::int as count from information_schema.tables
  where table_schema = 'public'
    and table_name in ('users', 'prefs', 'job_state', 'companies')
`;

// Per account, because "did the data survive" is a question about whose it is
// now — a total would look identical whether the backfill worked or not.
const owned = await sql`
  select u.email,
         u.clerk_id is not null as linked,
         (select count(*)::int from job_state s where s.user_id = u.id) as jobs,
         (select count(*)::int from job_state s where s.user_id = u.id and s.applied) as applied,
         (select count(*)::int from job_state s where s.user_id = u.id and s.hidden)  as dismissed,
         (select count(*)::int from companies c where c.user_id = u.id) as boards,
         (select count(*)::int from prefs p where p.user_id = u.id)     as prefs
  from users u order by u.created_at
`;

const [{ orphans }] = await sql`
  select (select count(*)::int from job_state where user_id is null) as orphans
`;

console.log(`\ntables present: ${count}/4   owner: ${OWNER_EMAIL}`);
console.table(owned);
if (orphans > 0) console.error(`WARNING: ${orphans} job_state rows belong to nobody`);
