/**
 * Local persistence. Everything lives in localStorage — Jobwatch has no
 * backend and no account, and a job hunt is nobody else's business.
 *
 * Three independent keys, deliberately never merged. Clearing filters must not
 * be able to reach the application log:
 *
 *   jobwatch:prefs:v1      what gets shown and in what order
 *   jobwatch:jobstate:v1   per-job triage — first seen, applied, saved, hidden
 *   jobwatch:companies:v1  the watchlist
 *
 * `jobwatch:cache:v1` is a fourth key but not user data: it is a warm-start
 * copy of the last fetch and can be thrown away at any time.
 */

import { LEVEL_ORDER } from './classify';
import { plural, titleCase } from './format';
import { companyKey } from './sources';
import type {
  Company,
  Industry,
  Job,
  JobMark,
  JobSnapshot,
  JobState,
  JobStateEntry,
  LevelPrefs,
  Prefs,
  SortBy,
  SourceKind,
} from './types';

const KEY = {
  companies: 'jobwatch:companies:v1',
  prefs: 'jobwatch:prefs:v1',
  jobState: 'jobwatch:jobstate:v1',
  cache: 'jobwatch:cache:v1',
} as const;

/** Pre-v1 keys. Read once by the migration, then left alone as a fallback. */
const LEGACY_KEY = {
  marks: 'jobwatch:marks:v1',
  seen: 'jobwatch:seen:v1',
} as const;

/**
 * Seed watchlist.
 *
 * Every entry was probed against the live API before it went in: 235 candidate
 * slugs × 3 platforms, of which 126 answered and these 71 had at least one
 * design role on the board. A token that 404s is worse than no token — it shows
 * up in the UI as a failing board and looks like a bug.
 *
 * Boards with no design roles on the day of the sweep were left out. That is a
 * snapshot judgement and the wrong one for a *watcher* in principle, but each
 * extra board costs a request and up to a few MB per sync, so the ones with no
 * track record have to earn their place. All of it is editable from the UI.
 *
 * Labels default to `titleCase(token)`; the third element overrides it where
 * that guess is wrong.
 */
