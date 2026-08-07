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

/**
 * Nothing narrowed, on purpose.
 *
 * Every filter here is off: no job types, every seniority, no excluded words,
 * no pay floor, no age limit, unlisted pay kept. A new account sees the whole
 * indexed board and narrows it from there.
 *
 * `exclude` was the last holdout — it shipped as `['manager', 'research']`,
 * which is a real opinion about which design jobs are worth seeing and one
 * nobody consented to. Two words is enough to hide an entire discipline: a user
 * researcher would have opened Jobwatch, seen no research roles at all, and had
 * no reason to suspect a default was doing it, because the count of tuned
 * filters counts *changes from the default* and so read as zero.
 *
 * `includeUnlistedSalary: true` looks like the odd one out and is not — it is
 * the un-narrowed setting. Turning it off is what filters.
 */
export const DEFAULT_PREFS: Prefs = {
  version: PREFS_VERSION,
  jobTypes: [...DEFAULT_JOB_TYPES],
  levels: [],
  exclude: [],
  salaryFloor: null,
  includeUnlistedSalary: true,
  maxAgeDays: null,
  sortBy: 'published',
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

/**
 * Doubles as the migration off `firstSeen`, which was the default and so is
 * what most stored prefs hold: it is no longer a member, so `normalizePrefs`
 * drops it to the default like any other unrecognised value. No dated branch to
 * delete later.
 */
const SORT_KEYS = new Set<string>(['published', 'salary', 'company']);

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
 * opinion about an indexed posting at all, and a missing stamp meant nothing
 * was ever badged new and the "new this week" figure sat at zero. One shared
 * stamp on the posting itself answers that the same way in every browser.
 *
 * `isNewSince` is the only reader. Sorting and the age filter both used to call
 * this and no longer do — see `SortBy` — because neither question it answers is
 * about the posting: it records when a sweep got round to the board, and after
 * a first run it is the same `PRE_EXISTING` for the entire index.
 */
export const firstSeenOf = (job: Job, state: JobState): number =>
  job.firstSeen ?? state[job.id]?.firstSeen ?? PRE_EXISTING;

/**
 * Whether to badge a posting new: two things have to be true of it.
 *
 *   1. It was just posted — the board's own date is inside the window.
 *   2. We hadn't already shown it to you — it is new to the index, not
 *      something that has been sitting on the list.
 *
 * An AND, and it has to be. Either half alone is a claim the data doesn't
 * support. A recent `publishedAt` on its own re-badges a posting you have
 * scrolled past for six days running, because nothing about the board's date
 * changes when you read the row. A fresh sighting on its own badges a
 * three-year-old req the moment its company joins the watchlist, which is new
 * to Jobwatch and not remotely new to you — and that is the common case, since
 * discovery adds boards continuously.
 *
 * This used to be a fallback chain — our sighting where there was one, the
 * board's date otherwise — which made "new" mean a different thing per posting
 * depending on which stamps it happened to carry. Both stamps are now required
 * to agree, and `PRE_EXISTING` reads as plain "was already here", with none of
 * the special pleading a fallback needed to make it mean something else.
 *
 * The known gap is condition 1 on a source that publishes no date: Workday
 * turns "Posted 30+ Days Ago" into null rather than inventing a boundary (see
 * `workdayPostedAt`), and Rippling sends no date anywhere in its payload.
 * Refusing to badge those at all would cost two whole sources their badge
 * permanently, including genuinely fresh postings, so a first sighting stands
 * in as evidence of a recent posting where there is nothing better. The cron
 * sweeps one of three shards daily, so "newly in the index" resolves to about
 * three days against a seven-day window — coarse, and the only signal those
 * two sources give us. Every other source publishes a real creation date and
 * takes the strict path.
 */
export function isNewSince(
  job: Job,
  state: JobState,
  windowMs: number,
  now = Date.now(),
): boolean {
  // 2 — had we shown it to you? A baseline says it was here before we started
  // recording, which is a yes. Checked first because it is the half that is
  // always answerable.
  const stamp = firstSeenOf(job, state);
  if (stamp === PRE_EXISTING || now - stamp >= windowMs) return false;

  // 1 — was it just posted? No date at all means no better evidence than the
  // sighting above, which has already passed.
  if (!job.publishedAt) return true;

  const published = Date.parse(job.publishedAt);
  // An unparseable date is a broken date, not a missing one: the source claimed
  // to have published a value. Falling back here would badge whatever a parser
  // change happened to break, so it doesn't.
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
