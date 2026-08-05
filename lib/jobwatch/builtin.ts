/**
 * Built In as a token harvester — server-side only.
 *
 * Built In is not a source of postings here and deliberately never becomes one.
 * Almost nothing on it is exclusive: it is an employer-branding site whose
 * listings are ingested from whatever ATS the company already runs, so indexing
 * it would mean carrying a second copy of postings we already have, matched
 * back to the first on nothing sturdier than company-plus-title.
 *
 * What it is good for is the other half of the problem. `discover.ts` gets its
 * tokens from a Common Crawl harvest that only covers Greenhouse, Lever and
 * Ashby, which means an adapter for any other platform has nothing to probe.
 * Built In's postings link out to the real ATS, so crawling a category yields
 * board tokens for SmartRecruiters, Workday, Breezy and Rippling — harvested
 * from companies that are demonstrably hiring for that category right now,
 * which a crawl-derived list of every board that ever existed is not.
 *
 * Sampled against the design category: of 14 postings, 7 exposed an ATS host —
 * 2 Workday, 2 Greenhouse, 1 SmartRecruiters, 1 Lever, 1 iCIMS. The rest link
 * nowhere we recognise. So roughly half of what it identifies is reachable only
 * because of this module, and the yield per page is modest enough that this
 * belongs on its own schedule rather than in the sweep.
 *
 * robots.txt permits both paths this uses: `/jobs*` is allowed, `Allow:
 * /jobs*?page=` overrides the general `Disallow: *?page=`, and `/job/*` is not
 * disallowed. Nothing here touches `/search`, `/apply/` or any disallowed facet.
 */

import type { SourceKind } from './types';
import type { BoardRef } from './discover';

/** Built In answers HTML, and answers it differently to a bare fetch. */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

/**
 * Category paths worth harvesting.
 *
 * A category page is 25 postings against the generic board's 16, and every one
 * of them is already the kind of role being looked for — which is the whole
 * reason to crawl a facet rather than `/jobs`.
 */
export const BUILTIN_CATEGORIES = ['design-ux'];

/** Detail pages fetched at once. Modest on purpose — see the note in `sweep.ts`. */
const CONCURRENCY = 6;

const PAGE_TIMEOUT_MS = 20_000;

/* --------------------------------------------------------- host → board */

/**
 * Greenhouse serves boards from several hosts, including a regional one.
 * `job-boards.eu.greenhouse.io` turned up in the very first sample, so matching
 * only the canonical host would have silently dropped it.
 */
const GREENHOUSE_HOST = /^(boards|job-boards)(\.eu)?\.greenhouse\.io$/;

/** `en-US`, `en_US`, `de-DE` — Workday puts an optional locale before the site. */
const LOCALE = /^[a-z]{2}[-_][A-Z]{2}$/;

/**
 * Reads an apply URL and says which board it is, if it is one we can probe.
 *
 * Returns null for everything else — iCIMS, Jobvite, Taleo and the rest turn up
 * constantly and having no adapter for them is not an error, just a board this
 * does not yet reach.
 */