const SEED: Array<[SourceKind, string, Industry, string?]> = [
  // ---- Greenhouse ----
  ['greenhouse', 'stripe',     'fintech'],      ['greenhouse', 'figma',      'design'],
  ['greenhouse', 'okta',       'devtools'],     ['greenhouse', 'oura',       'health', 'Oura'],
  ['greenhouse', 'duolingo',   'education'],    ['greenhouse', 'datadog',    'devtools', 'Datadog'],
  ['greenhouse', 'brex',       'fintech'],      ['greenhouse', 'oscar',      'health', 'Oscar Health'],
  ['greenhouse', 'lyft',       'mobility'],     ['greenhouse', 'robinhood',  'fintech'],
  ['greenhouse', 'gusto',      'hr'],           ['greenhouse', 'dropbox',    'productivity'],
  ['greenhouse', 'justworks',  'hr'],           ['greenhouse', 'peloton',    'health'],
  ['greenhouse', 'mercury',    'fintech'],      ['greenhouse', 'zocdoc',     'health', 'Zocdoc'],
  ['greenhouse', 'pinterest',  'social'],       ['greenhouse', 'asana',      'productivity'],
  ['greenhouse', 'instacart',  'commerce'],     ['greenhouse', 'monzo',      'fintech'],
  ['greenhouse', 'wrike',      'productivity'], ['greenhouse', 'chime',      'fintech'],
  ['greenhouse', 'samsara',    'mobility'],     ['greenhouse', 'vercel',     'devtools'],
  ['greenhouse', 'discord',    'social'],       ['greenhouse', 'databricks', 'devtools'],
  ['greenhouse', 'adyen',      'fintech'],      ['greenhouse', 'gitlab',     'devtools', 'GitLab'],
  ['greenhouse', 'affirm',     'fintech'],      ['greenhouse', 'twilio',     'devtools'],
  ['greenhouse', 'coinbase',   'fintech'],      ['greenhouse', 'smartsheet', 'productivity'],
  ['greenhouse', 'faire',      'commerce'],     ['greenhouse', 'airtable',   'productivity'],
  ['greenhouse', 'elastic',    'devtools'],     ['greenhouse', 'remotecom',  'hr', 'Remote'],
  ['greenhouse', 'airbnb',     'commerce'],     ['greenhouse', 'reddit',     'social'],
  ['greenhouse', 'sezzle',     'fintech'],      ['greenhouse', 'n26',        'fintech', 'N26'],
  ['greenhouse', 'amplitude',  'devtools'],     ['greenhouse', 'stockx',     'commerce', 'StockX'],
  ['greenhouse', 'webflow',    'design'],       ['greenhouse', 'lightricks', 'design'],
  ['greenhouse', 'netlify',    'devtools'],     ['greenhouse', 'calm',       'health'],

  // ---- Ashby ----
  ['ashby', 'airwallex', 'fintech'],      ['ashby', 'whoop',     'health', 'WHOOP'],
  ['ashby', 'harvey',    'ai'],           ['ashby', 'sierra',    'ai'],
  ['ashby', 'snowflake', 'devtools'],     ['ashby', 'ramp',      'fintech'],
  ['ashby', 'zip',       'productivity'], ['ashby', 'notion',    'productivity'],
  ['ashby', 'miro',      'design'],       ['ashby', 'render',    'devtools'],
  ['ashby', 'strava',    'social'],       ['ashby', 'linear',    'productivity'],
  ['ashby', 'supabase',  'devtools'],     ['ashby', 'thumbtack', 'commerce'],
  ['ashby', 'abridge',   'health'],       ['ashby', 'mural',     'design'],
  ['ashby', 'plaid',     'fintech'],      ['ashby', 'clickup',   'productivity', 'ClickUp'],
  ['ashby', 'angi',      'commerce', 'Angi'], ['ashby', 'poshmark', 'commerce'],
  ['ashby', 'oyster',    'hr'],           ['ashby', 'capsule',   'health'],

  // ---- second pass ----
  // The first sweep only covered companies that came to mind, which is how a
  // live RunPod posting was invisible. These fill in AI infra, GPU cloud,
  // security, observability, crypto and health.
  ['ashby', 'runpod',       'ai', 'RunPod'],      ['ashby', 'synthesia',   'ai'],
  ['ashby', 'deepgram',     'ai'],                ['ashby', 'elevenlabs',  'ai', 'ElevenLabs'],
  ['ashby', 'baseten',      'ai'],                ['greenhouse', 'coreweave', 'ai', 'CoreWeave'],
  ['greenhouse', 'typeface','ai'],
  ['ashby', 'vanta',        'devtools'],          ['ashby', 'socket',      'devtools'],
  ['ashby', 'workos',       'devtools', 'WorkOS'],['ashby', 'resend',      'devtools'],
  ['ashby', 'stytch',       'devtools'],          ['ashby', 'zed',         'devtools', 'Zed'],
  ['ashby', 'secureframe',  'devtools'],          ['greenhouse', 'chainguard', 'devtools'],
  ['greenhouse', 'hightouch','devtools'],         ['greenhouse', 'fivetran','devtools'],
  ['lever', 'logrocket',    'devtools', 'LogRocket'],
  ['ashby', 'bubble',       'devtools'],
  ['ashby', 'phantom',      'fintech'],           ['greenhouse', 'gemini', 'fintech'],
  ['ashby', 'opensea',      'fintech', 'OpenSea'],['ashby', 'alchemy',     'fintech'],
  ['ashby', 'uniswap',      'fintech'],
  ['ashby', 'headway',      'health'],
  ['ashby', 'gamma',        'productivity'],      ['ashby', 'n8n',         'productivity', 'n8n'],
  ['greenhouse', 'make',    'productivity'],      ['greenhouse', 'customerio', 'productivity', 'Customer.io'],
  ['greenhouse', 'klaviyo', 'commerce'],          ['greenhouse', 'glossier', 'commerce'],
  ['ashby', 'away',         'commerce'],

  // ---- Lever ----
  ['lever', 'wealthfront', 'fintech'],    ['lever', 'gopuff', 'commerce', 'Gopuff'],
];

export const SEED_COMPANIES: Company[] = SEED.map(([source, token, industry, label]) => ({
  source,
  token,
  industry,
  label: label ?? titleCase(token),
  key: companyKey(source, token),
}));

