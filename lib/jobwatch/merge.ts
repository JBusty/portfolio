/**
 * Reconciling two copies of job state.
 *
 * Pure, and deliberately kept out of the hook that calls it — this is the part
 * that decides whether a decision of yours survives, so it should be readable
 * and testable without a browser.
 */

import type { JobState } from './types';

/**
 * Last decision wins, per posting.
 *
 * A tie goes to local, which is what makes the first sync behave like a seed:
 * nothing written before `updatedAt` existed carries a stamp, so both sides
 * read as 0 and this browser's flags win over a database full of bare firstSeen
 * rows. Afterwards every deliberate change is stamped and the comparison is
 * real.
 *
 * `firstSeen` is merged on its own terms and always takes the earlier of the
 * two: it records when a posting was first observed anywhere, so the older
 * sighting is the true one regardless of which side edited last. Taking it from
 * the winning entry instead would let opening the tool on a new machine reset
 * the age of every posting, and the age filter reads that field.
 */
export function mergeJobState(local: JobState, remote: JobState): JobState {
  const merged: JobState = {};

  for (const id of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const a = local[id];
    const b = remote[id];

    if (!a) { merged[id] = b; continue; }
    if (!b) { merged[id] = a; continue; }

    const winner = (b.updatedAt ?? 0) > (a.updatedAt ?? 0) ? b : a;
    const earliest = Math.min(a.firstSeen || Infinity, b.firstSeen || Infinity);

    merged[id] = {
      ...winner,
      firstSeen: Number.isFinite(earliest) ? earliest : winner.firstSeen,
    };
  }

  return merged;
}
