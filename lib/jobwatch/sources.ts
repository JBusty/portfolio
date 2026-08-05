/**
 * The three ATS adapters.
 *
 * All three endpoints are public, unauthenticated, and send
 * `access-control-allow-origin: *` (verified against live boards), because they
 * exist to be embedded in company careers pages. So these run straight from the
 * browser — no proxy route, no key, nothing server-side to keep in sync.
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
};

/** Stable order for anything that lists the platforms — pickers, legends. */
export const SOURCE_ORDER: SourceKind[] = ['greenhouse', 'lever', 'ashby'];

/** The `gh:`/`lv:`/`ab:` prefixes that keep ids from colliding across sources. */
const ID_PREFIX: Record<SourceKind, string> = {
  greenhouse: 'gh',
  lever: 'lv',
  ashby: 'ab',
};

/** Two-letter chip shown on every card and every watchlist row. */
export const SOURCE_CODES: Record<SourceKind, string> = {
  greenhouse: 'GH',
  lever: 'LV',
  ashby: 'AB',
};

/**
 * Platform marks, for the one place that names the sources rather than coding
 * them — the header. Checked into `public/` rather than hotlinked: three files
 * that change about never, against a request to someone else's CDN on every
 * load of the page.
 *
 * Each is the platform's own app icon, so each arrives with its own background
 * fill. That is why they need no plate behind them on the dark band, and why
 * they are sized in the stylesheet rather than trimmed to a glyph.
 */
export const SOURCE_MARKS: Record<SourceKind, string> = {
  greenhouse: '/images/jobwatch/greenhouse.png',
  lever: '/images/jobwatch/lever.png',
  ashby: '/images/jobwatch/ashby.png',
};

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

/* ----------------------------------------------------------------- fetch */

const NORMALIZERS: Record<SourceKind, (payload: unknown, company: Company) => Job[]> = {
  greenhouse: normalizeGreenhouse,
  lever: normalizeLever,
  ashby: normalizeAshby,
};

/**
 * Fetches one board and normalizes it. Throws with a readable message — the UI
 * shows per-company failures rather than silently dropping a board, since a
 * quietly missing company looks identical to a company with no openings.
 */
export async function fetchCompany(company: Company, signal?: AbortSignal): Promise<Job[]> {
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

/**
 * Fetches one Greenhouse posting's description, on demand.
 *
 * Lever and Ashby ship descriptions in their list payloads with no way to opt
 * out, so this is Greenhouse-only. It is also where a Greenhouse salary comes
 * from: that endpoint has no compensation field at all, so any number is in the
 * prose. Worth knowing that's rare — 6 of 44 design roles across seven sampled
 * boards published a parseable band, and all six were one company.
 */
export async function fetchDescription(
  job: Job,
  signal?: AbortSignal,
): Promise<{ descriptionHtml: string; salary: Salary | null }> {
  if (job.source !== 'greenhouse') {
    return { descriptionHtml: job.descriptionHtml, salary: job.salary };
  }

  const token = job.companyKey.slice(job.companyKey.indexOf(':') + 1);
  const rawId = job.id.slice(job.id.indexOf(':') + 1);
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs/${encodeURIComponent(rawId)}`,
    { signal, headers: { accept: 'application/json' } },
  );
  if (!res.ok) throw new Error(`Greenhouse returned ${res.status}`);

  const payload = await res.json();
  // Same entity-escaped `content` as the list endpoint — not markup until decoded.
  const descriptionHtml = decodeEntities(clean((payload as { content?: string }).content));
  return {
    descriptionHtml,
    salary: job.salary ?? parseSalaryFromText(stripTags(descriptionHtml)),
  };
}
