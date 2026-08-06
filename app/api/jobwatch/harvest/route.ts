/**
 * The token harvest.
 *
 * Separate from the sweep on purpose. The sweep probes boards we already know
 * about and runs daily; this finds boards we don't, by crawling Built In for
 * apply links and reading the ATS out of them — see `builtin.ts` for why that
 * is a discovery source rather than a posting source.
 *
 * It earns a much slower schedule than the sweep. The set of companies running
 * a given ATS barely moves week to week, and this crawls someone else's site
 * rather than three APIs built to be polled.
 */

import { harvestBuiltIn, BUILTIN_CATEGORIES } from '@/lib/jobwatch/builtin';
import { readHarvest, writeHarvest } from '@/lib/jobwatch/index-store';
import { isAuthed } from '@/lib/jobwatch/session';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Stop crawling with time left to write, rather than being killed mid-run. */
const WRITE_BUDGET_MS = 15_000;

/** Ceiling on `?pages=`. See where it is read. */
const MAX_PAGES = 20;

/** Same two trusted callers as the sweep — see the note in `refresh/route.ts`. */
async function authorized(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') === `Bearer ${secret}`) return true;
  if (await isAuthed()) return true;
  return !secret && process.env.NODE_ENV === 'development';
}

export async function GET(request: Request) {
  const started = Date.now();

  if (!(await authorized(request))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);

  /**
   * Both parameters are bounded, because this crawls somebody else's site.
   *
   * `pages` was `Number(...) || 4` with no ceiling, so `?pages=99999` walked
   * Built In until the deadline killed it — a request anyone holding the
   * password could make, repeatedly. The cap is far past the useful yield: a
   * category page is 25 postings and they run out long before twenty pages, at
   * which point `harvestBuiltIn` stops on the empty page anyway.
   */
  const requestedPages = Number(url.searchParams.get('pages'));
  const pages = Number.isInteger(requestedPages) && requestedPages > 0
    ? Math.min(requestedPages, MAX_PAGES)
    : 4;

  /**
   * A category is interpolated into a URL path, so it is held to a slug. The
   * host is hardcoded and a path segment cannot escape it, but `../` still
   * walks to pages this has no business fetching, and a category that isn't one
   * is a wasted round trip either way.
   */
  // An empty list folds to the default rather than being honoured literally:
  // `?categories=` would otherwise crawl nothing and report a successful
  // harvest of zero boards, which reads as "Built In has stopped working".
  const requestedCategories = url.searchParams.get('categories')
    ?.split(',').map((c) => c.trim()).filter(Boolean);
  if (requestedCategories?.some((c) => !/^[a-z0-9-]+$/.test(c))) {
    return Response.json(
      { error: 'Categories must be lowercase slugs' },
      { status: 400 },
    );
  }
  const categories = requestedCategories?.length ? requestedCategories : BUILTIN_CATEGORIES;

  try {
    const before = await readHarvest();
    const beforeCount = Object.values(before.tokens).reduce((n, list) => n + (list?.length ?? 0), 0);

    const deadline = started + (maxDuration * 1000 - WRITE_BUDGET_MS);
    const result = await harvestBuiltIn({ categories, maxPages: pages, deadline });

    const after = await writeHarvest(result.boards);
    const afterCount = Object.values(after.tokens).reduce((n, list) => n + (list?.length ?? 0), 0);

    // Per-source counts are the useful number here: the whole point of this job
    // is the platforms the upstream lists don't cover, and a total hides whether
    // it found any.
    const bySource: Record<string, number> = {};
    for (const [source, list] of Object.entries(after.tokens)) {
      bySource[source] = list?.length ?? 0;
    }

    return Response.json({
      ok: true,
      categories,
      pages,
      visited: result.visited,
      unmatched: result.unmatched,
      matched: result.boards.length,
      added: afterCount - beforeCount,
      totalTokens: afterCount,
      bySource,
      elapsedMs: Date.now() - started,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: (err as Error)?.message ?? 'Harvest failed',
        elapsedMs: Date.now() - started,
      },
      { status: 500 },
    );
  }
}
