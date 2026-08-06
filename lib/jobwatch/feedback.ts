/**
 * What "not relevant" is worth, once you've said it a few times.
 *
 * Dismissing a posting is already useful on its own — it leaves the list. The
 * reason is for the other half: every one of the top four reasons names a
 * preference that exists, so a pile of them is a specific setting that is
 * wrong, and this is the part that says which and by how much.
 *
 * Pure, like `filter.ts`, and for the same reason — this decides what gets
 * proposed as a change to the search itself, and that should be readable
 * without a browser in the way.
 */

import { LEVEL_LABELS, LEVEL_ORDER, salaryFloor } from './classify';
import { SALARY_STEPS } from './store';
import type { DismissReason, Job, JobState, Prefs } from './types';

/* --------------------------------------------------------------- catalog */

export type ReasonSpec = {
  id: DismissReason;
  /** The chip in the dialog. Written as an answer to "why isn't this one right". */
  label: string;
  /** Sits under the chip. Says what picking it will do, where it does anything. */
  hint: string;
  /** The pill on a dismissed row, where there is no space for the full label. */
  short: string;
};

/**
 * In the order they are offered, which is roughly how often they are the
 * answer — the first four are also the four that can move a setting, so the
 * ones worth reading first are the ones worth collecting most.
 */
export const DISMISS_REASON_SPECS: ReasonSpec[] = [
  {
    id: 'role',
    label: 'Not the kind of work',
    hint: 'The title is design, but not this discipline',
    short: 'wrong role',
  },
  {
    id: 'level',
    label: 'Wrong seniority',
    hint: 'Too junior or too senior for what I want',
    short: 'wrong level',
  },
  {
    id: 'pay',
    label: 'Pay is wrong',
    hint: 'Too low, or no band published',
    short: 'pay',
  },
  {
    id: 'stale',
    label: 'Old or already closed',
    hint: 'The req is gone, or long past worth applying to',
    short: 'stale',
  },
  {
    id: 'location',
    label: 'Location or hours',
    hint: 'Not workable from where I am',
    short: 'location',
  },
  {
    id: 'company',
    label: 'Not this company',
    hint: 'Nothing to do with the role itself',
    short: 'company',
  },
  {
    id: 'seen',
    label: 'Already seen it',
    hint: 'Applied elsewhere, or turned it down before',
    short: 'seen',
  },
  {
    id: 'other',
    label: 'Something else',
    hint: 'Say it in your own words',
    short: 'other',
  },
];

export const REASON_SHORT: Record<DismissReason, string> = Object.fromEntries(
  DISMISS_REASON_SPECS.map((spec) => [spec.id, spec.short]),
) as Record<DismissReason, string>;

/* ---------------------------------------------------------------- tally */

export type ReasonTally = { reason: DismissReason; count: number };

export type DismissalSummary = {
  /** Every posting on the dismissed pile, answered or not. */
  total: number;
  /** The ones carrying a reason — the only ones that can tune anything. */
  answered: number;
  /** Reasons actually used, commonest first. */
  tallies: ReasonTally[];
};

export function summarizeDismissals(state: JobState): DismissalSummary {
  const counts = new Map<DismissReason, number>();
  let total = 0;
  let answered = 0;

  for (const entry of Object.values(state)) {
    if (!entry.hidden) continue;
    total += 1;
    if (!entry.dismissReason) continue;
    answered += 1;
    counts.set(entry.dismissReason, (counts.get(entry.dismissReason) ?? 0) + 1);
  }

  const tallies = [...counts]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return { total, answered, tallies };
}

/* ----------------------------------------------------------- suggestions */

/**
 * A change to the search, with the evidence that produced it.
 *
 * `patch` goes straight to `updatePrefs`, so a suggestion is a button rather
 * than a sentence about a button. Nothing is ever applied without a press:
 * these are read off what you dismissed, and being right about most of them is
 * not the same as being right about this one.
 */
export type Suggestion = {
  /** Stable across renders so React can key on it. */
  key: string;
  /** The button. Names the resulting state, not the act — "Pay from $180k+". */
  label: string;
  /** The evidence, in one sentence. */
  because: string;
  patch: Partial<Prefs>;
};

