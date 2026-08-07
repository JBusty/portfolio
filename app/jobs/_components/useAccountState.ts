'use client';

/**
 * The account's state: loaded once from the database, mirrored back on change.
 *
 * This replaces a hook that reconciled two copies — localStorage and the
 * database — with merge rules for deciding which was ahead. All of that
 * apparatus existed to answer "which copy is newer", and the answer is now "the
 * only copy", so the merge, the per-entry `updatedAt` comparison and the
 * seed-on-first-sync special case are gone with it.
 *
 * The reason is not tidiness. A browser-local copy has no idea who is signed
 * in: signing out and signing in as somebody else left the previous person's
 * filters and application log sitting in local storage, ready to be reconciled
 * *into* the new account on the next load. That is not a bug you fix with a
 * better merge rule.
 *
 * Signed out is a supported state and not an error. Nothing loads, nothing
 * saves, and the session works — which is exactly what an anonymous visitor was
 * promised.
 */

import { useEffect, useRef, useState } from 'react';
import { normalizePrefs, toCompanies, normalizeJobState } from '@/lib/jobwatch/store';
import type { Company, JobState, Prefs } from '@/lib/jobwatch/types';

const ENDPOINT = '/api/jobwatch/state';

/** Long enough that dragging a slider is one write, short enough to feel saved. */
const DEBOUNCE_MS = 1200;

export type Loaded = {
  prefs: Prefs | null;
  jobState: JobState;
  companies: Company[];
};

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Four states, not a boolean, because the chrome says different things about
 * each and a boolean forced three of them to share an answer.
 *
 * `loading` is the one that mattered most. It was folded into "not signed in",
 * which is true for the first few hundred milliseconds of every visit and false
 * immediately after — so a signed-in user was told to confirm their email on
 * every single page load, until the fetch landed and the message vanished. A
 * warning that appears on load and then withdraws itself is worse than no
 * warning: it is the app crying wolf about the one thing it needs to be
 * believed on.
 *
 * `offline` is the second: a failed request is not a signed-out user, and
 * telling somebody to go and verify an address because the network dropped
 * sends them to fix the wrong thing.
 */
export type AccountState = 'loading' | 'active' | 'anonymous' | 'offline';

type Options = {
  /** What to push. Ignored entirely until the first load has landed. */
  prefs: Prefs;
  jobState: JobState;
  companies: Company[];
  /** Called once, with whatever the account had. */
  onLoad: (loaded: Loaded, signedIn: boolean) => void;
};

export function useAccountState({ prefs, jobState, companies, onLoad }: Options) {
  const [state, setState] = useState<AccountState>('loading');
  const [status, setStatus] = useState<SaveStatus>('idle');

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);
  const load = useRef(onLoad);
  load.current = onLoad;

  /* ---------------------------------------------------------------- read */

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    void (async () => {
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) throw new Error(String(res.status));

        const body = (await res.json()) as {
          anonymous?: boolean;
          prefs?: Partial<Prefs> | null;
          jobState?: Record<string, unknown>;
          companies?: Array<Partial<Company>>;
        };

        const isSignedIn = body.anonymous !== true;
        setState(isSignedIn ? 'active' : 'anonymous');

        load.current(
          {
            // Normalised rather than adopted: a row can predate any field this
            // build knows about, and a missing one has to become its default
            // here rather than `undefined` three layers down.
            prefs: body.prefs ? normalizePrefs(body.prefs) : null,
            jobState: normalizeJobState(body.jobState ?? {}),
            companies: toCompanies(body.companies),
          },
          isSignedIn,
        );
      } catch {
        // Offline, or the route is unreachable. The board still works from the
        // public index, and the one thing that must not happen is a write of
        // empty state over a real account — so the mirror below stays shut,
        // exactly as it does when signed out. What differs is what the chrome
        // is allowed to say about it.
        setState('offline');
        load.current({ prefs: null, jobState: {}, companies: toCompanies(null) }, false);
      }
    })();
  }, []);

  /* --------------------------------------------------------------- write */

  useEffect(() => {
    if (!loaded.current || state !== 'active') return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus('saving');
      void fetch(ENDPOINT, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prefs, jobState, companies }),
      })
        .then((res) => setStatus(res.ok ? 'saved' : 'error'))
        .catch(() => setStatus('error'));
    }, DEBOUNCE_MS);

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [state, prefs, jobState, companies]);

  return { state, status, signedIn: state === 'active' };
}