export function boardFromUrl(raw: string): BoardRef | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname;
  // `filter(Boolean)` because the path always leads with a slash.
  const segments = url.pathname.split('/').filter(Boolean);
  const first = segments[0];

  const simple = (source: SourceKind): BoardRef | null =>
    first ? { source, token: first.toLowerCase() } : null;

  if (GREENHOUSE_HOST.test(host)) return simple('greenhouse');
  if (host === 'jobs.lever.co') return simple('lever');
  if (host === 'jobs.ashbyhq.com') return simple('ashby');
  if (host === 'jobs.smartrecruiters.com') return simple('smartrecruiters');
  if (host === 'ats.rippling.com') return simple('rippling');

  if (host.endsWith('.breezy.hr')) {
    return { source: 'breezy', token: host.slice(0, -'.breezy.hr'.length).toLowerCase() };
  }

  // `{tenant}.wd{N}.myworkdayjobs.com/[locale/]{site}/...`
  const workday = host.match(/^([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com$/i);
  if (workday) {
    const [, tenant, dc] = workday;
    // The site segment is case-sensitive in the API path, so it is kept verbatim
    // while the tenant — which is a hostname — is safe to lower.
    const site = segments[0] && LOCALE.test(segments[0]) ? segments[1] : segments[0];
    if (!site) return null;
    return { source: 'workday', token: `${tenant.toLowerCase()}|${site}|${dc.toLowerCase()}` };
  }

  return null;
}

/* ------------------------------------------------------------- crawling */

async function getHtml(url: string, signal?: AbortSignal): Promise<string | null> {
  const timeout = AbortSignal.timeout(PAGE_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const res = await fetch(url, {
      signal: combined,
      headers: { 'user-agent': UA, accept: 'text/html' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    // A timeout, a Cloudflare interstitial, a transient 5xx. Each costs one
    // page of tokens and nothing else, so none of them is worth failing on.
    return null;
  }
}

/** Posting paths on a category page, in document order and deduplicated. */
function postingPaths(html: string): string[] {
  const found = html.match(/href="(\/job\/[^"]+)"/g) ?? [];
  const paths = found.map((m) => m.slice('href="'.length, -1));
  return [...new Set(paths)];
}

/**
 * The apply link on a posting page.
 *
 * Built In renders the outbound URL into the markup rather than resolving it
 * behind a redirect, so the first recognisable board host on the page is it.
 * Scanning for known hosts rather than parsing the apply button keeps this from
 * breaking every time the page's markup is reshuffled.
 */
function boardOnPage(html: string): BoardRef | null {
  const urls = html.match(/https?:\/\/[a-zA-Z0-9.-]+(?:\/[a-zA-Z0-9._~%\-/]*)?/g) ?? [];
  for (const url of urls) {
    const ref = boardFromUrl(url);
    if (ref) return ref;
  }
  return null;
}

export type HarvestResult = {
  boards: BoardRef[];
  /** Posting pages actually fetched, so yield can be judged against cost. */
  visited: number;
  /** Postings whose apply link went somewhere we have no adapter for. */
  unmatched: number;
};

/**
 * Harvests board tokens from Built In.
 *
 * `deadline` mirrors `sweepBoards`: a partial harvest is strictly better than
 * being killed mid-run, and nothing here is worse for being incomplete because
 * the tokens it does return are merged rather than replacing anything.
 */
export async function harvestBuiltIn({
  categories = BUILTIN_CATEGORIES,
  maxPages = 4,
  deadline = Date.now() + 60_000,
  signal,
}: {
  categories?: string[];
  maxPages?: number;
  deadline?: number;
  signal?: AbortSignal;
} = {}): Promise<HarvestResult> {
  const paths: string[] = [];

  for (const category of categories) {
    for (let page = 1; page <= maxPages; page += 1) {
      if (Date.now() > deadline || signal?.aborted) break;
      const url =
        page === 1
          ? `https://builtin.com/jobs/${category}`
          : `https://builtin.com/jobs/${category}?page=${page}`;

      const html = await getHtml(url, signal);
      if (!html) break;

      const found = postingPaths(html);
      // An empty page means the category ran out before `maxPages` did.
      if (found.length === 0) break;
      paths.push(...found);
    }
  }

  const unique = [...new Set(paths)];
  const byKey = new Map<string, BoardRef>();
  let visited = 0;
  let unmatched = 0;
  let cursor = 0;

  const worker = async () => {
    while (cursor < unique.length && Date.now() < deadline && !signal?.aborted) {
      const path = unique[cursor++];
      const html = await getHtml(`https://builtin.com${path}`, signal);
      visited += 1;
      if (!html) continue;

      const ref = boardOnPage(html);
      if (!ref) {
        unmatched += 1;
        continue;
      }
      byKey.set(`${ref.source}:${ref.token}`, ref);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, unique.length) }, worker),
  );

  return { boards: [...byKey.values()], visited, unmatched };
}
