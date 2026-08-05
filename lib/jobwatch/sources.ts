/**
 * The ATS adapters.
 *
 * Every endpoint here is public and unauthenticated, because they exist to be
 * embedded in company careers pages. Greenhouse, Lever, Ashby, SmartRecruiters
 * and Breezy also send `access-control-allow-origin: *` (verified against live
 * boards), so those five can run straight from the browser — no proxy route, no
 * key, nothing server-side to keep in sync.
 *
 * Workday and Rippling do not send that header, so they are reachable only from
 * the sweep. That costs nothing today — the sweep is already the only caller —
 * but it is why `fetchCompany` must not be assumed browser-safe for every
 * source the way it once was.
 */

import {
  buildSalary,
  inferLevel,
  inferRemote,
  parseSalaryFromText,
} from './classify';
import { decodeEntities, stripTags } from './html';
import type { Company, Job, Salary, SourceKind } from './types';

export const SOURCE_LABELS: Record<SourceKind, string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
  smartrecruiters: 'SmartRecruiters',
  workday: 'Workday',
  breezy: 'Breezy',
  rippling: 'Rippling',
};

/** Stable order for anything that lists the platforms — pickers, legends. */
export const SOURCE_ORDER: SourceKind[] = [
  'greenhouse',
  'lever',
  'ashby',
  'smartrecruiters',
  'workday',
  'breezy',
  'rippling',
];

/** The `gh:`/`lv:`/`ab:` prefixes that keep ids from colliding across sources. */
const ID_PREFIX: Record<SourceKind, string> = {
  greenhouse: 'gh',
  lever: 'lv',
  ashby: 'ab',
  smartrecruiters: 'sr',
  workday: 'wd',
  breezy: 'bz',
  rippling: 'rp',
};

/** Two-letter chip shown on every card and every watchlist row. */
export const SOURCE_CODES: Record<SourceKind, string> = {
  greenhouse: 'GH',
  lever: 'LV',
  ashby: 'AB',
  smartrecruiters: 'SR',
  workday: 'WD',
  breezy: 'BZ',
  rippling: 'RP',
};

/**
 * Platform marks, for the one place that names the sources rather than coding
 * them — the header. Checked into `public/` rather than hotlinked: files that
 * change about never, against a request to someone else's CDN on every load of
 * the page.
 *
 * Each is the platform's own app icon, so each arrives with its own background
 * fill. That is why they need no plate behind them on the dark band, and why
 * they are sized in the stylesheet rather than trimmed to a glyph.
 *
 * Workday is the one that needed work: it publishes no PNG at all, only a
 * 32×32 BMP-encoded `.ico` whose mark sits on transparency. Converted, and then
 * composited onto white so it holds to the same rule as the rest — a bare glyph
 * would have floated on the dark band while every icon beside it sat on a plate.
 */
export const SOURCE_MARKS: Record<SourceKind, string> = {
  greenhouse: '/images/jobwatch/greenhouse.png',
  lever: '/images/jobwatch/lever.png',
  ashby: '/images/jobwatch/ashby.png',
  smartrecruiters: '/images/jobwatch/smartrecruiters.png',
  workday: '/images/jobwatch/workday.png',
  breezy: '/images/jobwatch/breezy.png',
  rippling: '/images/jobwatch/rippling.png',
};

/**
 * Workday identifies a board by three parts, not one: the tenant, the career
 * site under it, and the data centre the tenant lives in. They are packed into
 * one token as `tenant|site|wd5` so `BoardRef` stays a flat pair.
 */
export function parseWorkdayToken(token: string): { tenant: string; site: string; dc: string } | null {
  const [tenant, site, dc] = token.split('|');
  if (!tenant || !site || !/^wd\d+$/.test(dc ?? '')) return null;
  return { tenant, site, dc };
}

/**
 * The GET-and-parse endpoint for a board.
 *
 * Workday is absent by design — it answers a POST with a paged body, so it has
 * no single URL that returns its postings and is handled in `fetchWorkday`.
 */
