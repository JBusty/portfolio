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
  const pages = Number(url.searchParams.get('pages')) || 4;
  const categories = url.searchParams.get('categories')?.split(',').filter(Boolean)
    ?? BUILTIN_CATEGORIES;

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
