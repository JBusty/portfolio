/**
 * Board discovery — server-side only.
 *
 * The three ATS APIs are all per-company: there is no "every job on Greenhouse"
 * endpoint, so a watchlist is structurally required. The question is only where
 * the company list comes from, and hand-typing it caps coverage at whatever
 * names somebody thought of. A live RunPod posting was invisible for exactly
 * that reason.
 *
 * So the list comes from a harvest instead. job-board-aggregator derives board
 * tokens from Common Crawl index data and refreshes them daily via GitHub
 * Actions; raw.githubusercontent.com serves them CORS-open.
 *
 *   https://github.com/Feashliaa/job-board-aggregator
 *
 * Roughly 15,900 tokens across the three platforms. It is not complete — RunPod
 * itself is missing from the Ashby list, because Common Crawl lags — which is
 * why `EXTRA_TOKENS` exists and why nothing here ever removes a board that was
 * added by hand.
 */

import type { SourceKind } from './types';

const HARVEST_BASE =
  'https://raw.githubusercontent.com/Feashliaa/job-board-aggregator/main/data';

const HARVEST_FILES: Record<SourceKind, string> = {
  greenhouse: 'greenhouse_companies.json',
  lever: 'lever_companies.json',
  ashby: 'ashby_companies.json',
};

/**
 * Boards the harvest misses. Verified by hand against the live API; kept
 * separate so a refresh of the upstream dataset can never drop them.
 */
const EXTRA_TOKENS: Partial<Record<SourceKind, string[]>> = {
  ashby: ['runpod'],
};

export type BoardRef = { source: SourceKind; token: string };

/** Junk that shows up in a crawl-derived list: bare ids, single characters. */
function isPlausibleToken(token: string): boolean {
  return (
    token.length > 1 &&
    token.length < 60 &&
    /[a-z]/.test(token) &&
    !/^\d+$/.test(token)
  );
}

async function fetchTokens(source: SourceKind, signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(`${HARVEST_BASE}/${HARVEST_FILES[source]}`, {
    signal,
    // The upstream list changes at most daily; there is no reason to pull it
    // on every shard of every sweep.
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!res.ok) throw new Error(`Token list for ${source} returned ${res.status}`);

  const payload: unknown = await res.json();
  const raw = Array.isArray(payload)
    ? payload
    : Object.keys((payload ?? {}) as Record<string, unknown>);

  return raw
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim().toLowerCase())
    .filter(isPlausibleToken);
}

/**
 * Every board worth probing, in a stable order.
 *
 * Stable matters: the sweep is sharded across cron runs, and a list that
 * reordered between runs would let boards fall permanently between shards.
 */
export async function discoverBoards(signal?: AbortSignal): Promise<BoardRef[]> {
  const sources: SourceKind[] = ['greenhouse', 'lever', 'ashby'];

  const lists = await Promise.all(
    sources.map(async (source) => {
      const harvested = await fetchTokens(source, signal);
      const extra = EXTRA_TOKENS[source] ?? [];
      const tokens = [...new Set([...harvested, ...extra])].sort();
      return tokens.map((token) => ({ source, token }));
    }),
  );

  return lists.flat();
}

/** The slice of boards a given shard is responsible for. */
export function shardOf(boards: BoardRef[], shard: number, shardCount: number): BoardRef[] {
  const size = Math.ceil(boards.length / shardCount);
  const start = shard * size;
  return boards.slice(start, start + size);
}