export function endpointFor(source: SourceKind, token: string): string {
  const t = encodeURIComponent(token);
  switch (source) {
    case 'greenhouse':
      // Deliberately not `content=true`. Descriptions inflate this endpoint
      // 9–14× — measured: databricks 0.66MB bare vs 9.06MB with content — and
      // across a watchlist this size that is hundreds of megabytes a sync.
      // Descriptions come from `fetchDescription` when a posting is opened.
      return `https://boards-api.greenhouse.io/v1/boards/${t}/jobs`;
    case 'lever':
      return `https://api.lever.co/v0/postings/${t}?mode=json`;
    case 'ashby':
      return `https://api.ashbyhq.com/posting-api/job-board/${t}?includeCompensation=true`;
    case 'smartrecruiters':
      // 100 is the documented ceiling for this endpoint. Unlike Greenhouse the
      // list payload carries structured location and compensation already, so
      // there is nothing to opt out of and nothing to fetch again later.
      return `https://api.smartrecruiters.com/v1/companies/${t}/postings?limit=100`;
    case 'breezy':
      return `https://${t}.breezy.hr/json`;
    case 'rippling':
      return `https://api.rippling.com/platform/api/ats/v1/board/${t}/jobs`;
    case 'workday':
      throw new Error('Workday has no GET endpoint — use fetchCompany');
  }
}

export function companyKey(source: SourceKind, token: string): string {
  return `${source}:${token.trim().toLowerCase()}`;
}

function jobId(source: SourceKind, raw: unknown): string {
  return `${ID_PREFIX[source]}:${String(raw)}`;
}

