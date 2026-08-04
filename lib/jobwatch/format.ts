/** Small display helpers shared across the Jobwatch UI. */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact age for a posting: "3d", "2w", "5mo". */
export function timeAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return '—';
  return timeAgoFrom(new Date(iso).getTime(), now);
}

/** Same scale, for the epoch-millisecond stamps Jobwatch writes itself. */
export function timeAgoFrom(then: number | null | undefined, now = Date.now()): string {
  if (then == null || !Number.isFinite(then)) return '—';

  const delta = now - then;
  if (delta < 0) return 'new';
  if (delta < HOUR) return `${Math.max(1, Math.floor(delta / MINUTE))}m`;
  if (delta < DAY) return `${Math.floor(delta / HOUR)}h`;

  const days = Math.floor(delta / DAY);
  if (days < 14) return `${days}d`;
  if (days < 60) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

/** Clock time for the last-synced readout. */
export function clockTime(ts: number | null): string {
  if (!ts) return 'never';
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** "figma" -> "Figma", "match-group" -> "Match Group". */
export function titleCase(token: string): string {
  return token
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);