/**
 * Every read is wrapped and falls back to a default. `getItem` returns null for
 * a key that was never written, but the call itself throws outright when
 * storage is disabled or partitioned, and `JSON.parse` throws on anything
 * half-written — all three end up in the same place.
 */
function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled. Persistence is a convenience here,
    // not a requirement — the session keeps working from memory.
  }
}

/* ------------------------------------------------------------- companies */

export function loadCompanies(): Company[] {
  const saved = read<Company[]>(KEY.companies, []);
  if (!Array.isArray(saved) || saved.length === 0) return SEED_COMPANIES;
  return saved.filter((c) => c && c.source && c.token).map((c) => ({
    ...c,
    key: c.key || companyKey(c.source, c.token),
    // Watchlists saved before industries existed have none. Rather than guess,
    // recover it from the seed where the board is one we ship.
    industry:
      c.industry ??
      SEED_COMPANIES.find((s) => s.key === (c.key || companyKey(c.source, c.token)))?.industry ??
      'other',
  }));
}

export const saveCompanies = (companies: Company[]) => write(KEY.companies, companies);

/* ----------------------------------------------------------------- prefs */

export const PREFS_VERSION = 1;

export const DEFAULT_PREFS: Prefs = {
  version: PREFS_VERSION,
  // Senior is on. It was off, and that quietly dropped the single most common
  // shape of the role being searched for — a plain "Senior Product Designer" —
  // which is how a live RunPod posting went missing while every filter looked
  // correct. `mid` stays off: it is the bucket for any title with no seniority
  // word at all, which is 31 of 57 design roles and mostly not this search.
  levels: { exec: false, principal: true, staff: true, lead: true, senior: true, mid: false },
  // `engineer` used to be here and earned nothing: the design-title test already
  // rejects every title containing it, measured at 0 drops across 1,722 postings.
  exclude: ['manager', 'research'],
  salaryFloor: null,
  includeUnlistedSalary: true,
  maxAgeDays: null,
  sortBy: 'firstSeen',
  sortDir: 'desc',
};

const SORT_KEYS = new Set<string>(['firstSeen', 'published', 'salary', 'company']);

function coerceLevels(raw: unknown): LevelPrefs {
  const out = { ...DEFAULT_PREFS.levels };
  if (raw && typeof raw === 'object') {
    for (const level of LEVEL_ORDER) {
      const value = (raw as Record<string, unknown>)[level];
      if (typeof value === 'boolean') out[level] = value;
    }
  }
  return out;
}

/** An array that is present but empty is a real answer; only a non-array falls back. */
function coerceTerms(raw: unknown, fallback: string[]): string[] {
  if (!Array.isArray(raw)) return fallback;
  const out: string[] = [];
  for (const value of raw) {
    if (typeof value !== 'string') continue;
    const term = value.trim().toLowerCase();
    if (term && !out.includes(term)) out.push(term);
  }
  return out;
}

const coerceBool = (raw: unknown, fallback: boolean) =>
  typeof raw === 'boolean' ? raw : fallback;

const coercePositive = (raw: unknown): number | null =>
  typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null;

/**
 * Reads prefs, filling any gap from the defaults.
 *
 * The stored object is spread *over* the defaults rather than replacing them,
 * so a config written before a field existed picks up that field's default
 * instead of losing everything else it had. Anything the user could have
 * hand-edited into an impossible value is coerced back into range.
 */
export function loadPrefs(): Prefs {
  const stored = read<Partial<Prefs> | null>(KEY.prefs, null);
  if (!stored || typeof stored !== 'object') return DEFAULT_PREFS;

  const merged: Prefs = {
    ...DEFAULT_PREFS,
    ...stored,
    version: PREFS_VERSION,
    levels: coerceLevels(stored.levels),
    exclude: coerceTerms(stored.exclude, DEFAULT_PREFS.exclude),
    includeUnlistedSalary: coerceBool(
      stored.includeUnlistedSalary,
      DEFAULT_PREFS.includeUnlistedSalary,
    ),
    salaryFloor: coercePositive(stored.salaryFloor),
    maxAgeDays: coercePositive(stored.maxAgeDays),
    sortBy: SORT_KEYS.has(stored.sortBy as string)
      ? (stored.sortBy as SortBy)
      : DEFAULT_PREFS.sortBy,
    sortDir: stored.sortDir === 'asc' ? 'asc' : 'desc',
  };

  const version = typeof stored.version === 'number' ? stored.version : 0;
  if (version < PREFS_VERSION) {
    console.info(
      `[jobwatch] prefs upgraded ${version ? `v${version}` : '(unversioned)'} → v${PREFS_VERSION}; saved settings kept`,
    );
    write(KEY.prefs, merged);
  }

  return merged;
}

