/**
 * The filtering pipeline.
 *
 * Deliberately a pure function of `(jobs, prefs, jobState, view)` with no React
 * and no DOM in it, so the part that decides what you see can be reasoned about
 * — and tested — on its own.
 */

import { LEVEL_LABELS, matchesJobType, salaryFloor, usEligibility } from './classify';
import { DEFAULT_PREFS } from './store';
import type { Job, JobState, Prefs } from './types';

const DAY = 24 * 60 * 60 * 1000;

/**
 * The two lists. Hidden is a narrowing applied on top of these rather than a
 * destination of its own — see `hiddenOnly`.
 */
export type Tab = 'open' | 'applied';

/**
 * Session-scoped view state: the things you flip while looking, as opposed to
 * the preferences that describe the search itself.
 */
export type View = {
  tab: Tab;
  /**
   * Flips the list over rather than widening it: on, the hidden postings are
   * the only ones shown, which is the way back to un-hiding one. Off, they are
   * the only ones never shown. A switch, not a reveal — mixing hidden rows in
   * with live ones gave a list where the dimming was the only thing telling you
   * which was which.
   */
  hiddenOnly: boolean;
  /** Lowercased search terms, AND'd. */
  terms: string[];
  /** jobId -> prebuilt lowercase haystack, so search doesn't re-derive it. */
  index: Map<string, string>;
};

export const EMPTY_VIEW: View = {
  tab: 'open',
  hiddenOnly: false,
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
  const matchesSearch = (job: Job) => {
    if (view.terms.length === 0) return true;
    const hay = view.index.get(job.id) ?? '';
    return view.terms.every((t) => hay.includes(t));
  };

  const kept = jobs.filter((job) => {
    const entry = state[job.id];
    const title = job.title.toLowerCase();

    // 1 — hidden. One equality rather than two branches, because the switch is
    // exactly a partition: every posting is on one side of it or the other.
    if ((entry?.hidden ?? false) !== view.hiddenOnly) return false;

    // The hidden pile is a record of what you removed, not a search result, and
    // it exists to be undone. Running it through the same preferences that are
    // narrowing everything else is how a posting you hid becomes impossible to
    // find again — tighten a filter and the thing you wanted to unhide is gone
    // from the only view that could have shown it. So this is everything you
    // hid, and only the search box narrows it.
    if (view.hiddenOnly) return matchesSearch(job);

    // 2 — applied. The Applied tab is assembled from job state rather than from
    // the fetch (see `appliedRecords`), so in practice this only ever clears
    // them out of Open — but the guard belongs to the pipeline's contract.
    if (entry?.applied && view.tab !== 'applied') return false;

    // 3 — the job types being looked for. This was a hardcoded design-title
    // test on the grounds that it was what the tool was for; it is a list you
    // edit now, which is the same argument turned around — what the tool is for
    // is whatever you told it to watch.
    if (!matchesJobType(job.title, prefs.jobTypes)) return false;

    // 4 — seniority. None selected reads as "every level", the same way an
    // empty `jobTypes` reads as no narrowing; the alternative — an empty board
    // — is never what was meant.
    //
    // Deliberately separate from the job types above, even though a term like
    // "staff product designer" names a level too. Matching on wording is loose
    // on purpose — it has to reach "Senior Designer" from "senior product
    // designer" — and that looseness was letting "Director, Product Design"
    // through every senior search. Wording and seniority are two questions and
    // they get two answers.
    if (prefs.levels.length > 0 && !prefs.levels.includes(job.level)) return false;

    // 5 — exclude terms, the tunable layer on top of the title test. Narrowing
    // to a phrase is the search box's job, which is why there is no include
    // list.
    if (matchesAny(title, prefs.exclude)) return false;

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

    // 9 — age. The board's own date, and only that.
    //
    // This used to prefer Jobwatch's first-seen stamp on the grounds that
    // Greenhouse exposed only `updated_at`, which bumps on any description
    // edit. That reason is gone — `sources.ts` reads `first_published` now — and
    // the stamp was never an age to begin with: it records when a sweep reached
    // the board, so "posted in the last 3 days" quietly meant "swept in the last
    // 3 days", and every posting present at the first sweep shared one
    // `PRE_EXISTING` baseline that had to be special-cased back out again. A
    // filter that says "last week" should mean the date printed on the row.
    //
    // Same rule as pay above for a posting that published no date: unjudgeable
    // is kept, not guessed at.
    if (prefs.maxAgeDays != null && job.publishedAt) {
      const published = Date.parse(job.publishedAt);
      if (Number.isFinite(published) && published < now - prefs.maxAgeDays * DAY) return false;
    }

    // View-scoped narrowing, after the preferences so the order above is the
    // one documented.
    return matchesSearch(job);
  });

  // 10 — sort.
  return sortJobs(kept, prefs);
}

/* ------------------------------------------------------------------ sort */

export function sortJobs(jobs: Job[], prefs: Prefs): Job[] {
  const dir = prefs.sortDir === 'asc' ? 1 : -1;

  const at = (job: Job) => (job.publishedAt ? Date.parse(job.publishedAt) : Number.NaN);

  /**
   * The tiebreaker under every other sort, and the whole of the default one.
   *
   * A posting with no date is not an old posting, so it settles to the end of
   * its tie on title rather than sorting as 1970 — the same rule the salary and
   * published cases apply to their own missing values, kept in one place so a
   * dateless row lands consistently whichever column is chosen.
   */
  const newestFirst = (a: Job, b: Job) => {
    const av = at(a);
    const bv = at(b);
    if (Number.isNaN(av) || Number.isNaN(bv)) {
      if (Number.isNaN(av) && Number.isNaN(bv)) return a.title.localeCompare(b.title);
      return Number.isNaN(av) ? 1 : -1;
    }
    return bv - av || a.title.localeCompare(b.title);
  };

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

      // The default, and the only one that reads a date directly. Descending —
      // the stored default — is exactly `newestFirst`, so this delegates rather
      // than restating the missing-date rule a second, subtly different way.
      default: {
        if (prefs.sortDir === 'desc') return newestFirst(a, b);
        const av = at(a);
        const bv = at(b);
        // Still last, not first: ascending means oldest-first, and a posting
        // with no date is not the oldest posting.
        if (Number.isNaN(av) || Number.isNaN(bv)) {
          if (Number.isNaN(av) && Number.isNaN(bv)) return a.title.localeCompare(b.title);
          return Number.isNaN(av) ? 1 : -1;
        }
        return av - bv || a.title.localeCompare(b.title);
      }
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
  // Job types are not counted: they are on screen in the hero, not folded away
  // behind this badge, so they can never be the forgotten reason for an empty
  // board. Seniority is, so it is.
  if (prefs.levels.length > 0) n += 1;
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
