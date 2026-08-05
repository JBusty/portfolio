/**
 * The filtering pipeline.
 *
 * Deliberately a pure function of `(jobs, prefs, jobState, view)` with no React
 * and no DOM in it, so the part that decides what you see can be reasoned about
 * — and tested — on its own.
 */

import { LEVEL_LABELS, LEVEL_ORDER, isDesignRole, salaryFloor, usEligibility } from './classify';
import { DEFAULT_PREFS, PRE_EXISTING } from './store';
import type { Job, JobState, Prefs } from './types';

const DAY = 24 * 60 * 60 * 1000;

/**
 * The two lists. Saved and hidden are narrowings applied on top of these rather
 * than destinations of their own — see `savedOnly` and `showHidden`.
 */
export type Tab = 'open' | 'applied';

/**
 * Session-scoped view state: the things you flip while looking, as opposed to
 * the preferences that describe the search itself.
 */
export type View = {
  tab: Tab;
  /** Narrows to starred roles without spending a whole tab on them. */
  savedOnly: boolean;
  /** The only way back to a hidden posting, since step 1 drops them outright. */
  showHidden: boolean;
  /** Lowercased search terms, AND'd. */
  terms: string[];
  /** jobId -> prebuilt lowercase haystack, so search doesn't re-derive it. */
  index: Map<string, string>;
};

export const EMPTY_VIEW: View = {
  tab: 'open',
  savedOnly: false,
  showHidden: false,
  terms: [],
  index: new Map(),
};

const matchesAny = (title: string, terms: string[]) => terms.some((t) => title.includes(t));

/* ---------------------------------------------------------------- filter */

export function filterJobs(
  jobs: Job[],
  prefs: Prefs,
  state: JobState,
  view: View,
  now = Date.now(),
): Job[] {
  // All levels off reads as "no level filter", the same way an empty include
  // list does. The alternative — an empty board — is never what was meant.
  const levelFilterOn = LEVEL_ORDER.some((level) => prefs.levels[level]);

  const kept = jobs.filter((job) => {
    const entry = state[job.id];
    const title = job.title.toLowerCase();

    // 1 — hidden. The Hidden toggle is the only way back to one.
    if (entry?.hidden && !view.showHidden) return false;

    // 2 — applied. The Applied tab is assembled from job state rather than from
    // the fetch (see `appliedRecords`), so in practice this only ever clears
    // them out of Open — but the guard belongs to the pipeline's contract.
    if (entry?.applied && view.tab !== 'applied') return false;

    // 3 — the design-title test. Not a preference: it is what the tool is for,
    // and a switch labelled "design only" on a product-design board only ever
    // read as a question about something else.
    if (!isDesignRole(job.title)) return false;

    // 4 — exclude terms, the tunable layer on top of that test. Narrowing to a
    // phrase is the search box's job, which is why there is no include list.
    if (matchesAny(title, prefs.exclude)) return false;

    // 5 — levels.
    if (levelFilterOn && !prefs.levels[job.level]) return false;

    // 6 — remote. Not a preference either: an on-site role is not a result this
    // board has any business returning.
    if (!job.remote) return false;

    // 7 — US only, on the same footing as remote for the same reason. A posting
    // that names no geography at all is kept rather than guessed at: it is a
    // sixth of the remote set, and marked in the row so the list never implies
    // a confirmation it doesn't have.
    if (usEligibility(job.location) === 'non-us') return false;

    // 8 — pay. A floor can only judge a posting that published a number, and
    // roughly two-thirds of them don't; dropping those by default would look
    // like a broken fetch rather than a filter.
    const floor = salaryFloor(job.salary);
    if (floor == null) {
      if (!prefs.includeUnlistedSalary) return false;
    } else if (prefs.salaryFloor != null && floor < prefs.salaryFloor) {
      return false;
    }

    // 9 — age. Prefers our own first-seen stamp, because Greenhouse exposes
    // only `updated_at` and that bumps on any description edit.
    //
    // But everything present at the first sync is stamped PRE_EXISTING, so on a
    // fresh install *every* posting has a baseline stamp — and treating that as
    // "age unknown, therefore excluded" emptied the board for any age setting.
    // Falling back to the board's own date is less precise and still right far
    // more often than showing nothing.
    if (prefs.maxAgeDays != null) {
      const cutoff = now - prefs.maxAgeDays * DAY;
      const first = entry?.firstSeen ?? PRE_EXISTING;
      const stamp =
        first !== PRE_EXISTING
          ? first
          : job.publishedAt
            ? Date.parse(job.publishedAt)
            : Number.NaN;
      // Only a posting with neither stamp is unjudgeable; those are kept.
      if (Number.isFinite(stamp) && stamp < cutoff) return false;
    }

    // View-scoped narrowing, after the preferences so the order above is the
    // one documented.
    if (view.savedOnly && !entry?.saved) return false;
    if (view.terms.length > 0) {
      const hay = view.index.get(job.id) ?? '';
      if (!view.terms.every((t) => hay.includes(t))) return false;
    }

    return true;
  });

  // 10 — sort.
  return sortJobs(kept, prefs, state);
}

/* ------------------------------------------------------------------ sort */

const firstSeenOf = (state: JobState, id: string) => state[id]?.firstSeen ?? PRE_EXISTING;