/** Titles arrive padded on some boards — 13 of 123 on one sampled Ashby board. */
function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toIso(value: unknown): string | null {
  if (value == null) return null;
  // Lever sends epoch milliseconds as a number; the other two send ISO strings.
  const d = typeof value === 'number' ? new Date(value) : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/* ------------------------------------------------------------- greenhouse */

type GreenhouseJob = {
  id: number | string;
  title?: string;
  location?: { name?: string } | null;
  absolute_url?: string;
  updated_at?: string;
  first_published?: string;
  content?: string;
  company_name?: string;
  departments?: Array<{ name?: string }>;
};

function normalizeGreenhouse(payload: unknown, company: Company): Job[] {
  const jobs = (payload as { jobs?: GreenhouseJob[] })?.jobs;
  if (!Array.isArray(jobs)) throw new Error('Unexpected Greenhouse payload: no `jobs` array');

  return jobs.map((j) => {
    // `content` is entity-escaped on this endpoint — it is not markup until decoded.
    const descriptionHtml = decodeEntities(clean(j.content));
    const location = clean(j.location?.name) || 'Not specified';

    return {
      id: jobId('greenhouse', j.id),
      company: clean(j.company_name) || company.label,
      title: clean(j.title),
      level: inferLevel(clean(j.title)),
      location,
      url: clean(j.absolute_url),
      publishedAt: toIso(j.first_published ?? j.updated_at),
      // No compensation field exists here, so the description is the only place
      // a number could be. Flagged `estimated` wherever one turns up.
      salary: parseSalaryFromText(stripTags(descriptionHtml)),
      descriptionHtml,
      source: 'greenhouse',
      companyKey: company.key,
      remote: inferRemote(location),
      team: clean(j.departments?.[0]?.name) || null,
    };
  });
}

/* ------------------------------------------------------------------ lever */

type LeverJob = {
  id: string;
  text?: string;
  categories?: {
    location?: string;
    commitment?: string;
    team?: string;
    department?: string;
    allLocations?: string[];
  } | null;
  hostedUrl?: string;
  applyUrl?: string;
  createdAt?: number;
  description?: string;
  descriptionPlain?: string;
  additional?: string;
  lists?: Array<{ text?: string; content?: string }>;
  salaryRange?: { min?: number; max?: number; currency?: string; interval?: string } | null;
  salaryDescriptionPlain?: string;
  workplaceType?: string;
};

function normalizeLever(payload: unknown, company: Company): Job[] {
  if (!Array.isArray(payload)) throw new Error('Unexpected Lever payload: expected an array');

  return (payload as LeverJob[]).map((j) => {
    // Lever splits a posting across description + named lists + additional.
    // Stitched back together so the detail panel shows the whole thing.
    const lists = (j.lists ?? [])
      .map((l) => `<h3>${clean(l.text)}</h3><ul>${l.content ?? ''}</ul>`)
      .join('');
    const descriptionHtml = [j.description ?? '', lists, j.additional ?? ''].join('');

    const title = clean(j.text);
    const location = clean(j.categories?.location) || 'Not specified';

    const range = j.salaryRange;
    const salary =
      range && (range.min != null || range.max != null)
        ? buildSalary(
            range.min ?? null,
            range.max ?? null,
            range.currency ?? 'USD',
            range.interval ?? 'year',
          )
        : parseSalaryFromText(clean(j.salaryDescriptionPlain) || stripTags(descriptionHtml));

    return {
      id: jobId('lever', j.id),
      company: company.label,
      title,
      level: inferLevel(title),
      location,
      url: clean(j.hostedUrl) || clean(j.applyUrl),
      publishedAt: toIso(j.createdAt),
      salary,
      descriptionHtml,
      source: 'lever',
      companyKey: company.key,
      remote: inferRemote(
        [location, ...(j.categories?.allLocations ?? [])].join(' '),
        j.workplaceType,
      ),
      team: clean(j.categories?.team) || clean(j.categories?.department) || null,
    };
  });
}

/* ------------------------------------------------------------------ ashby */

type AshbyComponent = {
  compensationType?: string;
  interval?: string;
  minValue?: number | null;
  maxValue?: number | null;
  currencyCode?: string | null;
};

type AshbyJob = {
  id: string;
  title?: string;
  location?: string;
  jobUrl?: string;
  applyUrl?: string;
  isListed?: boolean;
  publishedAt?: string;
  descriptionHtml?: string;
  workplaceType?: string;
  department?: string;
  team?: string;
  compensation?: {
    compensationTierSummary?: string;
    scrapeableCompensationSalarySummary?: string;
    compensationTiers?: Array<{ components?: AshbyComponent[] }>;
  } | null;
};

/**
 * Prefers the structured `Salary` component over the display string, so the
 * min-salary filter compares real numbers. Equity, bonus, and commission
 * components are deliberately ignored — only base band is comparable.
 */
function ashbySalary(job: AshbyJob) {
  const comp = job.compensation;
  if (!comp) return null;

  const summary = clean(comp.compensationTierSummary) || clean(comp.scrapeableCompensationSalarySummary);

  for (const tier of comp.compensationTiers ?? []) {
    for (const c of tier.components ?? []) {
      if (c.compensationType !== 'Salary') continue;
      if (c.minValue == null && c.maxValue == null) continue;
      return buildSalary(
        c.minValue ?? null,
        c.maxValue ?? null,
        c.currencyCode ?? 'USD',
        c.interval ?? '1 YEAR',
        summary || undefined,
      );
    }
  }

  return summary ? parseSalaryFromText(summary) : null;
}

function normalizeAshby(payload: unknown, company: Company): Job[] {
  const jobs = (payload as { jobs?: AshbyJob[] })?.jobs;
  if (!Array.isArray(jobs)) throw new Error('Unexpected Ashby payload: no `jobs` array');

  return jobs
    .filter((j) => j.isListed !== false)
    .map((j) => {
      const title = clean(j.title);
      const location = clean(j.location) || 'Not specified';

      return {
        id: jobId('ashby', j.id),
        company: company.label,
        title,
        level: inferLevel(title),
        location,
        url: clean(j.jobUrl) || clean(j.applyUrl),
        publishedAt: toIso(j.publishedAt),
        salary: ashbySalary(j),
        descriptionHtml: j.descriptionHtml ?? '',
        source: 'ashby',
        companyKey: company.key,
        remote: inferRemote(location, j.workplaceType),
        team: clean(j.department) || clean(j.team) || null,
      };
    });
}

/* -------------------------------------------------------- smartrecruiters */

type SmartRecruitersJob = {
  id: string;
  name?: string;
  releasedDate?: string;
  company?: { identifier?: string; name?: string } | null;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    remote?: boolean;
    hybrid?: boolean;
    fullLocation?: string;
  } | null;
  department?: { label?: string } | null;
  function?: { label?: string } | null;
};

/**
 * The richest of the list payloads: structured city/region/country plus real
 * `remote` and `hybrid` booleans, so neither the remote test nor the US test
 * has to read them back out of a display string the way Greenhouse forces.
 *
 * `fullLocation` is preferred for display because it already reads the way the
 * other sources' location strings do ("Austin, TX, United States"); the parts
 * are only assembled by hand when it is missing.
 */