/**
 * How many dismissals have to *agree* before a suggestion is offered.
 *
 * Applied to the agreeing postings, not to the size of the pile they came from
 * — which is the distinction that matters, and getting it wrong is what put
 * "2 of the 4 you marked wrong-seniority are Senior" on screen as though it
 * were a finding. Two is a coincidence, and this proposes narrowing a job
 * search: the cost of firing early is a filter that quietly removes roles you
 * would have wanted, discovered weeks later if at all.
 */
const MIN_EVIDENCE = 3;

/**
 * …and how much of the reason's own pile they have to be.
 *
 * Both tests, not either: three agreeing out of thirty is a pattern in
 * something else, and three out of four is only three postings.
 */
const MIN_SHARE = 0.4;

/**
 * Words that carry no signal about *kind* of role.
 *
 * Seniority words are in here because seniority has its own reason and its own
 * filter: letting "senior" win the word count would propose excluding it as a
 * title word, which drops the level filter's whole job into the exclude list
 * where it matches far more than it should.
 */
const IGNORE_WORDS = new Set([
  'senior', 'staff', 'principal', 'lead', 'director', 'head', 'manager',
  'associate', 'junior', 'intern', 'vice', 'president', 'chief', 'founding',
  'remote', 'hybrid', 'onsite', 'contract', 'full', 'time', 'part', 'anywhere',
  'team', 'group', 'role', 'position', 'opening', 'hiring', 'the', 'and', 'for',
]);

/** Short tokens are initialisms — "ux", "ui" — which are the search itself. */
const MIN_WORD = 4;

