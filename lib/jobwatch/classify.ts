/**
 * Everything the ATS APIs don't tell you: seniority, whether a role is
 * actually remote, whether it's design at all, and what it pays.
 */

import type { Level, Salary } from './types';

/* ------------------------------------------------------------------ level */

/**
 * Ordered most-senior first — "Senior Staff Designer" has to land on staff,
 * not senior, so the first match wins rather than the last.
 */
const LEVEL_TESTS: Array<[Level, RegExp]> = [
  ['exec',      /\b(vp|svp|evp|vice\s+president|chief|head\s+of|director)\b/i],
  ['principal', /\b(principal|distinguished|fellow)\b/i],
  ['staff',     /\bstaff\b/i],
  ['lead',      /\b(lead|manager|mgr)\b/i],
  ['senior',    /\b(senior|sr\.?)\b/i],
];

export function inferLevel(title: string): Level {
  for (const [level, test] of LEVEL_TESTS) {
    if (test.test(title)) return level;
  }
  return 'mid';
}

export const LEVEL_LABELS: Record<Level, string> = {
  exec: 'Director+',
  principal: 'Principal',
  staff: 'Staff',
  lead: 'Lead',
  senior: 'Senior',
  mid: 'Mid',
};

/** Search order, seniority descending — drives chip order in the filter bar. */
export const LEVEL_ORDER: Level[] = ['exec', 'principal', 'staff', 'lead', 'senior', 'mid'];

/* ------------------------------------------------------------ design role */

/**
 * An explicit product-design signal.
 *
 * Deliberately does not include a bare `designer`: that one token matched every
 * design discipline there is, and half the board came back graphic, brand,
 * motion and game roles. A title has to say what kind of designer it wants.
 */
const DESIGN_HIT = new RegExp(
  [
    'product\\s+design', 'design\\s+system', 'interaction\\s+design',
    'experience\\s+design', 'content\\s+design', 'service\\s+design',
    '\\bux\\b', '\\bui\\b', 'user\\s+experience', 'user\\s+research',
    'ux\\s+writ', 'design\\s+technologist',
  ].join('|'),
  'i',
);

/**
 * Design, but a different craft. Rejected only when nothing in `DESIGN_HIT`
 * also matched, so "Product Designer, Brand" survives while "Brand Designer"
 * does not.
 *
 * `creative` covers Creative Director, which is an advertising and marketing
 * role rather than a product one — it was the third most common title on the
 * board and never the search.
 */
const OTHER_DISCIPLINE = new RegExp(
  [
    'graphic', 'motion', 'brand', 'creative', 'marketing', 'packaging',
    'production\\s+design', '\\bgame\\b', '\\b3d\\b', 'illustrat', 'animat',
    'video', 'presentation', 'apparel', 'textile', 'fashion', 'jewel',
    'architect', 'environmental', 'exhibit', 'print', 'industrial',
    'structural', 'technical\\s+design', 'level\\s+design', 'combat',
    'narrative', 'quest', 'sound', 'audio', 'lighting', 'set\\s+design',
    '\\bcad\\b', 'landscape', 'civil',
  ].join('|'),
  'i',
);

/**
 * Leading a design org is this search even when the title never says "product",
 * so these are kept on their own. A bare `Senior Designer` is not: it is as
 * often graphic as product, and there is nothing in the title to tell them
 * apart — see the note on `DESIGN_HIT`.
 */
const DESIGN_LEADERSHIP = new RegExp(
  [
    'head\\s+of\\s+design', 'design\\s+director', 'director,?\\s+of?\\s*design',
    'design\\s+manager', 'design\\s+lead', 'principal\\s+designer',
    'founding\\s+designer', 'vp,?\\s+design', 'design\\s+principal',
  ].join('|'),
  'i',
);

/**
 * Titles that contain a design word but are not this search. "Design Verification
 * Engineer" and "Physical Design Engineer" are silicon jobs; sales and recruiting
 * roles pick up "designer" from phrases like "designer relations".
 */
