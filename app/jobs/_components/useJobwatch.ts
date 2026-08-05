'use client';

/**
 * All Jobwatch state in one hook: the watchlist, the fetch results, the
 * preferences, and the per-job triage. Keeping it out of the page component
 * means the UI below is only ever rendering.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { companyKey, fetchCompany, fetchDescription } from '@/lib/jobwatch/sources';
import {
  DEFAULT_PREFS,
  hydrate,

  loadCache,
  loadCompanies,
  loadJobState,
  loadPrefs,
  observeJobs,
  PRE_EXISTING,
  pruneJobState,
  saveCache,
  saveCompanies,
  saveJobState,
  savePrefs,
  SEED_COMPANIES,
  toSnapshot,
} from '@/lib/jobwatch/store';
import type { JobIndex } from '@/lib/jobwatch/sweep';
import { useRemoteState } from './useRemoteState';

import { titleCase } from '@/lib/jobwatch/format';
import type {
  Company,
  CompanyResult,
  Job,
  JobState,
  Prefs,
  Salary,
  SourceKind,
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
  const [indexMeta, setIndexMeta] = useState<{ updatedAt: number; shards: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch('/api/jobwatch/index');
        if (!res.ok) return;
        const payload = (await res.json()) as JobIndex;
        if (cancelled || payload?.version !== 1 || !Array.isArray(payload.jobs)) return;
        if (payload.jobs.length === 0) return;

        setIndexJobs(payload.jobs.map((j) => ({ ...j, descriptionHtml: '' })));
        setIndexMeta({
          updatedAt: payload.updatedAt,
          shards: Object.keys(payload.shards ?? {}).length,
        });
      } catch {
        // Offline, or the route isn't deployed. The local path still works.
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const usingIndex = indexJobs !== null;

  /* ------------------------------------------------------------- hydrate */

  useEffect(() => {
    const savedCompanies = loadCompanies();
    // Runs the pre-v1 marks/seen migration on first load if it hasn't happened.
    const savedState = loadJobState();
    const savedPrefs = loadPrefs();
    const cache = loadCache();

    const restored: Results = {};
    for (const c of savedCompanies) {
      const hit = cache[c.key];
      restored[c.key] = hit
        ? { key: c.key, status: 'ok', jobs: hydrate(hit.jobs), error: null, fetchedAt: hit.fetchedAt }
        : blank(c.key);
    }

    resultsRef.current = restored;
    companiesRef.current = savedCompanies;
    jobStateRef.current = savedState;

    setCompanies(savedCompanies);
    setJobState(savedState);
    setPrefs(savedPrefs);
    setResults(restored);
    setReady(true);
  }, []);

  /* -------------------------------------------------------------- persist */

  useEffect(() => {
    companiesRef.current = companies;
    if (ready) saveCompanies(companies);
  }, [companies, ready]);

  useEffect(() => {
    jobStateRef.current = jobState;
    if (ready) saveJobState(jobState);
  }, [jobState, ready]);

  useEffect(() => {
    if (ready) savePrefs(prefs);
  }, [prefs, ready]);

  /**
   * The durable copy. localStorage above is still the working copy — this
   * mirrors it so clearing a browser, switching machines, or Safari evicting
   * storage no longer takes the application history with it.
   */
  useRemoteState({
    ready,
    prefs,
    jobState,
    companies,
    onReconcile: (merged) => {
      if (merged.prefs) setPrefs(merged.prefs);
      if (merged.jobState) {
        jobStateRef.current = merged.jobState;
        setJobState(merged.jobState);
      }
      if (merged.companies?.length) {
        companiesRef.current = merged.companies;
        setCompanies(merged.companies);
      }
    },
  });

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

    saveCache(resultsRef.current);
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
    saveCache(next);
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

  const toggleSaved = useCallback((id: string) => {
    patchEntry(id, (entry) => ({ ...entry, saved: !entry.saved }));
  }, [patchEntry]);

  const toggleHidden = useCallback((id: string) => {
    patchEntry(id, (entry) => ({ ...entry, hidden: !entry.hidden }));
  }, [patchEntry]);

  /* --------------------------------------------------- descriptions */

  /**
   * Greenhouse descriptions, fetched when a posting is opened and kept for the
   * session only. They are far too big for localStorage — that was already true
   * of the cache, and it is why the list endpoint no longer asks for them.
   */
  const [descriptions, setDescriptions] = useState<Record<string, DescriptionEntry>>({});
  const descriptionsRef = useRef<Record<string, DescriptionEntry>>({});

  const loadDescription = useCallback((job: Job) => {
    // Lever and Ashby already carry the description; only Greenhouse is empty.
    if (job.source !== 'greenhouse' || job.descriptionHtml) return;
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
  const updatePrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetPrefs = useCallback(() => setPrefs(DEFAULT_PREFS), []);

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
    sync, addCompany, removeCompany, loadDescription,
    markApplied, unapply, toggleSaved, toggleHidden,
    updatePrefs, resetPrefs,
  };
}
