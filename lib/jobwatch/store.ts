/**
 * Local persistence. Everything lives in localStorage — Jobwatch has no
 * backend and no account, and a job hunt is nobody else's business.
 *
 * Three independent keys, deliberately never merged. Clearing filters must not
 * be able to reach the application log:
 *
 *   jobwatch:prefs:v1      what gets shown and in what order
 *   jobwatch:jobstate:v1   per-job triage — first seen, applied, hidden
 *   jobwatch:companies:v1  the watchlist
 *
 * `jobwatch:cache:v1` is a fourth key but not user data: it is a warm-start
 * copy of the last fetch and can be thrown away at any time.
 */

import { LEVEL_ORDER } from './classify';
import { plural, titleCase } from './format';
import { companyKey } from './sources';
import {
  PRE_EXISTING,
  type Level,
  type Company,
  type Job,
  type JobMark,
  type JobSnapshot,
  type JobState,
  type JobStateEntry,
  type Prefs,
  type SortBy,
  type SourceKind,
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
 * Seed watchlist — the fallback when the swept index is unavailable.
 *
 * Every token here was probed against the live API before it went in; a token
 * that 404s is worse than no token, because it surfaces as a failing board and
 * reads as a bug. This list is hand-assembled, which is exactly the limitation
 * that made a live RunPod posting invisible for a while — see `discover.ts`,
 * which is how boards are actually found now. What survives here is a floor:
 * enough to make the page useful before the first sweep lands, or if it can't
 * be reached at all.
 *
 * Third element overrides the label where `titleCase(token)` guesses wrong.
 */
const SEED: Array<[SourceKind, string, string?]> = [
  // ---- Greenhouse ----
  ['greenhouse', 'stripe'],
  ['greenhouse', 'figma'],
  ['greenhouse', 'okta'],
  ['greenhouse', 'oura', 'Oura'],
  ['greenhouse', 'duolingo'],
  ['greenhouse', 'datadog', 'Datadog'],
  ['greenhouse', 'brex'],
  ['greenhouse', 'oscar', 'Oscar Health'],
  ['greenhouse', 'lyft'],
  ['greenhouse', 'robinhood'],
  ['greenhouse', 'gusto'],
  ['greenhouse', 'dropbox'],
  ['greenhouse', 'justworks'],
  ['greenhouse', 'peloton'],
  ['greenhouse', 'mercury'],
  ['greenhouse', 'zocdoc', 'Zocdoc'],
  ['greenhouse', 'pinterest'],
  ['greenhouse', 'asana'],
  ['greenhouse', 'instacart'],
  ['greenhouse', 'monzo'],
  ['greenhouse', 'wrike'],
  ['greenhouse', 'chime'],
  ['greenhouse', 'samsara'],
  ['greenhouse', 'vercel'],
  ['greenhouse', 'discord'],
  ['greenhouse', 'databricks'],
  ['greenhouse', 'adyen'],
  ['greenhouse', 'gitlab', 'GitLab'],
  ['greenhouse', 'affirm'],
  ['greenhouse', 'twilio'],
  ['greenhouse', 'coinbase'],
  ['greenhouse', 'smartsheet'],
  ['greenhouse', 'faire'],
  ['greenhouse', 'airtable'],
  ['greenhouse', 'elastic'],
  ['greenhouse', 'remotecom', 'Remote'],
  ['greenhouse', 'airbnb'],
  ['greenhouse', 'reddit'],
  ['greenhouse', 'sezzle'],
  ['greenhouse', 'n26', 'N26'],
  ['greenhouse', 'amplitude'],
  ['greenhouse', 'stockx', 'StockX'],
  ['greenhouse', 'webflow'],
  ['greenhouse', 'lightricks'],
  ['greenhouse', 'netlify'],
  ['greenhouse', 'calm'],
  ['greenhouse', 'coreweave', 'CoreWeave'],
  ['greenhouse', 'typeface'],
  ['greenhouse', 'chainguard'],
  ['greenhouse', 'hightouch'],
  ['greenhouse', 'fivetran'],
  ['greenhouse', 'gemini'],
  ['greenhouse', 'make'],
  ['greenhouse', 'customerio', 'Customer.io'],
  ['greenhouse', 'klaviyo'],
  ['greenhouse', 'glossier'],

  // ---- Ashby ----
  ['ashby', 'airwallex'],
  ['ashby', 'whoop', 'WHOOP'],
  ['ashby', 'harvey'],
  ['ashby', 'sierra'],
  ['ashby', 'snowflake'],
  ['ashby', 'ramp'],
  ['ashby', 'zip'],
  ['ashby', 'notion'],
  ['ashby', 'miro'],
  ['ashby', 'render'],
  ['ashby', 'strava'],
  ['ashby', 'linear'],
  ['ashby', 'supabase'],
  ['ashby', 'thumbtack'],
  ['ashby', 'abridge'],
  ['ashby', 'mural'],
  ['ashby', 'plaid'],
  ['ashby', 'clickup', 'ClickUp'],
  ['ashby', 'angi', 'Angi'],
  ['ashby', 'poshmark'],
  ['ashby', 'oyster'],
  ['ashby', 'capsule'],
  ['ashby', 'runpod', 'RunPod'],
  ['ashby', 'synthesia'],
  ['ashby', 'deepgram'],
  ['ashby', 'elevenlabs', 'ElevenLabs'],
  ['ashby', 'baseten'],
  ['ashby', 'vanta'],
  ['ashby', 'socket'],
  ['ashby', 'workos', 'WorkOS'],
  ['ashby', 'resend'],
  ['ashby', 'stytch'],
  ['ashby', 'zed', 'Zed'],
  ['ashby', 'secureframe'],
  ['ashby', 'bubble'],
  ['ashby', 'phantom'],
  ['ashby', 'opensea', 'OpenSea'],
  ['ashby', 'alchemy'],
  ['ashby', 'uniswap'],
  ['ashby', 'headway'],
  ['ashby', 'gamma'],
  ['ashby', 'n8n', 'n8n'],
  ['ashby', 'away'],

  // ---- Lever ----
  ['lever', 'logrocket', 'LogRocket'],
  ['lever', 'wealthfront'],
  ['lever', 'gopuff', 'Gopuff'],
];

export const SEED_COMPANIES: Company[] = SEED.map(([source, token, label]) => ({
  source,
  token,
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
  }));
}