function normalizeSmartRecruiters(payload: unknown, company: Company): Job[] {
  const jobs = (payload as { content?: SmartRecruitersJob[] })?.content;
  if (!Array.isArray(jobs)) throw new Error('Unexpected SmartRecruiters payload: no `content` array');

  return jobs.map((j) => {
    const loc = j.location;
    const parts = [clean(loc?.city), clean(loc?.region), clean(loc?.country).toUpperCase()];
    const location = clean(loc?.fullLocation) || parts.filter(Boolean).join(', ') || 'Not specified';

    const title = clean(j.name);
    // The identifier is what the public posting URL is keyed on, and it is not
    // always the token we probed with — a board can be reached by an alias.
    const identifier = clean(j.company?.identifier) || company.token;

    return {
      id: jobId('smartrecruiters', j.id),
      company: clean(j.company?.name) || company.label,
      title,
      level: inferLevel(title),
      location,
      url: `https://jobs.smartrecruiters.com/${encodeURIComponent(identifier)}/${encodeURIComponent(j.id)}`,
      publishedAt: toIso(j.releasedDate),
      // No compensation on this endpoint, and no prose to scrape it out of
      // either — the job ad body is a separate request. See `fetchDescription`.
      salary: null,
      descriptionHtml: '',
      source: 'smartrecruiters',
      companyKey: company.key,
      remote: inferRemote(location, loc?.remote ? 'remote' : loc?.hybrid ? 'hybrid' : null),
      team: clean(j.department?.label) || clean(j.function?.label) || null,
    };
  });
}

/* ---------------------------------------------------------------- workday */

type WorkdayJob = {
  title?: string;
  externalPath?: string;
  locationsText?: string;
  postedOn?: string;
  bulletFields?: string[];
};

/**
 * Workday reports age as English, not a date — "Posted Today", "Posted 5 Days
 * Ago", "Posted 30+ Days Ago". There is no real timestamp anywhere in the
 * payload, so this reconstructs one.
 *
 * "30+" deliberately returns null rather than a date 30 days back: it is an
 * open-ended bucket that also holds year-old reqs, and inventing a boundary
 * date would let the age filter treat them as fresher than they are. A null
 * sends the posting down the `firstSeen` path instead, which is honest — we
 * know when *we* first saw it and nothing more.
 */
function workdayPostedAt(posted: string | undefined, now: number): string | null {
  const text = clean(posted).toLowerCase();
  if (!text) return null;
  if (text.includes('today')) return new Date(now).toISOString();
  if (text.includes('yesterday')) return new Date(now - 86_400_000).toISOString();
  if (text.includes('+')) return null;

  const days = text.match(/(\d+)\s*day/);
  if (days) return new Date(now - Number(days[1]) * 86_400_000).toISOString();
  const months = text.match(/(\d+)\s*month/);
  if (months) return new Date(now - Number(months[1]) * 30 * 86_400_000).toISOString();
  return null;
}

function normalizeWorkday(payload: unknown, company: Company): Job[] {
  const parsed = parseWorkdayToken(company.token);
  if (!parsed) throw new Error(`Malformed Workday token "${company.token}"`);
  const { tenant, site, dc } = parsed;

  const jobs = (payload as { jobPostings?: WorkdayJob[] })?.jobPostings;
  if (!Array.isArray(jobs)) throw new Error('Unexpected Workday payload: no `jobPostings` array');

  const now = Date.now();

  return jobs.map((j) => {
    const title = clean(j.title);
    const path = clean(j.externalPath);
    const location = clean(j.locationsText) || 'Not specified';
    // `externalPath` is unique per req and already carries the requisition id;
    // `bulletFields` usually repeats it but is not guaranteed to be populated.
    const ref = clean(j.bulletFields?.[0]) || path;

    return {
      id: jobId('workday', `${tenant}:${ref}`),
      company: company.label,
      title,
      level: inferLevel(title),
      location,
      url: `https://${tenant}.${dc}.myworkdayjobs.com/${site}${path}`,
      publishedAt: workdayPostedAt(j.postedOn, now),
      // Neither compensation nor description is in the list payload.
      salary: null,
      descriptionHtml: '',
      source: 'workday',
      companyKey: company.key,
      remote: inferRemote(location),
      team: null,
    };
  });
}

/* ----------------------------------------------------------------- breezy */