const DESIGN_MISS = new RegExp(
  [
    'engineer', 'engineering', 'developer', '\\bswe\\b', 'scientist',
    'verification', 'silicon', 'hardware', 'mechanical', 'electrical',
    '\\basic\\b', '\\brtl\\b', 'firmware', 'chip', 'analog', 'layout\\s+design',
    'account\\s+executive', 'recruiter', 'sales', 'counsel', 'attorney',
    'accountant', 'controller', 'instructional\\s+design', 'interior\\s+design',
  ].join('|'),
  'i',
);

/**
 * Engineering titles that are this search anyway.
 *
 * `DESIGN_MISS` rejects `engineer` outright, which is right for the silicon and
 * software roles that pick up a design word by accident — but wrong for the
 * design-engineer hybrid, where the title names the craft on purpose. A live
 * "Senior Product Design Engineer" at Cortex was invisible for exactly that
 * reason, so this is checked ahead of the miss list.
 *
 * It deliberately requires the explicit signal. A bare "Design Engineer" stays
 * out: it is as often mechanical, hardware or civil as it is product, and there
 * is nothing in the title to tell them apart — the same reason `DESIGN_HIT`
 * refuses a bare "designer".
 */
const DESIGN_ENGINEER = new RegExp(
  [
    'product\\s+design\\s+engineer', 'design\\s+systems?\\s+engineer',
    '\\bux\\s+engineer', '\\bui\\s+engineer', 'user\\s+experience\\s+engineer',
  ].join('|'),
  'i',
);

/**
 * Titles the allow-list above lets through that are still not this search.
 *
 * "Manager, Software Engineering, Fullstack (Repayment UX Engineering)" reaches
 * it through `ux engineer`, and "Director of Sensor Product Design Engineering"
 * through `product design engineer` — both are engineering-org roles that name
 * a design surface, not design roles.
 */
const NOT_REALLY_DESIGN = /software\s+engineer|\bsensor\b|\bfirmware\b/i;

/**
 * Order is the whole logic here:
 *
 *   1. an engineering title that names design as the craft — in, unless it is
 *      a different craft ("Game UX Engineer")
 *   2. never a design job at all (engineering, sales) — out
 *   3. explicitly product design — in, whatever else the title also says
 *   4. a different design craft — out
 *   5. otherwise only design leadership survives; generic titles do not
 */
/* ------------------------------------------------------------- job types */

const ESCAPE = /[.*+?^${}()|[\]\\]/g;

/**
 * Compiled once per term — this runs across the whole index on every keystroke
 * in the search box, so rebuilding a regex per posting per term is the one
 * thing here that would actually be felt.
 */
const patternCache = new Map<string, RegExp>();

/**
 * Anchored at the start of a word, open at the end.
 *
 * Both halves are deliberate. Without the leading boundary, `ui` matches Build,
 * Guide and Recruiter — which is why the hardcoded list it replaces had to
 * write `\bui\b`. With a *trailing* boundary, "product design" would stop
 * matching "Product Designer", which is the single most common title on the
 * board. Prefix-of-word is what people mean when they type a job type: enter
 * "design" and you want designer, enter "engineer" and you want engineering.
 */
function termPattern(term: string): RegExp {
  let pattern = patternCache.get(term);
  if (!pattern) {
    pattern = new RegExp(`(?<!\\w)${term.replace(ESCAPE, '\\$&')}`, 'i');
    patternCache.set(term, pattern);
  }
  return pattern;
}

/**
 * Whether a title is one of the kinds of job being looked for.
 *
 * An empty list means no narrowing at all, the same way all levels off reads as
 * no level filter — the alternative, an empty board, is never what was meant.
 */
export function matchesJobType(title: string, types: string[]): boolean {
  if (types.length === 0) return true;
  return types.some((term) => termPattern(term).test(title));
}

export function isDesignRole(title: string): boolean {
  if (DESIGN_ENGINEER.test(title)) {
    return !OTHER_DISCIPLINE.test(title) && !NOT_REALLY_DESIGN.test(title);
  }
  if (DESIGN_MISS.test(title)) return false;
  if (DESIGN_HIT.test(title)) return true;
  if (OTHER_DISCIPLINE.test(title)) return false;
  return DESIGN_LEADERSHIP.test(title);
}