export const saveCompanies = (companies: Company[]) => write(KEY.companies, companies);

/* ----------------------------------------------------------------- prefs */

export const PREFS_VERSION = 1;

/**
 * The job types the tool ships looking for.
 *
 * This is the old hardcoded design-title test, written out as terms you can
 * edit. It is close to but not identical to what that test did: the regexes it
 * replaces also carried a reject list (silicon "Design Verification Engineer",
 * "Brand Designer", and so on), and that still runs — see `prefs.exclude` for
 * the tunable half of it.
 *
 * Ordered roughly by how often each one earns its place, because this list is
 * on screen now and the first few are what gets read.
 */
export const DEFAULT_JOB_TYPES = [
  'product design',
  'ux',
  'ui',
  'user experience',
  'user research',
  'design system',
  'interaction design',
  'experience design',
  'content design',
  'service design',
  'design technologist',
  'head of design',
  'design director',
  'design manager',
  'design lead',
  'principal designer',
  'founding designer',
];

export const DEFAULT_PREFS: Prefs = {
  version: PREFS_VERSION,
  jobTypes: [...DEFAULT_JOB_TYPES],
  // Empty means every level, so nothing is hidden until you say so. Trimming
  // the top is the common move — Director+ postings are a different search that
  // shares most of its vocabulary — but defaulting to it would silently drop
  // the "head of design" and "design director" types that ship above.
  levels: [],
  exclude: ['manager', 'research'],
  salaryFloor: null,
  includeUnlistedSalary: true,
  maxAgeDays: null,
  sortBy: 'firstSeen',
  sortDir: 'desc',
};

const SORT_KEYS = new Set<string>(['firstSeen', 'published', 'salary', 'company']);

/**
 * Kept in `LEVEL_ORDER` rather than the order they were clicked, so the stored
 * value is stable and the chips always read seniority-descending. Anything
 * unrecognised is dropped rather than carried.
 */
