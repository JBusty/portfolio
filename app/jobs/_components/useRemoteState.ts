'use client';

import { useEffect, useRef } from 'react';
import { mergeJobState } from '@/lib/jobwatch/merge';
import { DEFAULT_PREFS, normalizePrefs, SEED_COMPANIES } from '@/lib/jobwatch/store';
import type { Company, JobState, Prefs } from '@/lib/jobwatch/types';

/**
 * Keeps this browser and the database in agreement.
 *
 * The database is the durable copy; localStorage stays the working one, because
 * it renders instantly and offline and making every read async would buy
 * nothing. On load both are reconciled, and from then on changes are mirrored
 * up.
 *
 * The earlier version only ever pulled into a browser that looked untouched,
 * and pushed from every other one. That was wrong twice over: `firstSeen` made
 * every browser look touched, so nothing ever pulled, and the pushes then
 * overwrote each other. Reconciling both directions removes the need to decide
 * which browser is "the" browser at all.
 */

const ENDPOINT = '/api/jobwatch/state';

/** Long enough that dragging a slider is one write, short enough to feel saved. */
const DEBOUNCE_MS = 1200;

type Snapshot = { prefs: Prefs; jobState: JobState; companies: Company[] };
type Remote = { prefs: Prefs | null; jobState?: JobState; companies?: Company[] };

type Options = Snapshot & {
  ready: boolean;
  onReconcile: (merged: Partial<Snapshot>) => void;
};

/**
 * True when nothing here has been changed from what ships by default. Used only
 * for prefs that predate stamping — once both sides carry `updatedAt` the
 * comparison is a real one and this is not consulted.
 */
function prefsUntouched(prefs: Prefs): boolean {
  const strip = ({ version: _v, updatedAt: _u, ...rest }: Prefs) => JSON.stringify(rest);
  return strip(prefs) === strip(DEFAULT_PREFS);
}

/**
 * Newer edit wins, ties to local — the same rule as job state.
 *
 * The old rule was "remote wins only if this browser is still on the defaults",
 * which meant that the moment two browsers had both touched their filters
 * neither would ever accept the other's again. Preferences would silently stop
 * syncing at exactly the point they started mattering.
 */
function pickPrefs(local: Prefs, remote: Prefs | null): Prefs | null {
  if (!remote) return null;

  // Normalized on the way in, never adopted raw: the row may predate any field
  // this build knows about, and a missing one has to become its default here
  // rather than `undefined` three layers down.
  const incoming = normalizePrefs(remote);

  const a = local.updatedAt ?? 0;
  const b = incoming.updatedAt ?? 0;
  if (b > a) return incoming;

  // Neither side is stamped: everything written before today. Fall back to the
  // old test so a browser still on the defaults adopts a saved set rather than
  // pushing the defaults over it.
  if (a === 0 && b === 0 && prefsUntouched(local)) return incoming;

  return null;
}

export function useRemoteState({ ready, prefs, jobState, companies, onReconcile }: Options) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const synced = useRef(false);
  const reconcile = useRef(onReconcile);
  reconcile.current = onReconcile;

  // Reconcile once, on arrival.
  useEffect(() => {
    if (!ready || synced.current) return;
    synced.current = true;

    void (async () => {
      let remote: Remote | null = null;
      try {
        const res = await fetch(ENDPOINT);
        if (res.ok) remote = (await res.json()) as Remote;
      } catch {
        // Offline, or the session expired. localStorage still holds everything,
        // so this is a missed sync rather than lost work.
      }

      const merged: Partial<Snapshot> = {};

      if (remote) {
        merged.jobState = mergeJobState(jobState, remote.jobState ?? {});

        const winningPrefs = pickPrefs(prefs, remote.prefs);
        if (winningPrefs) merged.prefs = winningPrefs;

        // Same rule for the watchlist: an untouched browser is still on the
        // seed list, and anything else is a list you built.
        const untouchedList = companies.length === SEED_COMPANIES.length;
        if (remote.companies?.length && untouchedList) merged.companies = remote.companies as Company[];

        reconcile.current(merged);
      }

      // Push the reconciled result straight back, so the database ends up
      // holding the union rather than whichever side happened to load first.
      try {
        await fetch(ENDPOINT, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            prefs: merged.prefs ?? prefs,
            jobState: merged.jobState ?? jobState,
            companies: merged.companies ?? companies,
          }),
        });
      } catch {
        // As above.
      }
    })();
    // Deliberately keyed on `ready` alone: this runs once, and re-running it on
    // every state change would re-reconcile against the copy it just wrote.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Ongoing mirror.
  useEffect(() => {
    if (!ready || !synced.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void fetch(ENDPOINT, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prefs, jobState, companies }),
      }).catch(() => {});
    }, DEBOUNCE_MS);

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [ready, prefs, jobState, companies]);
}
