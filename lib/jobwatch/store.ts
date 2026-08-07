/**
 * Jobwatch's pure state logic: the defaults, the coercions that make a stored
 * object safe to use, and the first-seen bookkeeping.
 *
 * There is no persistence in here any more. Every one of these used to be a
 * localStorage read or write, with the database as a second copy reconciled on
 * load — an arrangement that was reasonable for one user and became a bug the
 * moment there were accounts, because the browser copy has no idea who is
 * signed in. Signing out and back in as somebody else inherited the previous
 * person's filters and application log straight out of local storage.
 *
 * So the database is the only store, and this file is what shapes what comes
 * out of it. Everything below is a pure function of its arguments, which is
 * also what makes it testable without a browser.
 */

import { LEVEL_ORDER } from './classify';
import { plural, titleCase } from './format';
import { companyKey } from './sources';
import {
  DISMISS_REASONS,
  PRE_EXISTING,
  type DismissReason,
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

/* ------------------------------------------------------------- companies */

/**
 * Rows from the database into watchlist entries.
 *
 * An empty list is a real answer — a new account with no boards — but it is the
 * same answer as an account that has never fetched anything, and for the second
 * one the seed is what makes the tool useful on arrival. Falling back to it is
 * therefore right on the way in and wrong on the way out: `writeCompanies`
 * would then treat the seed as a list somebody built and store 170 rows nobody
 * asked for. The fallback lives here, on the read.
 */
export function toCompanies(rows: Array<Partial<Company>> | null | undefined): Company[] {
  if (!Array.isArray(rows) || rows.length === 0) return SEED_COMPANIES;
  return rows
    .filter((c): c is Company => Boolean(c && c.source && c.token))
    .map((c) => ({ ...c, key: c.key || companyKey(c.source, c.token) }));
}

/* ----------------------------------------------------------------- prefs */

export const PREFS_VERSION = 1;

/**
 * What a new account watches for: nothing in particular.
 *
 * This shipped as seventeen terms — the old hardcoded design-title test written
 * out as editable chips. That made sense as a migration and stopped making
 * sense the moment there were accounts to open: a new arrival met a field
 * already full of somebody else's search, in a control whose whole job is to
 * say what *you* are looking for. Seventeen chips also read as configuration
 * rather than as an invitation, and the first instinct is to start deleting.
 *
 * Empty means no narrowing, not no results. The index is already a design
 * board — see the sweep's `isDesignRole` fallback, which is what fills it when
 * no account has asked for anything specific — so an untouched field shows
 * everything indexed and every term added from here is a narrowing you chose.
 *
 * Existing accounts are untouched: this is the default for a prefs row that
 * does not exist yet, not a migration over the ones that do.
 */
export const DEFAULT_JOB_TYPES: string[] = [];

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

/**
 * The values the two numeric preferences are edited on.
 *
 * Here rather than in the panel that draws them, because the panel is not the
 * only thing that sets them any more: `dismissalSuggestions` proposes a floor
 * off the back of what you dismissed, and a floor that isn't one of these
 * lands the panel's `<select>` on a value it has no option for — which renders
 * as blank, and reads as the filter having been cleared. One ladder, so a
 * suggestion can only ever propose a rung the control can show.
 */
export const SALARY_STEPS: Array<[number | null, string]> = [
  [null, 'Any'],
  [150_000, '$150k+'],
  [180_000, '$180k+'],
  [200_000, '$200k+'],
  [250_000, '$250k+'],
];

export const AGE_STEPS: Array<[number | null, string]> = [
  [null, 'Any age'],
  [1, 'Last 24h'],
  [3, 'Last 3 days'],
  [7, 'Last week'],
  [14, 'Last 2 weeks'],
  [30, 'Last month'],
];

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
 * Every prefs object now arrives over the wire, and a row written before a
 * field existed is missing it — so this runs on the way in, always. Adopting a
 * stored copy raw is what blanked `jobTypes` on every browser that had ever
 * synced: the field arrived as `undefined` and the filter it drives read
 * `.length` off it.
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

/* ------------------------------------------------------------- job state */

export const toSnapshot = ({ descriptionHtml: _drop, ...rest }: Job): JobSnapshot => rest;

const REASON_IDS = new Set<string>(DISMISS_REASONS);

/** Longer than this is a paragraph, and nothing reads it as one. */
export const NOTE_LIMIT = 140;

export const coerceNote = (raw: unknown): string | undefined => {
  if (typeof raw !== 'string') return undefined;
  const note = raw.trim().slice(0, NOTE_LIMIT);
  return note || undefined;
};

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
  // Dropped rather than carried when it names a reason this build doesn't have:
  // an unknown id counts toward no tally and matches no suggestion, so keeping
  // it would only put a value in the store that every reader has to guard.
  if (typeof e.dismissReason === 'string' && REASON_IDS.has(e.dismissReason)) {
    entry.dismissReason = e.dismissReason as DismissReason;
  }
  const note = coerceNote(e.dismissNote);
  if (note) entry.dismissNote = note;
  if (e.snapshot && typeof e.snapshot === 'object') entry.snapshot = e.snapshot;
  return entry;
}

export function normalizeJobState(raw: Record<string, unknown>): JobState {
  const out: JobState = {};
  for (const [id, value] of Object.entries(raw)) {
    const entry = coerceEntry(value);
    if (entry) out[id] = entry;
  }
  return out;
}

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
 * The fallback is permanent, not transitional. A baselined posting keeps
 * `firstSeen === PRE_EXISTING` for as long as it stays on its board:
 * `stampFirstSeen` carries a known stamp forward with `known.get(id) ?? …`, and
 * `0` is not `undefined`, so the baseline is never overwritten by a later run.
 * Only postings that are new to the index ever get a real sighting. So which
 * date a source publishes decides whether its postings can be counted new at
 * all, indefinitely:
 *
 *   - Greenhouse, Lever, Ashby, SmartRecruiters and Breezy all publish a real
 *     creation date. Greenhouse sends `first_published` alongside `updated_at`
 *     and `sources.ts` prefers it, so an edited description no longer reads as
 *     a fresh posting.
 *   - Workday publishes prose, and "Posted 30+ Days Ago" deliberately becomes
 *     null rather than an invented boundary date — see `workdayPostedAt`.
 *   - Rippling publishes no date anywhere in its payload.
 *
 * The last two therefore never count as new once baselined. That is the honest
 * answer rather than a bug to route around: neither source tells us when the
 * posting appeared, and the alternative is to guess. Postings discovered on a
 * later sweep are unaffected — they carry a real stamp and take the branch
 * above.
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
