'use client';

import { useEffect, useRef } from 'react';
import { mergeJobState } from '@/lib/jobwatch/merge';
import { DEFAULT_PREFS, SEED_COMPANIES } from '@/lib/jobwatch/store';
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

/** True when nothing here has been changed from what ships by default. */
function prefsUntouched(prefs: Prefs): boolean {
  return JSON.stringify({ ...prefs, version: 0 }) === JSON.stringify({ ...DEFAULT_PREFS, version: 0 });
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

        // Prefs are one document with no per-field history, so there is nothing
        // to merge. Remote wins only when this browser is still on the shipped
        // defaults, which is the case that matters — a new machine.
        if (remote.prefs && prefsUntouched(prefs)) merged.prefs = remote.prefs;

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
