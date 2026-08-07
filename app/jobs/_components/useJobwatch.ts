'use client';

/**
 * All Jobwatch state in one hook: the watchlist, the fetch results, the
 * preferences, and the per-job triage. Keeping it out of the page component
 * means the UI below is only ever rendering.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  companyKey,
  fetchCompany,
  fetchDescription,
  hasDescriptionEndpoint,
} from '@/lib/jobwatch/sources';
import {
  coerceNote,
  DEFAULT_PREFS,
  observeJobs,
  pruneJobState,
  SEED_COMPANIES,
  toSnapshot,
} from '@/lib/jobwatch/store';
import type { JobIndex } from '@/lib/jobwatch/sweep';
import { useAccountState } from './useAccountState';

import { titleCase } from '@/lib/jobwatch/format';
import {
  PRE_EXISTING,
  type Company,
  type CompanyResult,
  type DismissReason,
  type Job,
  type JobState,
  type Prefs,
  type Salary,
  type SourceKind,
} from '@/lib/jobwatch/types';

type Results = Record<string, CompanyResult>;

export type DescriptionEntry = {
  status: 'loading' | 'ok' | 'error';
  html: string;
  salary: Salary | null;
  error?: string;
};

/** Parallel board fetches. Enough to keep the pipe full, not enough to flood it. */
const SYNC_CONCURRENCY = 8;

/**
 * How old a board's cache can be before arriving on the page refetches it.
 *
 * The automatic sync used to refetch the entire watchlist on every visit. At 12
 * boards that was free; at 70+ it is tens of megabytes for a list that has
 * barely moved. Hitting Sync still refetches everything unconditionally.
 */
const STALE_MS = 6 * 60 * 60 * 1000;

const blank = (key: string): CompanyResult => ({
  key,
  status: 'idle',
  jobs: [],
  error: null,
  fetchedAt: null,
});

