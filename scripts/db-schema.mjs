/**
 * Jobwatch's schema, as an ordered list of idempotent statements.
 *
 * Split out from `db-init.mjs` so the migration can be dry-run: `schema` puts
 * every statement against a scratch schema holding a copy of the real tables,
 * which is how a primary-key change gets rehearsed before it touches an
 * application history that cannot be re-fetched. The parameter is not decoration
 * — it is the difference between testing this file and testing a paraphrase of
 * it.
 *
 * The statements serve two databases at once: an empty one, where the
 * `create table if not exists` block does the work and the migration section is
 * inert, and the single-user one that already exists, where the reverse is true.
 * Both end in the same shape, which is what keeps this re-runnable.
 */

/**
 * The account that inherits everything the single-user version wrote.
 *
 * Seeded with no `clerk_id`: the row exists before the Clerk account does, and
 * the two are bound the first time somebody signs in with this address on a
 * verified email — see `resolveUser` in db.ts. That ordering is what lets an
 * application history predate the account that owns it.
 */
export const OWNER_EMAIL = 'jbusseywork@gmail.com';

export function statements({ ownerEmail = OWNER_EMAIL, schema = 'public' } = {}) {
  const p = `${schema}.`;

  return [
    /* ----------------------------------------------------------- users */

    // `clerk_id` is nullable and unique: identity lives at Clerk, and this
    // table exists to give rows something local to hang off. Keeping our own id
    // means a posting's history is not addressed by a vendor's primary key — if
    // Clerk ever goes, the data does not have to be rewritten to follow it.
    `create table if not exists ${p}users (
       id          uuid primary key default gen_random_uuid(),
       clerk_id    text unique,
       email       text not null unique,
       created_at  timestamptz not null default now()
     )`,

    `insert into ${p}users (email) values ('${ownerEmail}') on conflict (email) do nothing`,

    // Admin is a column rather than an env var of blessed addresses, because
    // the question "who may spend fifteen thousand outbound requests" should be
    // answerable — and grantable — in the same place the accounts are. One
    // update statement adds the next one.
    `alter table ${p}users add column if not exists is_admin boolean not null default false`,
    `update ${p}users set is_admin = true where email = '${ownerEmail}'`,

    /* ---------------------------------------------------------- tables */

    // Fresh-database shape. On the existing database every one of these is a
    // no-op and the migration section below does the real work.
    `create table if not exists ${p}prefs (
       user_id     uuid primary key references ${p}users(id) on delete cascade,
       data        jsonb not null,
       updated_at  timestamptz not null default now()
     )`,

    `create table if not exists ${p}job_state (
       user_id        uuid not null references ${p}users(id) on delete cascade,
       job_id         text not null,
       first_seen     timestamptz not null,
       applied        boolean not null default false,
       applied_at     timestamptz,
       hidden         boolean not null default false,
       saved          boolean not null default false,
       dismiss_reason text,
       dismiss_note   text,
       snapshot       jsonb,
       changed_at     timestamptz,
       updated_at     timestamptz not null default now(),
       primary key (user_id, job_id)
     )`,

    `create table if not exists ${p}companies (
       user_id   uuid not null references ${p}users(id) on delete cascade,
       key       text not null,
       source    text not null,
       token     text not null,
       label     text not null,
       industry  text not null default 'other',
       added_at  timestamptz not null default now(),
       primary key (user_id, key)
     )`,

    /* ------------------------------------------------------- migration */

    // Columns first, nullable, so the backfill has somewhere to land.
    `alter table ${p}prefs     add column if not exists user_id uuid references ${p}users(id) on delete cascade`,
    `alter table ${p}job_state add column if not exists user_id uuid references ${p}users(id) on delete cascade`,
    `alter table ${p}companies add column if not exists user_id uuid references ${p}users(id) on delete cascade`,
    `alter table ${p}job_state add column if not exists dismiss_reason text`,
    `alter table ${p}job_state add column if not exists dismiss_note text`,
    `alter table ${p}job_state add column if not exists changed_at timestamptz`,

    // Everything written before accounts existed belongs to one person.
    // Assigning it has to happen before the keys move: a primary key implies
    // NOT NULL, and one unassigned row would fail the whole statement.
    `update ${p}prefs     set user_id = (select id from ${p}users where email = '${ownerEmail}') where user_id is null`,
    `update ${p}job_state set user_id = (select id from ${p}users where email = '${ownerEmail}') where user_id is null`,
    `update ${p}companies set user_id = (select id from ${p}users where email = '${ownerEmail}') where user_id is null`,

    // `prefs.id` was the literal string 'owner' — the single-user assumption
    // written into a column. `user_id` replaces it outright rather than sitting
    // beside it, because two identity columns on one row is how they drift.
    `do $$
     begin
       if exists (
         select 1 from information_schema.columns
         where table_schema = '${schema}' and table_name = 'prefs' and column_name = 'id'
       ) then
         alter table ${p}prefs drop constraint if exists prefs_pkey;
         alter table ${p}prefs drop column id;
         alter table ${p}prefs alter column user_id set not null;
         alter table ${p}prefs add primary key (user_id);
       end if;
     end $$`,

    // A single-column primary key is the marker for the un-migrated shape: the
    // key is still the job id alone, so two people cannot both hold an opinion
    // about the same posting. Counting the key's columns is a fact about the
    // table rather than a guess about its history, so this stays correct
    // however the database got here.
    //
    // `indnkeyatts` comes straight from the catalog. Not `unnest(indkey)`,
    // which looks like it should work and does not — `indkey` is an int2vector
    // rather than a real array, and unnest has no overload for it. A table with
    // no primary key leaves `cols` null, and null = 1 is not true, so that case
    // falls through rather than erroring.
    `do $$
     declare cols int;
     begin
       select i.indnkeyatts into cols
       from pg_index i
       where i.indrelid = '${p}job_state'::regclass and i.indisprimary;

       if cols = 1 then
         alter table ${p}job_state drop constraint job_state_pkey;
         alter table ${p}job_state alter column user_id set not null;
         alter table ${p}job_state add primary key (user_id, job_id);
       end if;
     end $$`,

    `do $$
     declare cols int;
     begin
       select i.indnkeyatts into cols
       from pg_index i
       where i.indrelid = '${p}companies'::regclass and i.indisprimary;

       if cols = 1 then
         alter table ${p}companies drop constraint companies_pkey;
         alter table ${p}companies alter column user_id set not null;
         alter table ${p}companies add primary key (user_id, key);
       end if;
     end $$`,

    /* --------------------------------------------------------- indexes */

    // The Applied tab is the one view that filters rather than reading
    // everything, and it is now a small slice of one person's rows — so the
    // index leads with the user, or it scans everybody's applications to find
    // yours.
    `drop index if exists ${p}job_state_applied_idx`,
    `create index if not exists job_state_user_applied_idx
       on ${p}job_state (user_id, applied_at desc) where applied`,

    // Binding a Clerk identity happens on the first authenticated request of a
    // session, and it looks up by one or the other.
    `create index if not exists users_clerk_idx on ${p}users (clerk_id)`,
  ];
}
