'use client';

import { useEffect, useRef } from 'react';
import type { Company, JobState, Prefs } from '@/lib/jobwatch/types';

/**
 * Mirrors preferences, triage, and the watchlist to the database.
 *
 * localStorage is deliberately left in place and unchanged. It still renders
 * the page instantly and offline, and rewriting the store to async would make
 * every read a suspense boundary for no gain. This runs alongside it: the
 * browser stays the working copy, the database becomes the durable one.
 *
 * On a browser that already has data, the local copy wins and is pushed up —
 * that is the stated source of truth. The pull only happens on a browser with
 * nothing in it at all, which is what makes a second device or a cleared cache
 * come back with its history instead of empty.
 */

const ENDPOINT = '/api/jobwatch/state';

/** Long enough that dragging a slider is one write, short enough to feel saved. */
const DEBOUNCE_MS = 1200;

type Snapshot = { prefs: Prefs; jobState: JobState; companies: Company[] };

type Options = Snapshot & {
  ready: boolean;
  /** True when localStorage had nothing — the only case where remote wins. */
  empty: boolean;
  onRestore: (remote: Partial<Snapshot>) => void;
};

export type RemoteStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useRemoteState({ ready, empty, prefs, jobState, companies, onRestore }: Options) {
  const status = useRef<RemoteStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const started = useRef(false);
  const restore = useRef(onRestore);
  restore.current = onRestore;

  // First contact: either seed an empty browser from the database, or push the
  // browser's copy up as the authority. Runs once.
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;

    void (async () => {
      try {
        if (empty) {
          const res = await fetch(ENDPOINT);
          if (!res.ok) return;
          const remote = (await res.json()) as Partial<Snapshot> & { prefs: Prefs | null };
          const hasRemote =
            remote.prefs != null ||
            Object.keys(remote.jobState ?? {}).length > 0 ||
            (remote.companies ?? []).length > 0;
          if (hasRemote) restore.current(remote);
          return;
        }

        await fetch(ENDPOINT, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prefs, jobState, companies }),
        });
      } catch {
        // Offline, or the gate expired mid-session. localStorage still holds
        // everything, so this is a missed mirror rather than lost data.
      }
    })();
  }, [ready, empty, prefs, jobState, companies]);

  // Ongoing mirror. Debounced, and deliberately sends all three rather than
  // diffing: the payload is small and a partial write that raced a toggle would
  // be harder to reason about than one that always reflects current state.
  useEffect(() => {
    if (!ready || !started.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      status.current = 'saving';
      void fetch(ENDPOINT, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prefs, jobState, companies }),
      })
        .then((res) => { status.current = res.ok ? 'saved' : 'error'; })
        .catch(() => { status.current = 'error'; });
    }, DEBOUNCE_MS);

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [ready, prefs, jobState, companies]);

  return status;
}