export function useJobwatch() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [results, setResults] = useState<Results>({});
  const [jobState, setJobState] = useState<JobState>({});
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [syncing, setSyncing] = useState(false);
  /** localStorage is client-only, so nothing renders as real until this flips. */
  const [ready, setReady] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const didInit = useRef(false);
  /**
   * Mirrors the pieces `runSync` reads after awaiting. Reading them through
   * refs keeps the callback off their identity, so marking a job applied can't
   * invalidate an in-flight sync.
   */
  const resultsRef = useRef<Results>({});
  const companiesRef = useRef<Company[]>([]);
  const jobStateRef = useRef<JobState>({});

  const commitResult = useCallback((key: string, entry: CompanyResult) => {
    resultsRef.current = { ...resultsRef.current, [key]: entry };
    setResults(resultsRef.current);
  }, []);

  const commitJobState = useCallback((next: JobState) => {
    jobStateRef.current = next;
    setJobState(next);
  }, []);

  /* --------------------------------------------------------------- index */

  /**
   * The swept index, or null when there isn't one to use.
   *
   * When it has postings the client stops fetching boards entirely: one request
   * for a few hundred KB, already filtered to design roles, instead of ~100
   * connections and tens of megabytes. Until then — no Blob store yet, first
   * cron run pending — it falls back to the local watchlist, so the page works
   * either way and switches over on its own.
   */
  const [indexJobs, setIndexJobs] = useState<Job[] | null>(null);
  const [indexMeta, setIndexMeta] = useState<
    { updatedAt: number; shards: number; types: string[] } | null
  >(null);

  /** Applies an index payload from wherever it came from. */
  const applyIndex = useCallback((payload: JobIndex | null | undefined) => {
    if (payload?.version !== 1 || !Array.isArray(payload.jobs)) return;
    if (payload.jobs.length === 0) return;

    setIndexJobs(payload.jobs.map((j) => ({ ...j, descriptionHtml: '' })));
    setIndexMeta({
      updatedAt: payload.updatedAt,
      shards: Object.keys(payload.shards ?? {}).length,
      types: payload.types ?? [],
    });
  }, []);

  /**
   * Pulls the merged index off the CDN. Used on arrival, where a copy up to a
   * minute old is fine and coming off the edge is the whole point.
   *
   * Not used after a sweep — see `runSweep`. The edge copy cannot be bypassed,
   * so the fresh one has to arrive by another route.
   */
  const loadIndex = useCallback(async () => {
    try {
      const res = await fetch('/api/jobwatch/index', { cache: 'no-store' });
      if (res.ok) applyIndex((await res.json()) as JobIndex);
    } catch {
      // Offline, or the route isn't deployed. The local path still works.
    }
  }, [applyIndex]);

  useEffect(() => { void loadIndex(); }, [loadIndex]);

  const usingIndex = indexJobs !== null;

  /* --------------------------------------------------------------- sweep */

  const [sweeping, setSweeping] = useState(false);
  const [sweepNote, setSweepNote] = useState<string | null>(null);

  /**
   * Runs one shard of the sweep on demand.
   *
   * One shard, not all three: a shard is ~5,300 boards and the whole point of
   * the split is that a full pass does not fit in one invocation. `shard=stale`
   * makes the route pick the third that reported longest ago, so pressing this
   * three times covers everything and pressing it once refreshes whatever is
   * most out of date.
   *
   * The merged index comes back *in the response* rather than being re-fetched.
   * A re-fetch goes through the Blob CDN, which serves a 60-second copy and
   * ignores query strings, so the page would routinely be told what the sweep
   * found and then shown the index from before it ran.
   */
  const runSweep = useCallback(async () => {
    setSweeping(true);
    setSweepNote(null);
    try {
      const res = await fetch('/api/jobwatch/refresh?shard=stale', { cache: 'no-store' });
      const payload = await res.json() as {
        ok?: boolean; error?: string; shard?: number;
        probed?: number; matched?: number; capped?: boolean;
        index?: JobIndex;
      };

      if (!res.ok || !payload.ok) {
        setSweepNote(payload.error ?? `Sweep failed (${res.status})`);
        return;
      }

      applyIndex(payload.index);
      setSweepNote(
        payload.capped
          ? `Shard ${payload.shard} hit the size cap — narrow the job types.`
          : `Shard ${payload.shard}: ${payload.probed?.toLocaleString()} boards, ${payload.matched} matched.`,
      );
    } catch (err) {
      setSweepNote((err as Error)?.message ?? 'Sweep failed');
    } finally {
      setSweeping(false);
    }
  }, [applyIndex]);

  /* ----------------------------------------------------- account state */

  /**
   * One load, from the account, and a mirror back on every change.
   *
   * There is no local copy to hydrate from first, which costs a round trip
   * before the filters are right — and buys the thing that matters more: what
   * renders belongs to whoever is signed in. The list itself does not wait on
   * this, because it comes from the public index.
   *
   * Signed out, `onLoad` still runs with the defaults, `ready` still flips, and
   * nothing is ever pushed. That is the anonymous session: everything works,
   * nothing is kept.
   */
  const { signedIn, state: accountState, status: saveStatus } = useAccountState({
    prefs,
    jobState,
    companies,
    onLoad: (loaded) => {
      if (loaded.prefs) setPrefs(loaded.prefs);

      jobStateRef.current = loaded.jobState;
      setJobState(loaded.jobState);

      companiesRef.current = loaded.companies;
      setCompanies(loaded.companies);

      // The board results are keyed by company, and until this point there were
      // no companies to key them by — so the placeholders are built here rather
      // than in a mount effect that would have had nothing to work from.
      const restored: Results = {};
      for (const c of loaded.companies) restored[c.key] = blank(c.key);
      resultsRef.current = restored;
      setResults(restored);

      setReady(true);
    },
  });

  // The refs shadow state for the async paths — `runSync` reads them after
  // awaiting, so they cannot be allowed to lag behind a render.
  useEffect(() => { companiesRef.current = companies; }, [companies]);
  useEffect(() => { jobStateRef.current = jobState; }, [jobState]);

  /* ----------------------------------------------------------------- sync */

  /**
   * Fetches boards in parallel and commits each one the moment it lands, so a
   * slow board never holds up the ones that already answered. Failures are
   * recorded per company instead of rejecting the batch — one dead token
   * shouldn't blank the page.
   */
  const runSync = useCallback(async (targets: Company[]) => {
    if (targets.length === 0) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSyncing(true);

    for (const c of targets) {
      commitResult(c.key, {
        ...(resultsRef.current[c.key] ?? blank(c.key)),
        status: 'loading',
        error: null,
      });
    }

    const fetchOne = async (c: Company) => {
      try {
        const jobs = await fetchCompany(c, ctrl.signal);
        if (ctrl.signal.aborted) return;
        commitResult(c.key, {
          key: c.key, status: 'ok', jobs, error: null, fetchedAt: Date.now(),
        });
      } catch (err) {
        if ((err as Error)?.name === 'AbortError' || ctrl.signal.aborted) return;
        const previous = resultsRef.current[c.key] ?? blank(c.key);
        commitResult(c.key, {
          ...previous,
          status: 'error',
          // Keep the last good jobs on screen; a transient failure shouldn't
          // erase results that are still perfectly useful.
          error: (err as Error)?.message ?? 'Failed to load',
        });
      }
    };

    // Bounded, not Promise.all over the whole watchlist. At 70+ boards that
    // opened 70 simultaneous connections, several of them multi-megabyte, and
    // the browser queued them anyway — this just makes the queue explicit and
    // lets results land steadily instead of in one lump at the end.
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(SYNC_CONCURRENCY, targets.length) }, async () => {
        while (cursor < targets.length && !ctrl.signal.aborted) {
          await fetchOne(targets[cursor++]);
        }
      }),
    );

    if (ctrl.signal.aborted) return;

    // Only boards still on the watchlist count toward first-seen bookkeeping.
    const live = new Set(companiesRef.current.map((c) => c.key));
    const everything = Object.values(resultsRef.current)
      .filter((r) => live.has(r.key))
      .flatMap((r) => r.jobs);

    const stamped = observeJobs(jobStateRef.current, everything);
    commitJobState(pruneJobState(stamped, new Set(everything.map((j) => j.id))));

    // No warm-start copy is written any more. It was a slice of localStorage
    // holding a few thousand postings, and postings are public data that the
    // index serves off a CDN — so the fast path it bought is one the index
    // already provides, on the path that actually runs.
    setSyncing(false);
  }, [commitResult, commitJobState]);

  const sync = useCallback(() => void runSync(companiesRef.current), [runSync]);

  // One automatic sync on arrival, limited to boards whose cache has gone
  // stale. The cached list is already on screen by then, so this is a refresh
  // rather than a blocking load. Skipped entirely once the index is carrying
  // the postings — that is the whole point of it.
  useEffect(() => {
    if (!ready || didInit.current || companies.length === 0) return;
    if (usingIndex) { didInit.current = true; return; }
    didInit.current = true;

    const now = Date.now();
    const stale = companies.filter((c) => {
      const at = resultsRef.current[c.key]?.fetchedAt;
      return at == null || now - at > STALE_MS;
    });
    if (stale.length > 0) void runSync(stale);
  }, [ready, companies, runSync, usingIndex]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* ------------------------------------------------------------ watchlist */

  const addCompany = useCallback(
    (source: SourceKind, rawToken: string, rawLabel?: string) => {
      const token = rawToken.trim();
      if (!token) return { ok: false, message: 'Enter a board token' };

      const key = companyKey(source, token);
      if (companiesRef.current.some((c) => c.key === key)) {
        return { ok: false, message: 'That board is already on the list' };
      }

      const entry: Company = { key, source, token, label: rawLabel?.trim() || titleCase(token) };
      setCompanies((prev) => (prev.some((c) => c.key === key) ? prev : [...prev, entry]));
      // Fetch the newcomer on its own rather than re-polling every board.
      void runSync([entry]);
      return { ok: true, message: '' };
    },
    [runSync],
  );

  const removeCompany = useCallback((key: string) => {
    setCompanies((prev) => prev.filter((c) => c.key !== key));
    const next = { ...resultsRef.current };
    delete next[key];
    resultsRef.current = next;
    setResults(next);
  }, []);

  /* ------------------------------------------------------------ job state */

  /**
   * Every deliberate change to an entry is stamped. `observeJobs` deliberately
   * does not go through here — a firstSeen stamp is the tool noticing a posting,
   * not you deciding anything about it, and stamping those would make every
   * browser look like it had just made 12,000 decisions.
   */
  const patchEntry = useCallback(
    (id: string, patch: (entry: JobState[string]) => JobState[string]) => {
      setJobState((prev) => {
        const current = prev[id] ?? { firstSeen: PRE_EXISTING };
        return { ...prev, [id]: { ...patch(current), updatedAt: Date.now() } };
      });
    },
    [],
  );

  /**
   * Marking applied archives the posting as it stands. The URL 404s once the
   * req closes, and this tab is the record you need when a recruiter replies
   * six weeks later — so the snapshot is the point, not a nicety.
   */
  const markApplied = useCallback((job: Job) => {
    patchEntry(job.id, (entry) => ({
      ...entry,
      applied: true,
      appliedAt: Date.now(),
      snapshot: toSnapshot(job),
    }));
  }, [patchEntry]);

  /** Clears the applied flag but keeps the snapshot — nothing is hard-deleted. */
  const unapply = useCallback((id: string) => {
    patchEntry(id, ({ appliedAt: _drop, ...entry }) => ({ ...entry, applied: false }));
  }, [patchEntry]);

  /**
   * Takes a posting off the list, and records why if you have said yet.
   *
   * One function for both halves on purpose: the posting leaves the moment you
   * press the button, and the reason arrives a second later from the dialog
   * that follows. Calling this again with a reason is the second half of the
   * same act, not a new one — which is also what makes skipping the question
   * free, since the first call has already done the part that matters.
   */
  const dismissJob = useCallback(
    (id: string, reason?: DismissReason, note?: string) => {
      patchEntry(id, (entry) => {
        const next = { ...entry, hidden: true };
        if (!reason) return next;
        next.dismissReason = reason;
        // Only ever carried with `other` — see the dialog. Trimmed and capped
        // here as well as there, because this is the door everything comes
        // through and the cap is a property of what gets stored.
        const trimmed = coerceNote(note);
        if (reason === 'other' && trimmed) next.dismissNote = trimmed;
        else delete next.dismissNote;
        return next;
      });
    },
    [patchEntry],
  );

  /**
   * Puts one back, and forgets the reason with it.
   *
   * Dropping the answer is the point rather than tidiness: you have just said
   * the dismissal was wrong, and a reason left behind would go on steering
   * suggestions toward a change you decided against.
   */
  const restoreJob = useCallback((id: string) => {
    patchEntry(id, ({ dismissReason: _r, dismissNote: _n, ...entry }) => ({
      ...entry,
      hidden: false,
    }));
  }, [patchEntry]);

  /* --------------------------------------------------- descriptions */

  /**
   * Descriptions fetched when a posting is opened, kept for the session only.
   * They are far too big for localStorage — that was already true of the cache,
   * and it is why neither the index nor the list endpoint carries them.
   */
  const [descriptions, setDescriptions] = useState<Record<string, DescriptionEntry>>({});
  const descriptionsRef = useRef<Record<string, DescriptionEntry>>({});

  const loadDescription = useCallback((job: Job) => {
    // Nothing to do when the prose already came with the listing. Otherwise it
    // is only worth a request for the boards that publish a detail route —
    // `hasDescriptionEndpoint` is the same list `fetchDescription` dispatches on,
    // and asking for the rest would just round-trip back an empty string.
    if (job.descriptionHtml || !hasDescriptionEndpoint(job.source)) return;
    if (descriptionsRef.current[job.id]?.status !== undefined) return;

    const put = (entry: DescriptionEntry) => {
      descriptionsRef.current = { ...descriptionsRef.current, [job.id]: entry };
      setDescriptions(descriptionsRef.current);
    };

    put({ status: 'loading', html: '', salary: null });
    void fetchDescription(job)
      .then((r) => put({ status: 'ok', html: r.descriptionHtml, salary: r.salary }))
      .catch((err) => put({
        status: 'error', html: '', salary: null,
        error: (err as Error)?.message ?? 'Could not load the description',
      }));
  }, []);

  /* ---------------------------------------------------------------- prefs */

  /** Prefs only ever reshape what's already fetched — this never triggers a sync. */
  /** Stamped so the database can tell which browser's filters are newer. */
  const updatePrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefs((prev) => ({ ...prev, ...patch, updatedAt: Date.now() }));
  }, []);

  // A reset is an edit too — otherwise clearing filters here would lose to a
  // stale set from another browser on the next reconcile.
  const resetPrefs = useCallback(() => setPrefs({ ...DEFAULT_PREFS, updatedAt: Date.now() }), []);

  /* -------------------------------------------------------------- derived */

  const jobs = useMemo<Job[]>(() => {
    if (indexJobs) return indexJobs;
    const live = new Set(companies.map((c) => c.key));
    return Object.values(results)
      .filter((r) => live.has(r.key))
      .flatMap((r) => r.jobs);
  }, [indexJobs, results, companies]);

  /**
   * Boards behind the current postings.
   *
   * On the index path this is derived from the postings themselves — the sweep
   * discovers boards rather than reading them off a watchlist, so there is no
   * list to read. Labels prefer the seeded spelling where we have one, since a
   * few of those are corrections the ATS payload doesn't make ("n8n", "WHOOP").
   */
  const boards = useMemo<Company[]>(() => {
    if (!indexJobs) return companies;

    const seeded = new Map(SEED_COMPANIES.map((c) => [c.key, c]));
    const out = new Map<string, Company>();
    for (const job of indexJobs) {
      if (out.has(job.companyKey)) continue;
      out.set(job.companyKey, {
        key: job.companyKey,
        source: job.source,
        token: job.companyKey.slice(job.companyKey.indexOf(':') + 1),
        label: seeded.get(job.companyKey)?.label ?? job.company,
      });
    }
    return [...out.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [indexJobs, companies]);

  const lastSynced = useMemo(() => {
    if (indexMeta) return indexMeta.updatedAt || null;
    const stamps = Object.values(results)
      .map((r) => r.fetchedAt)
      .filter((t): t is number => t != null);
    return stamps.length ? Math.max(...stamps) : null;
  }, [indexMeta, results]);

  const errorCount = useMemo(
    () => Object.values(results).filter((r) => r.status === 'error').length,
    [results],
  );

  return {
    ready, companies: boards, results, jobs, jobState, prefs, syncing, lastSynced, errorCount,
    descriptions, usingIndex, indexMeta,
    sweeping, sweepNote, runSweep,
    sync, addCompany, removeCompany, loadDescription,
    markApplied, unapply, dismissJob, restoreJob,
    updatePrefs, resetPrefs,
    /** Whether any of the above is being kept. See `useAccountState`. */
    signedIn, accountState, saveStatus,
  };
}
