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

/**
 * The glanceable part of a salary string.
 *
 * `salary.text` is kept verbatim from the source, which is right for storage
 * and wrong for a pill: Ashby and SmartRecruiters append their own prose after
 * a bullet — "$165K – $185K • Base salary $165k-$185k with a 10% Management
 * Bonus" — and the band is the only part anyone reads at a glance. Cutting at
 * the bullet leaves the number and drops the commentary.
 *
 * The full string still reaches the reader: both callers put it in `title`. A
 * hard cap follows for sources that use no bullet at all, because the point of
 * this is that no posting can dictate how wide a row gets.
 */
export function salaryLabel(text: string): string {
  const band = text.split('•')[0].trim();
  const chosen = band || text.trim();
  return chosen.length > 32 ? `${chosen.slice(0, 31).trimEnd()}…` : chosen;
}
