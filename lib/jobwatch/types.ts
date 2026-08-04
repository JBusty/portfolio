/**
 * Jobwatch — shared types.
 *
 * Three ATS platforms with three unrelated payload shapes get flattened into
 * one `Job`. Everything downstream (filtering, sorting, rendering) only ever
 * sees the normalized form.
 */

export type SourceKind = 'greenhouse' | 'lever' | 'ashby';

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
};

/**
 * A posting minus its description — small enough to keep in localStorage.
 *
 * Doubles as the archive record behind an application: once a req closes the
 * URL 404s, so the Applied tab reads from a snapshot rather than the live fetch.
 */
export type JobSnapshot = Omit<Job, 'descriptionHtml'>;

/**
 * Sector, assigned per company on the watchlist.
 *
 * None of the three ATS APIs expose anything like this — there is no industry
 * field to read — so it is a property of the board, hand-assigned, not derived
 * from the posting. Boards added from the UI start as `other`.
 */
export type Industry =
  | 'fintech' | 'health' | 'devtools' | 'design' | 'productivity'
  | 'social' | 'commerce' | 'mobility' | 'ai' | 'hr' | 'education' | 'other';

/** One entry on the watchlist: a board to poll. */
export type Company = {
  /** `${source}:${token}` — stable identity across renames. */
  key: string;
  source: SourceKind;
  token: string;
  /** Display name; falls back to the token until a fetch reports the real one. */
  label: string;
  industry: Industry;
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
  saved?: boolean;
  /** Written when a job is marked applied, refreshed while it stays fetchable. */
  snapshot?: JobSnapshot;
};

export type JobState = Record<string, JobStateEntry>;

/* ----------------------------------------------------------------- prefs */

export type SortBy = 'firstSeen' | 'published' | 'salary' | 'company';
export type SortDir = 'asc' | 'desc';

/**
 * Independent per-level switches rather than a minimum threshold. Principal
 * outranks Staff at some companies and sits under it at others, so a threshold
 * would silently drop roles on the wrong side of whichever order was assumed.
 */
export type LevelPrefs = Record<Level, boolean>;

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
  levels: LevelPrefs;
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