export const savePrefs = (prefs: Prefs) => write(KEY.prefs, prefs);

/* ------------------------------------------------------------- job state */

/**
 * A `firstSeen` of `PRE_EXISTING` means "already on the board when Jobwatch
 * first looked" — a baseline rather than a sighting. Those are never new, and
 * an age filter can't judge them either. See `observeJobs`.
 */
export const PRE_EXISTING = 0;

export const toSnapshot = ({ descriptionHtml: _drop, ...rest }: Job): JobSnapshot => rest;

function coerceEntry(raw: unknown): JobStateEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Partial<JobStateEntry>;
  const entry: JobStateEntry = {
    firstSeen:
      typeof e.firstSeen === 'number' && Number.isFinite(e.firstSeen)
        ? e.firstSeen
        : PRE_EXISTING,
  };
  if (e.applied) entry.applied = true;
  if (typeof e.appliedAt === 'number' && Number.isFinite(e.appliedAt)) entry.appliedAt = e.appliedAt;
  if (e.hidden) entry.hidden = true;
  if (e.saved) entry.saved = true;
  if (e.snapshot && typeof e.snapshot === 'object') entry.snapshot = e.snapshot;
  return entry;
}

function normalize(raw: Record<string, unknown>): JobState {
  const out: JobState = {};
  for (const [id, value] of Object.entries(raw)) {
    const entry = coerceEntry(value);
    if (entry) out[id] = entry;
  }
  return out;
}

/**
 * Folds the pre-v1 `marks` and `seen` maps into a single job-state record.
 *
 * Runs only when `jobwatch:jobstate:v1` is absent, and leaves the old keys in
 * place afterwards — they cost a few KB and they are the only way back if this
 * goes wrong. No shipped version ever kept per-job flags on the company list,
 * so the watchlist has nothing to contribute here.
 */
function migrate(): JobState {
  const marks = read<Record<string, JobMark>>(LEGACY_KEY.marks, {});
  const seen = read<Record<string, number>>(LEGACY_KEY.seen, {});

  const next: JobState = {};
  const entryFor = (id: string): JobStateEntry => (next[id] ??= { firstSeen: PRE_EXISTING });

  for (const [id, stamp] of Object.entries(seen)) {
    if (typeof stamp === 'number' && Number.isFinite(stamp)) entryFor(id).firstSeen = stamp;
  }

  let applied = 0;
  let saved = 0;
  let hidden = 0;

  for (const [id, mark] of Object.entries(marks)) {
    const entry = entryFor(id);
    // The old marks map had no timestamps, so `appliedAt` stays undefined
    // rather than being invented. The Applied tab renders those as an unknown
    // date and sorts them last, which is at least true.
    if (mark === 'applied') { entry.applied = true; applied += 1; }
    else if (mark === 'saved') { entry.saved = true; saved += 1; }
    else if (mark === 'hidden') { entry.hidden = true; hidden += 1; }
  }

  const total = Object.keys(next).length;
  if (total > 0) {
    console.info(
      `[jobwatch] migrated ${total} job records into ${KEY.jobState} — ` +
      `${applied} applied, ${saved} saved, ${hidden} hidden. Legacy keys left in place.`,
    );
    write(KEY.jobState, next);
  }

  return next;
}

export function loadJobState(): JobState {
  const stored = read<Record<string, unknown> | null>(KEY.jobState, null);
  if (stored && typeof stored === 'object') return normalize(stored);
  return migrate();
}

export const saveJobState = (state: JobState) => write(KEY.jobState, state);