export function sortJobs(jobs: Job[], prefs: Prefs, state: JobState): Job[] {
  const dir = prefs.sortDir === 'asc' ? 1 : -1;
  const seen = (job: Job) => firstSeenOf(state, job.id);
  const newestFirst = (a: Job, b: Job) => seen(b) - seen(a);

  return [...jobs].sort((a, b) => {
    switch (prefs.sortBy) {
      case 'salary': {
        // The low end of the band is the comparable number. A missing band is
        // not a low band, so unlisted sinks to the bottom in either direction
        // rather than pretending to be $0 or $∞.
        const av = salaryFloor(a.salary);
        const bv = salaryFloor(b.salary);
        if (av == null || bv == null) {
          if (av == null && bv == null) return newestFirst(a, b);
          return av == null ? 1 : -1;
        }
        return (av - bv) * dir || newestFirst(a, b);
      }

      case 'company':
        // Alphabetical, then newest-first inside each company.
        return a.company.localeCompare(b.company) * dir || newestFirst(a, b);

      case 'published': {
        const at = a.publishedAt ? Date.parse(a.publishedAt) : Number.NaN;
        const bt = b.publishedAt ? Date.parse(b.publishedAt) : Number.NaN;
        // Same rule as salary: no date sorts last, not oldest.
        if (Number.isNaN(at) || Number.isNaN(bt)) {
          if (Number.isNaN(at) && Number.isNaN(bt)) return newestFirst(a, b);
          return Number.isNaN(at) ? 1 : -1;
        }
        return (at - bt) * dir;
      }

      default:
        return (seen(a) - seen(b)) * dir || a.title.localeCompare(b.title);
    }
  });
}

/* --------------------------------------------------------------- applied */

export type AppliedRecord = {
  id: string;
  /** Live while the req is still open, otherwise rebuilt from the snapshot. */
  job: Job;
  appliedAt: number | undefined;
};

const SOURCE_BY_PREFIX: Record<string, Job['source']> = {
  gh: 'greenhouse',
  lv: 'lever',
  ab: 'ashby',
};

/**
 * An applied entry with neither a live posting nor a snapshot — only possible
 * for a mark made before snapshots existed, on a req that has since closed.
 * The record is never deleted, so it gets a row that says so.
 */
function placeholder(id: string): Job {
  return {
    id,
    company: 'Unknown',
    title: 'Posting no longer available',
    level: 'mid',
    location: 'No record kept',
    url: '',
    publishedAt: null,
    salary: null,
    descriptionHtml: '',
    source: SOURCE_BY_PREFIX[id.split(':')[0]] ?? 'greenhouse',
    companyKey: '',
    remote: false,
    team: null,
  };
}

/**
 * The application log, newest first.
 *
 * Built from job state rather than the fetch, because the point of this tab is
 * the roles that are no longer on any board. Preferences are not applied here —
 * a filter has no business hiding something you already applied to — but the
 * search box still narrows it, which is how you find one six weeks later.
 */
export function appliedRecords(state: JobState, jobs: Job[], view: View): AppliedRecord[] {
  const live = new Map(jobs.map((job) => [job.id, job]));

  const records: AppliedRecord[] = [];
  for (const [id, entry] of Object.entries(state)) {
    if (!entry.applied) continue;

    const job =
      live.get(id) ??
      (entry.snapshot ? { ...entry.snapshot, descriptionHtml: '' } : placeholder(id));

    if (view.terms.length > 0) {
      const hay = view.index.get(id) ?? `${job.title} ${job.company} ${job.location}`.toLowerCase();
      if (!view.terms.every((t) => hay.includes(t))) continue;
    }

    records.push({ id, job, appliedAt: entry.appliedAt });
  }

  // Migrated marks carry no timestamp; they sort last rather than to 1970.
  return records.sort((a, b) => {
    if (a.appliedAt == null || b.appliedAt == null) {
      if (a.appliedAt == null && b.appliedAt == null) return 0;
      return a.appliedAt == null ? 1 : -1;
    }
    return b.appliedAt - a.appliedAt;
  });
}

/**
 * How many preferences have been moved off their defaults.
 *
 * The panel collapses, and a collapsed panel is a good way to forget why the
 * board looks empty — this is the badge that says something is on. Sort is left
 * out: it reorders, it never hides anything.
 */
export function countTuned(prefs: Prefs): number {
  let n = 0;
  for (const level of LEVEL_ORDER) {
    if (prefs.levels[level] !== DEFAULT_PREFS.levels[level]) n += 1;
  }
  if (prefs.exclude.join('|') !== DEFAULT_PREFS.exclude.join('|')) n += 1;
  if (prefs.salaryFloor !== DEFAULT_PREFS.salaryFloor) n += 1;
  if (prefs.includeUnlistedSalary !== DEFAULT_PREFS.includeUnlistedSalary) n += 1;
  if (prefs.maxAgeDays !== DEFAULT_PREFS.maxAgeDays) n += 1;
  return n;
}

/* ---------------------------------------------------------------- reason */

/**
 * One line of plain text explaining why a posting surfaced, assembled from the
 * things that let it through: "staff · $180k+". Deterministic and local — no
 * API call, no model, nothing that can be wrong in an interesting way.
 *
 * "remote" is not in it: every row is remote now, and a fact true of every line
 * on screen tells you nothing. Sector isn't either — see the note on why
 * industries came out.
 */
export function explainMatch(job: Job, prefs: Prefs): string {
  const parts: string[] = [LEVEL_LABELS[job.level].toLowerCase()];

  const floor = salaryFloor(job.salary);
  if (floor != null) parts.push(`$${Math.round(floor / 1000)}k+`);
  else if (prefs.salaryFloor != null) parts.push('pay unlisted');

  return parts.join(' · ');
}
