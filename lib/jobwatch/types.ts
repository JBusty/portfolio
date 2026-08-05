/**
 * Jobwatch — shared types.
 *
 * Seven ATS platforms with seven unrelated payload shapes get flattened into
 * one `Job`. Everything downstream (filtering, sorting, rendering) only ever
 * sees the normalized form.
 */

/**
 * The platforms with an adapter.
 *
 * The first three answer with a single GET of public JSON. The four added after
 * them are not uniform: Workday needs a POST and pages 20 at a time, Rippling
 * repeats a posting once per location, and both carry a compound or opaque
 * token. `sources.ts` absorbs those differences so nothing downstream sees them.
 */
export type SourceKind =
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'smartrecruiters'
  | 'workday'
  | 'breezy'
  | 'rippling';

/** Seniority read out of the title — no ATS exposes this as a field. */
export type Level = 'exec' | 'principal' | 'staff' | 'lead' | 'senior' | 'mid';

export type Salary = {
  /** Annualized, so a min-salary filter can compare across sources. */
  min: number | null;
  max: number | null;
  currency: string;
  /** Display string, kept verbatim from the source where one was provided. */
  text: string;
  /** True when the numbers were scraped out of prose rather than a real field. */
  estimated: boolean;
};

export type Job = {
  id: string;
  company: string;
  title: string;
  level: Level;
  location: string;
  url: string;
  publishedAt: string | null;
  salary: Salary | null;
  descriptionHtml: string;

  // ---- derived, beyond the base shape ----
  source: SourceKind;
  /** Which watchlist entry produced this, for per-company filtering. */
  companyKey: string;
  remote: boolean;
  team: string | null;
  /**
   * When the sweep first found this posting, epoch ms — or `PRE_EXISTING` for
   * the ones already on the board the first time its shard ran.
   *
   * Written server-side and shared, which is the point: it is the index's
   * sighting rather than this browser's, so "new this week" means the same
   * thing on a machine that opened the page today as on one that has had it
   * open for a month. Absent on the local-watchlist path, where there is no
   * shared index to have seen anything — those fall back to the per-browser
   * stamp on `JobStateEntry`. See `firstSeenOf`.
   */
  firstSeen?: number;
};

/**
 * A posting minus its description — small enough to keep in localStorage.
 *
 * Doubles as the archive record behind an application: once a req closes the
 * URL 404s, so the Applied tab reads from a snapshot rather than the live fetch.
 */
export type JobSnapshot = Omit<Job, 'descriptionHtml'>;

/**
 * One entry on the watchlist: a board to poll.
 *
 * There is no industry on here. It was hand-assigned per company, which worked
 * while the watchlist was a hundred boards somebody had classified — and stopped
 * meaning anything the moment discovery started finding sixteen hundred. No ATS
 * publishes a sector, so there was nothing to derive the rest from, leaving a
 * filter where almost every row read "other".
 */
export type Company = {
  /** `${source}:${token}` — stable identity across renames. */
  key: string;
  source: SourceKind;
  token: string;
  /** Display name; falls back to the token until a fetch reports the real one. */
  label: string;
};

export type FetchStatus = 'idle' | 'loading' | 'ok' | 'error';

export type CompanyResult = {
  key: string;
  status: FetchStatus;
  jobs: Job[];
  error: string | null;
  fetchedAt: number | null;
};

/**
 * Per-job triage state, the part worth surviving a reload.
 *
 * Legacy shape, kept only so the v1 migration can read what earlier versions
 * wrote into `jobwatch:marks:v1`. Nothing in the UI uses it any more.
 */
export type JobMark = 'saved' | 'applied' | 'hidden';

/* ------------------------------------------------------------- job state */

/**
 * A `firstSeen` of `PRE_EXISTING` means "already on the board when Jobwatch
 * first looked" — a baseline rather than a sighting. Those are never new, and
 * an age filter can't judge them either. See `observeJobs` and `stampFirstSeen`,
 * which write it on the client and on the server for the same reason.
 *
 * The one value in this file, because it is what gives both `firstSeen` fields
 * their meaning and both sides of the wire have to agree on it.
 */
export const PRE_EXISTING = 0;

/**
 * Per-job triage, keyed by job id and stored under `jobwatch:jobstate:v1`.
 *
 * `firstSeen` is Jobwatch's own timestamp, written once when an id is first
 * observed and never updated afterwards — see `observeJobs`.
 */
export type JobStateEntry = {
  firstSeen: number;
  applied?: boolean;
  /** Absent on entries migrated from the old marks map, which carried no time. */
  appliedAt?: number;
  hidden?: boolean;
  /** Written when a job is marked applied, refreshed while it stays fetchable. */
  snapshot?: JobSnapshot;
  /**
   * When you last changed this entry — the field that lets two browsers be
   * reconciled instead of one silently overwriting the other.
   *
   * Absent on everything written before the database existed. Those are treated
   * as older than nothing, and a tie goes to the local copy, which is what makes
   * the first sync seed the database from this browser rather than from a table
   * of bare firstSeen stamps.
   */
  updatedAt?: number;
};

export type JobState = Record<string, JobStateEntry>;

/* ----------------------------------------------------------------- prefs */

export type SortBy = 'firstSeen' | 'published' | 'salary' | 'company';
export type SortDir = 'asc' | 'desc';


/**
 * Everything that shapes the result list, stored under `jobwatch:prefs:v1`.
 *
 * Three things that were switches here are now fixed properties of the tool:
 * the design-title test, remote-only, and the `include` list. The first two are
 * what the board is for — a toggle to turn them off only ever read as a
 * question about something else — and narrowing to a phrase is what the search
 * box does, which left `include` as a second, worse copy of it.
 */
export type Prefs = {
  version: number;
  /**
   * When these were last changed, so two browsers can be reconciled by which
   * edit is newer. Preferences are one document with no per-field history, so
   * there is nothing finer to compare than the whole thing.
   */
  updatedAt?: number;
  /**
   * The kinds of job being looked for, OR'd, matched against the title from the
   * start of a word — see `matchesJobType`.
   *
   * This replaced a hardcoded design-title test. It drives both halves of the
   * tool: the client narrows the index with it, and the sweep uses it to decide
   * what enters the index at all. A term added here therefore shows results
   * from what is already indexed immediately, but only reaches the boards
   * themselves on the next sweep.
   */
  jobTypes: string[];
  /**
   * Seniorities to show. Empty means all of them, the same way an empty
   * `jobTypes` means no narrowing.
   *
   * A plain set rather than a min/max band. The band was one idea wearing two
   * controls — pick a floor, pick a ceiling, and keep them from crossing — and
   * it bought nothing, because with six values every band is just a selection
   * you could have clicked. It also had to assume an order, and Principal
   * outranks Staff at some companies and sits under it at others.
   *
   * Applied on the client only. The sweep indexes a posting on its title alone,
   * so changing this re-cuts what is already in hand and never needs a sweep —
   * which is the whole reason it is a filter here rather than a rule back
   * there.
   */
  levels: Level[];
  /** Lowercase substring matches against the title, OR'd. A title hitting any
      of these is dropped before anything else looks at it. */
  exclude: string[];
  salaryFloor: number | null;
  includeUnlistedSalary: boolean;
  /** Measured against `firstSeen`, falling back to `publishedAt` — see `filterJobs`. */
  maxAgeDays: number | null;
  sortBy: SortBy;
  sortDir: SortDir;
};
