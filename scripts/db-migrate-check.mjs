/**
 * Proves the schema statements on throwaway schemas, both ways in.
 *
 *   node --env-file=.env.local scripts/db-migrate-check.mjs
 *
 * Two fixtures, because there are two databases this has to be correct for: a
 * legacy one carrying the single-user shape, and an empty one. Both are built
 * here rather than copied from `public`, which is the difference between a test
 * and a stunt — an earlier version cloned the live tables, which worked exactly
 * once and then started reporting failures the moment `public` was migrated and
 * there was no old shape left to clone.
 *
 * Nothing here touches `public`. Both scratch schemas are dropped on the way
 * out, including when an assertion throws.
 */
import { neon } from '@neondatabase/serverless';
import { OWNER_EMAIL, statements } from './db-schema.mjs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(url);
const LEGACY = 'jw_check_legacy';
const FRESH = 'jw_check_fresh';

let failures = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
};

const run = async (schema) => {
  for (const statement of statements({ schema })) {
    try {
      await sql.query(statement);
    } catch (err) {
      failures += 1;
      console.log('FAIL statement:', statement.trim().split('\n')[0].slice(0, 66));
      console.log('      ', err.message);
    }
  }
};

const pk = async (schema, table) => {
  const rows = await sql.query(`
    select a.attname from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid = '${schema}.${table}'::regclass and i.indisprimary
    order by a.attname
  `);
  return rows.map((r) => r.attname);
};

/**
 * The shape as it stood when there was one user: prefs under the literal id
 * 'owner', triage keyed by job id alone, and no user column anywhere.
 */
async function buildLegacy() {
  await sql.query(`create schema ${LEGACY}`);
  await sql.query(`create table ${LEGACY}.prefs (
    id text primary key, data jsonb not null,
    updated_at timestamptz not null default now())`);
  await sql.query(`create table ${LEGACY}.job_state (
    job_id text primary key, first_seen timestamptz not null,
    applied boolean not null default false, applied_at timestamptz,
    hidden boolean not null default false, saved boolean not null default false,
    snapshot jsonb, updated_at timestamptz not null default now())`);
  await sql.query(`create table ${LEGACY}.companies (
    key text primary key, source text not null, token text not null,
    label text not null, industry text not null default 'other',
    added_at timestamptz not null default now())`);

  await sql.query(`insert into ${LEGACY}.prefs (id, data) values
    ('owner', '{"jobTypes":["product design","ux"],"levels":[]}'::jsonb)`);
  // One of each thing that has to survive: a plain sighting, an application
  // with the snapshot that outlives its posting, and a dismissal.
  await sql.query(`insert into ${LEGACY}.job_state (job_id, first_seen, applied, applied_at, snapshot) values
    ('gh:acme:1', now(), true, now(), '{"title":"Product Designer"}'::jsonb)`);
  await sql.query(`insert into ${LEGACY}.job_state (job_id, first_seen, hidden) values
    ('gh:acme:2', now(), true)`);
  await sql.query(`insert into ${LEGACY}.job_state (job_id, first_seen) values ('gh:acme:3', now())`);
  await sql.query(`insert into ${LEGACY}.companies (key, source, token, label) values
    ('greenhouse:acme', 'greenhouse', 'acme', 'Acme')`);
}

async function main() {
  await sql.query(`drop schema if exists ${LEGACY} cascade`);
  await sql.query(`drop schema if exists ${FRESH} cascade`);

  /* ------------------------------------------------- the legacy database */

  await buildLegacy();
  await run(LEGACY);

  const counts = async (schema) => (await sql.query(`
    select (select count(*)::int from ${schema}.job_state) as jobs,
           (select count(*)::int from ${schema}.job_state where applied) as applied,
           (select count(*)::int from ${schema}.job_state where hidden) as dismissed,
           (select count(*)::int from ${schema}.job_state where snapshot is not null) as snapshots,
           (select count(*)::int from ${schema}.companies) as boards,
           (select count(*)::int from ${schema}.prefs) as prefs
  `))[0];

  const after = await counts(LEGACY);
  check('nothing lost', after, { jobs: 3, applied: 1, dismissed: 1, snapshots: 1, boards: 1, prefs: 1 });

  const [{ mine }] = await sql.query(`
    select count(*)::int as mine from ${LEGACY}.job_state s
    join ${LEGACY}.users u on u.id = s.user_id where u.email = '${OWNER_EMAIL}'
  `);
  check('the history moved onto the owner account', mine, 3);

  const [{ admin }] = await sql.query(
    `select is_admin as admin from ${LEGACY}.users where email = '${OWNER_EMAIL}'`,
  );
  check('the owner is an admin', admin, true);

  check('job_state key', await pk(LEGACY, 'job_state'), ['job_id', 'user_id']);
  check('companies key', await pk(LEGACY, 'companies'), ['key', 'user_id']);
  check('prefs key', await pk(LEGACY, 'prefs'), ['user_id']);

  const [{ legacyCol }] = await sql.query(`
    select count(*)::int as "legacyCol" from information_schema.columns
    where table_schema = '${LEGACY}' and table_name = 'prefs' and column_name = 'id'
  `);
  check('the owner column is gone', legacyCol, 0);

  /* ---- the thing the old key made impossible ---- */

  await sql.query(`insert into ${LEGACY}.users (email) values ('second@example.com')`);
  await sql.query(`
    insert into ${LEGACY}.job_state (user_id, job_id, first_seen, applied)
    select id, 'gh:acme:1', now(), true from ${LEGACY}.users where email = 'second@example.com'
  `);
  const [{ both }] = await sql.query(
    `select count(*)::int as both from ${LEGACY}.job_state where job_id = 'gh:acme:1'`,
  );
  check('one posting, two accounts', both, 2);

  // The foreign key has to actually cascade, or deleting an account strands
  // its rows on a user id that resolves to nobody.
  await sql.query(`delete from ${LEGACY}.users where email = 'second@example.com'`);
  const [{ left }] = await sql.query(
    `select count(*)::int as left from ${LEGACY}.job_state where job_id = 'gh:acme:1'`,
  );
  check('deleting an account takes only its own rows', left, 1);

  /* ---- and it is safe to run twice ---- */

  await run(LEGACY);
  check('re-running changes nothing', await counts(LEGACY), after);

  /* -------------------------------------------------- the empty database */

  await sql.query(`create schema ${FRESH}`);
  await run(FRESH);
  check('fresh: job_state key', await pk(FRESH, 'job_state'), ['job_id', 'user_id']);
  check('fresh: companies key', await pk(FRESH, 'companies'), ['key', 'user_id']);
  check('fresh: prefs key', await pk(FRESH, 'prefs'), ['user_id']);
  const [{ seeded }] = await sql.query(`select count(*)::int as seeded from ${FRESH}.users`);
  check('fresh: owner account seeded', seeded, 1);
  await run(FRESH);
  const [{ still }] = await sql.query(`select count(*)::int as still from ${FRESH}.users`);
  check('fresh: re-running does not duplicate the owner', still, 1);
}

try {
  await main();
} finally {
  await sql.query(`drop schema if exists ${LEGACY} cascade`);
  await sql.query(`drop schema if exists ${FRESH} cascade`);
  console.log('\nscratch schemas dropped');
}

console.log(failures === 0 ? 'schema check passed' : `${failures} failing`);
process.exit(failures === 0 ? 0 : 1);