/**
 * Stamps a first-seen time on anything not already tracked.
 *
 * The first sync is the awkward one: every posting is unrecorded, so stamping
 * them all with `now` would badge the entire board as new — and keep badging it
 * for the whole NEW window, since those stamps stay recent for days. So the
 * opening sync writes `PRE_EXISTING` instead, establishing a baseline that
 * nothing is measured as newer than. Only postings that turn up on a later sync
 * get a real timestamp, which is exactly what "new" should mean here.
 *
 * Existing stamps are never rewritten. The same pass refreshes the archive copy
 * of anything already applied to, for as long as that posting stays fetchable.
 */
export function observeJobs(state: JobState, jobs: Job[], now = Date.now()): JobState {
  const stamp = Object.keys(state).length === 0 ? PRE_EXISTING : now;

  const next: JobState = { ...state };
  for (const job of jobs) {
    const prev = next[job.id];
    if (!prev) next[job.id] = { firstSeen: stamp };
    else if (prev.applied) next[job.id] = { ...prev, snapshot: toSnapshot(job) };
  }
  return next;
}

/** True only for postings that appeared after Jobwatch's first look. */
export function isNewSince(
  state: JobState,
  id: string,
  windowMs: number,
  now = Date.now(),
): boolean {
  const stamp = state[id]?.firstSeen;
  return stamp !== undefined && stamp !== PRE_EXISTING && now - stamp < windowMs;
}

/**
 * Drops entries for jobs that have fallen off every board, so the map doesn't
 * grow without bound. Anything you touched is kept regardless — an application
 * record must not disappear because the req closed, which is the whole reason
 * the snapshot exists.
 */
export function pruneJobState(state: JobState, liveIds: Set<string>): JobState {
  const next: JobState = {};
  for (const [id, entry] of Object.entries(state)) {
    if (liveIds.has(id) || entry.applied || entry.saved || entry.hidden) next[id] = entry;
  }
  return next;
}

/* ----------------------------------------------------------------- cache */

/**
 * Job records minus `descriptionHtml`. Descriptions are by far the biggest
 * field — a single Greenhouse board with `content=true` runs to megabytes —
 * and would blow the ~5MB localStorage budget within a couple of companies.
 * So the list is cached for an instant first paint, and descriptions are
 * refilled by the background refresh that follows.
 */
export type CachedJob = JobSnapshot;

export type CacheEntry = {
  jobs: CachedJob[];
  fetchedAt: number;
};

export const loadCache = (): Record<string, CacheEntry> =>
  read<Record<string, CacheEntry>>(KEY.cache, {});

/**
 * Roughly what localStorage will take, minus room for prefs and job state.
 * A snapshot measures about 323 bytes serialized, so this is ~11k postings.
 */
const CACHE_BUDGET = 3_600_000;

export function saveCache(results: Record<string, { jobs: Job[]; fetchedAt: number | null }>): void {
  const slim: Record<string, CacheEntry> = {};
  for (const [key, entry] of Object.entries(results)) {
    if (!entry.fetchedAt) continue;
    slim[key] = {
      fetchedAt: entry.fetchedAt,
      jobs: entry.jobs.map(toSnapshot),
    };
  }

  // A watchlist this size can outgrow the quota, and the write would then throw
  // and be swallowed — leaving no cache at all, which is the worst outcome.
  // Dropping the biggest boards keeps a warm start for most of the list.
  let payload = JSON.stringify(slim);
  if (payload.length > CACHE_BUDGET) {
    const bySize = Object.entries(slim)
      .map(([key, entry]) => [key, JSON.stringify(entry).length] as const)
      .sort((a, b) => b[1] - a[1]);

    let dropped = 0;
    for (const [key] of bySize) {
      if (payload.length <= CACHE_BUDGET) break;
      delete slim[key];
      dropped += 1;
      payload = JSON.stringify(slim);
    }
    console.info(
      `[jobwatch] cache over budget — dropped the ${dropped} largest ${plural(dropped, 'board')} from the warm-start copy`,
    );
  }

  write(KEY.cache, payload === '{}' ? {} : JSON.parse(payload));
}

/** Rehydrates cached rows into full `Job`s with an empty description. */
export const hydrate = (jobs: CachedJob[]): Job[] =>
  jobs.map((j) => ({ ...j, descriptionHtml: '' }));