/* ----------------------------------------------------------------- remote */

const REMOTE_HIT = /\b(remote|anywhere|distributed|work\s+from\s+home|wfh|virtual)\b/i;

/**
 * `workplaceType` is the reliable signal where a source provides one. Ashby's
 * separate `isRemote` boolean is not usable: on a sampled board it was true for
 * 114 of 123 postings while `workplaceType` said Hybrid or OnSite, so it seems
 * to mean "remote-eligible" at best.
 */
export function inferRemote(location: string, workplaceType?: string | null): boolean {
  if (workplaceType) {
    const w = workplaceType.toLowerCase();
    if (w === 'remote') return true;
    if (w === 'onsite' || w === 'hybrid') return false;
  }
  return REMOTE_HIT.test(location);
}

/* --------------------------------------------------------------- location */

/**
 * Whether a posting can be worked from the US.
 *
 * `unconfirmed` is a real answer, not a failure: roughly a sixth of remote
 * postings give no geography whatsoever (the bare string "Remote"), and many of
 * those are US companies that simply didn't say so. Guessing either way is
 * wrong, so they are kept and marked in the UI.
 */
export type UsEligibility = 'us' | 'unconfirmed' | 'non-us';

/** Periods are stripped first, so `U.S.` and `U.S.A.` reduce to `US`/`USA`. */
const US_COUNTRY = /\b(us|usa|united\s+states|stateside)\b/i;

/**
 * Case-sensitive and anchored to a comma or bracket, because half the state
 * codes are also English words. Matching `\bor\b` case-insensitively reads
 * "Cardiff, London or Remote (UK)" as Oregon — it did, on six real postings.
 */
const US_STATE_CODE =
  /[,(]\s*(A[LKZR]|C[AOT]|DE|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY]|DC)\b/;

const US_STATE_NAME =
  /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new\s+hampshire|new\s+jersey|new\s+mexico|new\s+york|north\s+carolina|north\s+dakota|ohio|oklahoma|oregon|pennsylvania|rhode\s+island|south\s+carolina|south\s+dakota|tennessee|texas|utah|vermont|virginia|washington|west\s+virginia|wisconsin|wyoming)\b/i;

const US_CITY =
  /\b(nyc|brooklyn|san\s+francisco|bay\s+area|los\s+angeles|chicago|boston|seattle|austin|denver|atlanta|miami|phoenix|dallas|houston|philadelphia|san\s+diego|san\s+jose|palo\s+alto|mountain\s+view|sunnyvale|santa\s+monica|salt\s+lake|minneapolis|detroit|nashville|charlotte|raleigh|pittsburgh|baltimore|orlando|tampa|las\s+vegas|sacramento|columbus|indianapolis|kansas\s+city|cincinnati)\b/i;

/**
 * Words that describe an arrangement rather than a place.
 *
 * This is the whole trick: rather than blacklisting every country that isn't
 * America — a list that is never finished, and quietly let Bogota, Gibraltar and
 * Helsinki through when it was tried — a string is `unconfirmed` only when
 * *nothing* is left after these are removed. Anything with a real place name
 * still standing, and no US marker, is somewhere else.
 *
 * `north`/`america` sit here deliberately: "North America" includes the US, so
 * it is unconfirmed rather than a rejection.
 */
const NON_GEOGRAPHIC = new Set([
  'remote', 'anywhere', 'worldwide', 'world', 'wide', 'global', 'globally',
  'distributed', 'virtual', 'wfh', 'work', 'from', 'home', 'based',
  'international', 'contract', 'contractor', 'permanent', 'full', 'part',
  'time', 'all', 'location', 'locations', 'any', 'none', 'not', 'specified',
  'unspecified', 'na', 'n', 'a', 'hybrid', 'onsite', 'on', 'site', 'office',
  'hq', 'headquarters', 'north', 'america', 'americas', 'multiple', 'various',
  'several', 'flexible', 'eligible', 'only', 'or', 'and', 'the', 'in', 'at',
  'of', 'to', 'within', 'other', 'tbd', 'open', 'position', 'first',
]);

