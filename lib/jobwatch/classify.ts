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

const DESIGN_HIT = new RegExp(
  [
    'product\\s+design', 'design\\s+system', 'interaction\\s+design',
    'visual\\s+design', 'brand\\s+design', 'content\\s+design', 'service\\s+design',
    'experience\\s+design', 'design\\s+lead', 'design\\s+manager', 'design\\s+director',
    'head\\s+of\\s+design', 'designer', '\\bux\\b', '\\bui\\b', 'user\\s+experience',
    'user\\s+research', 'ux\\s+writ', 'design\\s+technologist', 'creative\\s+director',
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

export function isDesignRole(title: string): boolean {
  return DESIGN_HIT.test(title) && !DESIGN_MISS.test(title);
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