type BreezyJob = {
  id: string;
  name?: string;
  url?: string;
  published_date?: string;
  location?: {
    country?: { name?: string; id?: string } | null;
    state?: { id?: string; name?: string } | null;
    city?: string;
    is_remote?: boolean;
    name?: string;
  } | null;
  department?: string;
  salary?: string;
  company?: { name?: string } | null;
};

function normalizeBreezy(payload: unknown, company: Company): Job[] {
  if (!Array.isArray(payload)) throw new Error('Unexpected Breezy payload: expected an array');

  return (payload as BreezyJob[]).map((j) => {
    const loc = j.location;
    // `location.name` is already "City, ST"; the country is appended because the
    // US test needs it and Breezy is the one source that reports it separately.
    const country = clean(loc?.country?.name);
    const base = clean(loc?.name) || [clean(loc?.city), clean(loc?.state?.id)].filter(Boolean).join(', ');
    const location = [base, country].filter(Boolean).join(', ') || 'Not specified';

    const title = clean(j.name);

    return {
      id: jobId('breezy', j.id),
      company: clean(j.company?.name) || company.label,
      title,
      level: inferLevel(title),
      location,
      url: clean(j.url),
      publishedAt: toIso(j.published_date),
      // A display string only ("$0.05 – $0.06 / hour"), so it goes through the
      // prose parser and lands flagged `estimated` like any other scraped band.
      salary: parseSalaryFromText(clean(j.salary)),
      descriptionHtml: '',
      source: 'breezy',
      companyKey: company.key,
      remote: inferRemote(location, loc?.is_remote ? 'remote' : null),
      team: clean(j.department) || null,
    };
  });
}

/* --------------------------------------------------------------- rippling */

type RipplingJob = {
  uuid: string;
  name?: string;
  department?: { label?: string } | null;
  url?: string;
  workLocation?: { label?: string } | null;
};

/**
 * Rippling emits one row per posting *per location*, repeating the uuid — a
 * board of 400 reqs came back as several thousand rows. Collapsing them here
 * rather than downstream keeps the duplicate out of the index entirely, and
 * the joined locations are what the remote and US tests want to read anyway.
 */
function normalizeRippling(payload: unknown, company: Company): Job[] {
  if (!Array.isArray(payload)) throw new Error('Unexpected Rippling payload: expected an array');

  const byId = new Map<string, { job: RipplingJob; locations: string[] }>();
  for (const j of payload as RipplingJob[]) {
    if (!j?.uuid) continue;
    const label = clean(j.workLocation?.label);
    const seen = byId.get(j.uuid);
    if (seen) {
      if (label && !seen.locations.includes(label)) seen.locations.push(label);
    } else {
      byId.set(j.uuid, { job: j, locations: label ? [label] : [] });
    }
  }

  return [...byId.values()].map(({ job, locations }) => {
    const title = clean(job.name);
    const location = locations.join(' · ') || 'Not specified';

    return {
      id: jobId('rippling', job.uuid),
      company: company.label,
      title,
      level: inferLevel(title),
      location,
      url: clean(job.url),
      // Nothing dated in this payload at all — `firstSeen` is the only age
      // signal a Rippling posting ever gets.
      publishedAt: null,
      salary: null,
      descriptionHtml: '',
      source: 'rippling',
      companyKey: company.key,
      remote: inferRemote(location),
      team: clean(job.department?.label) || null,
    };
  });
}

/* ----------------------------------------------------------------- fetch */

const NORMALIZERS: Record<SourceKind, (payload: unknown, company: Company) => Job[]> = {
  greenhouse: normalizeGreenhouse,
  lever: normalizeLever,
  ashby: normalizeAshby,
  smartrecruiters: normalizeSmartRecruiters,
  workday: normalizeWorkday,
  breezy: normalizeBreezy,
  rippling: normalizeRippling,
};

/** Workday's own ceiling on one page of results. Asking for more is ignored. */
const WORKDAY_PAGE = 20;

/**
 * How many pages of one Workday board to walk.
 *
 * Workday is the only paginated source, and the only one where a single board
 * can cost 20 requests instead of one. A large enterprise tenant runs to
 * thousands of reqs, and spending the shard's whole budget walking one of them
 * would starve every board behind it.
 *
 * 10 pages — 200 postings — is the compromise. Boards bigger than that are
 * truncated, which is a real gap: the postings we never see are the ones
 * Workday chose to order last. The fix is to push the title test into the
 * request via `searchText` rather than to raise this, since that turns the
 * whole board into one page of matches instead of ten pages of everything.
 */