/** True when a string carries no place name at all once the above are removed. */
function isPlaceless(location: string): boolean {
  const tokens = location.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return tokens.every((token) => NON_GEOGRAPHIC.has(token));
}

/**
 * An explicit US marker wins even in a mixed string: a posting reading
 * "…Portland, OR, or Remote within Canada or United States" is one a US
 * applicant can take, whatever else it also lists.
 */
export function usEligibility(location: string): UsEligibility {
  const flat = (location ?? '').replace(/\./g, '');

  if (
    US_COUNTRY.test(flat) ||
    US_STATE_CODE.test(flat) ||
    US_STATE_NAME.test(flat) ||
    US_CITY.test(flat)
  ) {
    return 'us';
  }

  return isPlaceless(flat) ? 'unconfirmed' : 'non-us';
}

/* ----------------------------------------------------------------- salary */

/** Annualization factors for the intervals these APIs actually emit. */
const PER_YEAR: Record<string, number> = {
  year: 1, yearly: 1, annual: 1, annually: 1,
  month: 12, monthly: 12,
  week: 52, weekly: 52,
  hour: 2080, hourly: 2080,
};

function annualize(value: number, interval: string): number {
  const key = interval.toLowerCase().replace(/[^a-z]/g, '');
  for (const [name, factor] of Object.entries(PER_YEAR)) {
    if (key.includes(name)) return Math.round(value * factor);
  }
  return value;
}

const MONEY_RANGE =
  /\$\s?([\d,]+(?:\.\d+)?)\s?([kK])?\s*(?:-|–|—|to)\s*\$?\s?([\d,]+(?:\.\d+)?)\s?([kK])?/;

function toNumber(raw: string, k?: string): number {
  const n = Number.parseFloat(raw.replace(/,/g, ''));
  if (!Number.isFinite(n)) return NaN;
  return k ? n * 1000 : n;
}

/**
 * Last-resort salary: pull a range out of prose. Used for Greenhouse, whose
 * board endpoint has no compensation field at all, so the only numbers
 * available are the ones written into the description.
 */
export function parseSalaryFromText(text: string): Salary | null {
  if (!text) return null;
  const m = MONEY_RANGE.exec(text);
  if (!m) return null;

  const min = toNumber(m[1], m[2]);
  const max = toNumber(m[3], m[4]);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;

  // Guard against matching equity grants, bonuses, or hourly rates dressed up
  // as a band. Anything under 40k a year is not the number being searched on.
  if (max < 40_000) return null;
  if (min < 10_000) return null;

  return {
    min: Math.round(min),
    max: Math.round(max),
    currency: 'USD',
    text: formatRange(Math.round(min), Math.round(max), 'USD'),
    estimated: true,
  };
}

export function buildSalary(
  min: number | null,
  max: number | null,
  currency: string,
  interval: string,
  text?: string,
): Salary | null {
  const lo = min == null ? null : annualize(min, interval);
  const hi = max == null ? null : annualize(max, interval);
  if (lo == null && hi == null && !text) return null;
  return {
    min: lo,
    max: hi,
    currency: currency || 'USD',
    text: text || formatRange(lo, hi, currency || 'USD'),
    estimated: false,
  };
}

const COMPACT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatRange(min: number | null, max: number | null, currency = 'USD'): string {
  const sym = currency === 'USD' ? '$' : `${currency} `;
  if (min != null && max != null) return `${sym}${COMPACT.format(min)} – ${sym}${COMPACT.format(max)}`;
  if (min != null) return `${sym}${COMPACT.format(min)}+`;
  if (max != null) return `up to ${sym}${COMPACT.format(max)}`;
  return '';
}

/** The number a min-salary filter compares against. */
export function salaryFloor(salary: Salary | null): number | null {
  if (!salary) return null;
  return salary.min ?? salary.max ?? null;
}
