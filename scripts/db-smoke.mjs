/**
 * Exercises the exact SQL shapes `lib/jobwatch/db.ts` uses, against the real
 * database. The bulk upsert is the risky part — unnest with per-column casts,
 * including jsonb — so it is worth proving rather than assuming.
 *
 *   node --env-file=.env.local scripts/db-smoke.mjs
 *
 * Leaves the tables as it found them.
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const before = (await sql`select count(*)::int as n from job_state`)[0].n;

const state = {
  'gh:test-1': { firstSeen: 1754300000000, applied: true, appliedAt: 1754390000000,
                 snapshot: { title: 'Senior Product Designer', company: 'Acme' } },
  'gh:test-2': { firstSeen: 1754310000000, saved: true },
  'ab:test-3': { firstSeen: 1754320000000, hidden: true },
};

const ids = Object.keys(state);
const iso = (v) => (v == null ? null : new Date(v).toISOString());

await sql`
  insert into job_state (job_id, first_seen, applied, applied_at, hidden, saved, snapshot, updated_at)
  select t.job_id, t.first_seen, t.applied, t.applied_at, t.hidden, t.saved, t.snapshot, now()
  from unnest(
    ${ids}::text[],
    ${ids.map((i) => iso(state[i].firstSeen))}::timestamptz[],
    ${ids.map((i) => state[i].applied === true)}::boolean[],
    ${ids.map((i) => iso(state[i].appliedAt))}::timestamptz[],
    ${ids.map((i) => state[i].hidden === true)}::boolean[],
    ${ids.map((i) => state[i].saved === true)}::boolean[],
    ${ids.map((i) => (state[i].snapshot ? JSON.stringify(state[i].snapshot) : null))}::jsonb[]
  ) as t(job_id, first_seen, applied, applied_at, hidden, saved, snapshot)
  on conflict (job_id) do update set
    first_seen = excluded.first_seen, applied = excluded.applied,
    applied_at = excluded.applied_at, hidden = excluded.hidden,
    saved = excluded.saved, snapshot = excluded.snapshot, updated_at = now()
`;
console.log('bulk upsert: ok');

const rows = await sql`
  select job_id, first_seen, applied, applied_at, hidden, saved, snapshot
  from job_state where job_id like '%test-%' order by job_id
`;
for (const r of rows) {
  console.log(' ', r.job_id, '| firstSeen', new Date(r.first_seen).getTime(),
    '| applied', r.applied, '| saved', r.saved, '| hidden', r.hidden,
    '| snapshot', r.snapshot ? r.snapshot.title : null);
}

// Round-trip fidelity: epoch in must equal epoch out.
const back = rows.find((r) => r.job_id === 'gh:test-1');
console.log('\nepoch round-trip :',
  new Date(back.first_seen).getTime() === 1754300000000 ? 'exact' : 'MISMATCH');
console.log('jsonb round-trip :',
  back.snapshot?.company === 'Acme' ? 'exact' : 'MISMATCH');

// The mirror delete: everything not in the list goes.
const keep = ['gh:test-1'];
await sql`delete from job_state where job_id like '%test-%' and job_id <> all(${keep}::text[])`;
const left = await sql`select job_id from job_state where job_id like '%test-%'`;
console.log('mirror delete    :', left.length === 1 && left[0].job_id === 'gh:test-1' ? 'ok' : 'FAILED');

await sql`delete from job_state where job_id like '%test-%'`;
const after = (await sql`select count(*)::int as n from job_state`)[0].n;
console.log(`\ncleanup: ${before} rows before, ${after} after`);