const WORKDAY_MAX_PAGES = 10;

/**
 * Walks a Workday board.
 *
 * Unlike every other source this is a POST with a JSON body, and it answers
 * `total` alongside the page, so the walk stops as soon as the offset passes it
 * rather than probing for an empty page.
 */
async function fetchWorkday(company: Company, signal?: AbortSignal): Promise<Job[]> {
  const parsed = parseWorkdayToken(company.token);
  if (!parsed) throw new Error(`Malformed Workday token "${company.token}"`);
  const { tenant, site, dc } = parsed;

  const url = `https://${tenant}.${dc}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/jobs`;
  const jobs: Job[] = [];

  // Workday reports `total` on the first page and sends a literal 0 on every
  // page after it. Read naively that says "no results" one page in, which
  // silently truncated a 397-posting board to 40. The first answer is the only
  // one that means anything, so it is the one that's kept.
  let total = 0;

  for (let page = 0; page < WORKDAY_MAX_PAGES; page += 1) {
    const offset = page * WORKDAY_PAGE;

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        signal,
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ appliedFacets: {}, limit: WORKDAY_PAGE, offset, searchText: '' }),
      });
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') throw err;
      throw new Error('Network request failed — offline, blocked, or board unreachable');
    }

    if (res.status === 404) throw new Error(`No Workday board found for "${company.token}"`);
    if (!res.ok) throw new Error(`Workday returned ${res.status}`);

    const payload = (await res.json()) as { total?: number; jobPostings?: unknown[] };
    jobs.push(...normalizeWorkday(payload, company));
    if (page === 0) total = payload.total ?? 0;

    // A short page is the reliable end-of-board signal; `total` only shortens
    // the walk when the board is small enough to finish early.
    const got = payload.jobPostings?.length ?? 0;
    if (got < WORKDAY_PAGE) break;
    if (total > 0 && offset + WORKDAY_PAGE >= total) break;
  }

  return jobs;
}

/**
 * Fetches one board and normalizes it. Throws with a readable message — the UI
 * shows per-company failures rather than silently dropping a board, since a
 * quietly missing company looks identical to a company with no openings.
 */
export async function fetchCompany(company: Company, signal?: AbortSignal): Promise<Job[]> {
  if (company.source === 'workday') {
    const jobs = await fetchWorkday(company, signal);
    return jobs.filter((j) => j.title && j.url);
  }

  const url = endpointFor(company.source, company.token);

  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { accept: 'application/json' } });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new Error('Network request failed — offline, blocked, or board unreachable');
  }

  if (res.status === 404) {
    throw new Error(`No ${SOURCE_LABELS[company.source]} board found for "${company.token}"`);
  }
  if (!res.ok) {
    throw new Error(`${SOURCE_LABELS[company.source]} returned ${res.status}`);
  }

  const payload = await res.json();
  const jobs = NORMALIZERS[company.source](payload, company);
  return jobs.filter((j) => j.title && j.url);
}

type Described = { descriptionHtml: string; salary: Salary | null };

/**
 * Sources with a per-posting detail route — the ones `fetchDescription` can
 * actually go and get something for. Everything else either shipped the prose
 * with the listing or never publishes it at all, and the UI needs to tell those
 * two apart from a failed request.
 */
const DESCRIBABLE: ReadonlySet<SourceKind> = new Set<SourceKind>([
  'greenhouse',
  'smartrecruiters',
  'workday',
]);

export function hasDescriptionEndpoint(source: SourceKind): boolean {
  return DESCRIBABLE.has(source);
}

async function getJson(url: string, label: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal, headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`${label} returned ${res.status}`);
  return res.json();
}