const wordsIn = (title: string): string[] =>
  title.toLowerCase().split(/[^a-z0-9+#]+/).filter(Boolean);

/**
 * A word common in what you dismissed can still be common in what you kept, and
 * excluding one of those empties the board. Anything above this share of the
 * postings still on the list is treated as vocabulary rather than signal.
 */
const MAX_KEPT_SHARE = 0.25;

export function dismissalSuggestions(
  state: JobState,
  jobs: Job[],
  prefs: Prefs,
): Suggestion[] {
  // Only postings still on a board can be judged: a dismissal whose req has
  // closed still counts in the tally above, but there is nothing left to read a
  // level or a salary band off. Everything below is over the join.
  const byReason = new Map<DismissReason, Job[]>();
  const kept: Job[] = [];

  for (const job of jobs) {
    const entry = state[job.id];
    if (!entry?.hidden) {
      if (!entry?.applied) kept.push(job);
      continue;
    }
    if (!entry.dismissReason) continue;
    const bucket = byReason.get(entry.dismissReason);
    if (bucket) bucket.push(job);
    else byReason.set(entry.dismissReason, [job]);
  }

  const out: Suggestion[] = [];
  const enough = (group: Job[] | undefined): group is Job[] =>
    group != null && group.length >= MIN_EVIDENCE;

  /* ---- wrong kind of work → an exclude term ---- */

  const wrongRole = byReason.get('role');
  if (enough(wrongRole)) {
    // Never propose excluding a word the search is built on — that reads as a
    // sensible narrowing and empties the list.
    const searched = new Set(prefs.jobTypes.flatMap(wordsIn));
    const already = new Set(prefs.exclude);

    const counts = new Map<string, number>();
    for (const job of wrongRole) {
      // Per posting, not per occurrence: a title saying "design" twice is one
      // posting's worth of evidence.
      for (const word of new Set(wordsIn(job.title))) {
        if (word.length < MIN_WORD) continue;
        if (IGNORE_WORDS.has(word) || searched.has(word) || already.has(word)) continue;
        counts.set(word, (counts.get(word) ?? 0) + 1);
      }
    }

    let best: [string, number] | null = null;
    for (const candidate of counts) {
      if (candidate[1] < MIN_EVIDENCE) continue;
      if (candidate[1] / wrongRole.length < MIN_SHARE) continue;
      if (!best || candidate[1] > best[1]) best = candidate;
    }

    if (best) {
      const [word, hits] = best;
      const keptHits = kept.filter((job) => job.title.toLowerCase().includes(word)).length;
      if (kept.length === 0 || keptHits / kept.length <= MAX_KEPT_SHARE) {
        out.push({
          key: `role:${word}`,
          label: `Exclude “${word}”`,
          because:
            `${hits} of the ${wrongRole.length} you marked wrong-role have “${word}” in the ` +
            `title${keptHits > 0 ? `, against ${keptHits} elsewhere in the index` : ''}.`,
          patch: { exclude: [...prefs.exclude, word] },
        });
      }
    }
  }

  /* ---- wrong seniority → drop that level ---- */

  const wrongLevel = byReason.get('level');
  if (enough(wrongLevel)) {
    const counts = new Map<Job['level'], number>();
    for (const job of wrongLevel) counts.set(job.level, (counts.get(job.level) ?? 0) + 1);

    let worst: [Job['level'], number] | null = null;
    for (const candidate of counts) {
      if (candidate[1] < MIN_EVIDENCE) continue;
      if (candidate[1] / wrongLevel.length < MIN_SHARE) continue;
      if (!worst || candidate[1] > worst[1]) worst = candidate;
    }

    if (worst) {
      // Pulled out of the tuple before any closure reads them: `worst` is a
      // `let`, and TypeScript drops the null narrowing inside a callback.
      const [level, hits] = worst;
      // An empty `levels` means every level, so the patch has to name the five
      // that stay rather than the one that goes.
      const showing = prefs.levels.length > 0 ? prefs.levels : LEVEL_ORDER;
      const next = showing.filter((keep) => keep !== level);
      // Already off, or it would leave the filter selecting nothing.
      if (next.length > 0 && next.length < showing.length) {
        out.push({
          key: `level:${level}`,
          label: `Hide ${LEVEL_LABELS[level]} roles`,
          because:
            `${hits} of the ${wrongLevel.length} you marked wrong-seniority are ` +
            `${LEVEL_LABELS[level]}.`,
          // Stored in LEVEL_ORDER, never selection order — same rule the panel
          // follows, so a suggested set and a clicked one compare equal.
          patch: { levels: LEVEL_ORDER.filter((keep) => next.includes(keep)) },
        });
      }
    }
  }

  /* ---- pay → the unlisted switch, or the next rung up ---- */

  const wrongPay = byReason.get('pay');
  if (enough(wrongPay)) {
    const floors = wrongPay.map((job) => salaryFloor(job.salary));
    const unlisted = floors.filter((floor) => floor == null).length;
    const listed = floors.filter((floor): floor is number => floor != null);

    // Two ways for pay to be wrong, and they are opposite moves — so each has
    // to clear the bar on its own postings rather than on the pile's size.
    if (
      unlisted >= MIN_EVIDENCE
      && unlisted / wrongPay.length >= MIN_SHARE
      && prefs.includeUnlistedSalary
    ) {
      out.push({
        key: 'pay:unlisted',
        label: 'Drop unlisted pay',
        because:
          `${unlisted} of the ${wrongPay.length} you dismissed over pay published no band ` +
          'at all.',
        patch: { includeUnlistedSalary: false },
      });
    } else if (listed.length >= MIN_EVIDENCE) {
      // The lowest rung that would have caught every one of them, so the
      // proposal is a floor the dropdown can actually show — see `SALARY_STEPS`.
      const highest = Math.max(...listed);
      const rung = SALARY_STEPS.find(
        ([value]) => value != null && value > highest && value > (prefs.salaryFloor ?? 0),
      );
      if (rung) {
        out.push({
          key: `pay:${rung[0]}`,
          label: `Pay from ${rung[1]}`,
          because:
            `the ${listed.length} you dismissed over pay that published a band topped out ` +
            `at $${Math.round(highest / 1000)}k.`,
          patch: { salaryFloor: rung[0] },
        });
      }
    }
  }

  /* ---- stale → an age limit, only if there isn't one ---- */

  const stale = byReason.get('stale');
  if (enough(stale) && prefs.maxAgeDays == null) {
    out.push({
      key: 'stale:30',
      label: 'Only the last month',
      // The loosest limit on the ladder. Tightening past that is a judgement
      // about your own search that a count of dismissals cannot make for you.
      because: `${stale.length} of these were dismissed as stale or closed.`,
      patch: { maxAgeDays: 30 },
    });
  }

  return out;
}