function coerceLevels(raw: unknown): Level[] {
  if (!Array.isArray(raw)) return [...DEFAULT_PREFS.levels];
  return LEVEL_ORDER.filter((level) => raw.includes(level));
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
 * Fills any gap in a prefs object from the defaults.
 *
 * The stored object is spread *over* the defaults rather than replacing them,
 * so a config written before a field existed picks up that field's default
 * instead of losing everything else it had. Anything that could have been
 * hand-edited into an impossible value is coerced back into range.
 *
 * Exported because localStorage is not the only source of a prefs object: the
 * database holds one too, and a row written before a field existed is missing
 * it just the same. Adopting that copy raw is what blanked `jobTypes` on every
 * browser that had ever synced — the field arrived as `undefined` and the
 * filter it drives read `.length` off it.
 */
export function normalizePrefs(stored: Partial<Prefs> | null | undefined): Prefs {
  if (!stored || typeof stored !== 'object') return DEFAULT_PREFS;

  return {
    ...DEFAULT_PREFS,
    ...stored,
    version: PREFS_VERSION,
    jobTypes: coerceTerms(stored.jobTypes, DEFAULT_PREFS.jobTypes),
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
}

export function loadPrefs(): Prefs {
  const stored = read<Partial<Prefs> | null>(KEY.prefs, null);
  if (!stored || typeof stored !== 'object') return DEFAULT_PREFS;

  const merged = normalizePrefs(stored);

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
  let hidden = 0;

  for (const [id, mark] of Object.entries(marks)) {
    const entry = entryFor(id);
    // The old marks map had no timestamps, so `appliedAt` stays undefined
    // rather than being invented. The Applied tab renders those as an unknown
    // date and sorts them last, which is at least true.
    //
    // `saved` marks are read and dropped: the feature is gone, and carrying the
    // flag forward would only put a field in the store that nothing reads.
    if (mark === 'applied') { entry.applied = true; applied += 1; }
    else if (mark === 'hidden') { entry.hidden = true; hidden += 1; }
  }

  const total = Object.keys(next).length;
  if (total > 0) {
    console.info(
      `[jobwatch] migrated ${total} job records into ${KEY.jobState} — ` +
      `${applied} applied, ${hidden} hidden. Legacy keys left in place.`,
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

/**
 * When Jobwatch first saw a posting: the swept index's stamp where there is
 * one, this browser's otherwise.
 *
 * The index wins, and has to. On the index path `observeJobs` never runs — the
 * client stops fetching boards entirely — so a browser's job state has no
 * opinion about an indexed posting at all, and everything downstream of a
 * missing stamp went quiet: nothing was ever badged new, the "new this week"
 * figure sat at zero, sorting by first-seen was a no-op, and the age filter
 * fell through to `publishedAt` on every row. One shared stamp on the posting
 * itself answers all four, and answers them the same way in every browser.
 */
export const firstSeenOf = (job: Job, state: JobState): number =>
  job.firstSeen ?? state[job.id]?.firstSeen ?? PRE_EXISTING;

/**
 * Whether a posting turned up inside the window.
 *
 * Prefers Jobwatch's own sighting, and falls back to the board's date where
 * there isn't one — exactly what the age filter does a few lines away in
 * `filterJobs`, for exactly the same reason. `PRE_EXISTING` means "here before
 * we started looking", which is not the same as "not new", and reading it as
 * not-new is what makes the figure report zero for a whole lap of the sweep:
 * every posting is baselined on the run that first stamps its shard, so with no
 * fallback there is nothing to count until that shard runs a second time.
 *
 * The board's date is the weaker answer — Greenhouse publishes `updated_at`,
 * which any description edit bumps — but it is an answer, and it only ever
 * applies where Jobwatch has none of its own. Each sweep replaces more of it
 * with a real sighting.
 */
export function isNewSince(
  job: Job,
  state: JobState,
  windowMs: number,
  now = Date.now(),
): boolean {
  const stamp = firstSeenOf(job, state);
  if (stamp !== PRE_EXISTING) return now - stamp < windowMs;

  const published = job.publishedAt ? Date.parse(job.publishedAt) : Number.NaN;
  // A posting with neither is unjudgeable, and unjudgeable is not new.
  return Number.isFinite(published) && now - published < windowMs;
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
    if (liveIds.has(id) || entry.applied || entry.hidden) next[id] = entry;
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