async function greenhouseDescription(job: Job, signal?: AbortSignal): Promise<Described> {
  const token = job.companyKey.slice(job.companyKey.indexOf(':') + 1);
  const rawId = job.id.slice(job.id.indexOf(':') + 1);
  const payload = await getJson(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs/${encodeURIComponent(rawId)}`,
    'Greenhouse',
    signal,
  );

  // Same entity-escaped `content` as the list endpoint — not markup until decoded.
  const descriptionHtml = decodeEntities(clean((payload as { content?: string }).content));
  return {
    descriptionHtml,
    salary: job.salary ?? parseSalaryFromText(stripTags(descriptionHtml)),
  };
}

type SmartRecruitersSection = { title?: string; text?: string };

/**
 * The identifier is read back off the posting URL rather than out of
 * `companyKey`, because the key is lowercased for identity and SmartRecruiters
 * treats the identifier as case-sensitive in the path. The URL was built from
 * the payload's own `identifier`, so it has the casing the API expects.
 */
async function smartRecruitersDescription(job: Job, signal?: AbortSignal): Promise<Described> {
  const match = job.url.match(/jobs\.smartrecruiters\.com\/([^/]+)\/([^/?#]+)/);
  if (!match) return { descriptionHtml: job.descriptionHtml, salary: job.salary };
  const [, identifier, postingId] = match;

  const payload = await getJson(
    `https://api.smartrecruiters.com/v1/companies/${identifier}/postings/${postingId}`,
    'SmartRecruiters',
    signal,
  );

  // Four named sections, rendered in the order the posting itself uses them.
  const sections = (payload as { jobAd?: { sections?: Record<string, SmartRecruitersSection> } })
    ?.jobAd?.sections ?? {};
  const order = ['companyDescription', 'jobDescription', 'qualifications', 'additionalInformation'];
  const descriptionHtml = order
    .map((key) => sections[key])
    .filter((s): s is SmartRecruitersSection => Boolean(clean(s?.text)))
    .map((s) => `<h3>${clean(s.title)}</h3>${s.text}`)
    .join('');

  return {
    descriptionHtml,
    salary: job.salary ?? parseSalaryFromText(stripTags(descriptionHtml)),
  };
}

/**
 * Workday's detail endpoint is the same CXS path as the board with the
 * posting's own `externalPath` appended — so it is reachable by splicing
 * `/wday/cxs/{tenant}/{site}` into the public URL the list already produced.
 *
 * Worth the request for more than the prose: `startDate` is a real date, and
 * the list payload only ever offered "Posted Today". Opening a posting is
 * therefore what upgrades its age from an estimate to a fact.
 */
async function workdayDescription(job: Job, signal?: AbortSignal): Promise<Described> {
  const token = job.companyKey.slice(job.companyKey.indexOf(':') + 1);
  const parsed = parseWorkdayToken(token);
  if (!parsed) return { descriptionHtml: job.descriptionHtml, salary: job.salary };
  const { tenant, site, dc } = parsed;

  const origin = `https://${tenant}.${dc}.myworkdayjobs.com`;
  const externalPath = job.url.startsWith(`${origin}/${site}`)
    ? job.url.slice(`${origin}/${site}`.length)
    : '';
  if (!externalPath) return { descriptionHtml: job.descriptionHtml, salary: job.salary };

  const payload = await getJson(
    `${origin}/wday/cxs/${tenant}/${site}${externalPath}`,
    'Workday',
    signal,
  );

  const info = (payload as { jobPostingInfo?: { jobDescription?: string } })?.jobPostingInfo;
  const descriptionHtml = clean(info?.jobDescription);
  return {
    descriptionHtml,
    salary: job.salary ?? parseSalaryFromText(stripTags(descriptionHtml)),
  };
}

/**
 * Fetches one posting's description, on demand.
 *
 * Lever, Ashby and Breezy ship what they have in the list payload, so there is
 * nothing to fetch for those. The rest publish a bare list and keep the prose
 * behind a second request — which is also the only place a salary could be for
 * Greenhouse, SmartRecruiters and Workday, none of which expose a compensation
 * field. Worth knowing that's rare: 6 of 44 Greenhouse design roles across
 * seven sampled boards published a parseable band, and all six were one company.
 *
 * Rippling is deliberately absent. Its board endpoint answers with a list and
 * no per-posting detail route, so the link is the whole of what we can offer.
 */
export async function fetchDescription(
  job: Job,
  signal?: AbortSignal,
): Promise<Described> {
  switch (job.source) {
    case 'greenhouse':
      return greenhouseDescription(job, signal);
    case 'smartrecruiters':
      return smartRecruitersDescription(job, signal);
    case 'workday':
      return workdayDescription(job, signal);
    default:
      return { descriptionHtml: job.descriptionHtml, salary: job.salary };
  }
}
