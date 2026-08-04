'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  appliedRecords, countTuned, explainMatch, filterJobs, type Tab, type View,
} from '@/lib/jobwatch/filter';
import { clockTime, plural } from '@/lib/jobwatch/format';
import { stripTags } from '@/lib/jobwatch/html';
import { SOURCE_LABELS, SOURCE_ORDER } from '@/lib/jobwatch/sources';
import { isNewSince } from '@/lib/jobwatch/store';
import type { Job, SourceKind } from '@/lib/jobwatch/types';
import JobDetail from './_components/JobDetail';
import JobRow from './_components/JobRow';
import PrefsPanel from './_components/PrefsPanel';
import SourceDrawer from './_components/SourceDrawer';
import { RefreshIcon, SlidersIcon } from './_components/icons';
import { useJobwatch } from './_components/useJobwatch';
import styles from './jobwatch.module.css';

/** A posting counts as new for a week after Jobwatch first saw it. */
const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export default function JobsPage() {
  const {
    ready, companies, results, jobs, jobState, prefs, syncing, lastSynced, errorCount,
    descriptions, usingIndex, indexMeta,
    sync, addCompany, removeCompany, loadDescription,
    markApplied, unapply, toggleSaved, toggleHidden,
    updatePrefs, resetPrefs,
  } = useJobwatch();

  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SourceKind | 'all'>('all');
  const [company, setCompany] = useState('all');
  const [tab, setTab] = useState<Tab>('open');
  const [savedOnly, setSavedOnly] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [deepSearch, setDeepSearch] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const barRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLElement>(null);

  /**
   * The filter bar wraps to a different number of rows depending on viewport
   * width, and the detail pane sticks directly beneath it. Measuring beats
   * guessing: a fixed offset is wrong at most widths.
   */
  useEffect(() => {
    const bar = barRef.current;
    const shell = shellRef.current;
    if (!bar || !shell || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      shell.style.setProperty('--jw-bar', `${Math.round(entry.contentRect.height)}px`);
    });
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  /* ---------------------------------------------------------------- index */

  /**
   * Metadata-only search index, rebuilt whenever the job set changes rather
   * than on every keystroke. Descriptions are excluded by default: scanning
   * megabytes of HTML on each character typed is the difference between
   * instant and unusable, so it is opt-in via the Deep toggle.
   */
  const index = useMemo(() => {
    const map = new Map<string, string>();
    for (const j of jobs) {
      const base = `${j.title} ${j.company} ${j.location} ${j.team ?? ''}`;
      map.set(j.id, (deepSearch ? `${base} ${stripTags(j.descriptionHtml)}` : base).toLowerCase());
    }
    return map;
  }, [jobs, deepSearch]);

  const isNew = useCallback(
    (id: string) => isNewSince(jobState, id, NEW_WINDOW_MS),
    [jobState],
  );

  /* -------------------------------------------------------------- filter */

  const view = useMemo<View>(() => {
    const q = query.trim().toLowerCase();
    return {
      tab,
      savedOnly,
      showHidden,
      source,
      company,
      terms: q ? q.split(/\s+/) : [],
      index,
    };
  }, [tab, savedOnly, showHidden, source, company, query, index]);

  /** Tracked postings per platform, for the board picker's counts. */
  const sourceCounts = useMemo(() => {
    const counts = new Map<SourceKind, number>();
    for (const job of jobs) counts.set(job.source, (counts.get(job.source) ?? 0) + 1);
    return counts;
  }, [jobs]);

  // Prefs only ever re-run this. Nothing here refetches.
  //
  // Pinned to the Open tab regardless of which tab is showing, because the
  // count on the Open button has to stay honest while you are looking at
  // Applied — the pipeline keeps applied roles in when it thinks you're on
  // that tab.
  const open = useMemo(
    () => filterJobs(jobs, prefs, jobState, { ...view, tab: 'open' }),
    [jobs, prefs, jobState, view],
  );

  const applied = useMemo(
    () => appliedRecords(jobState, jobs, view),
    [jobState, jobs, view],
  );

  /* --------------------------------------------------------------- counts */

  const counts = useMemo(() => {
    let applied = 0;
    let saved = 0;
    for (const entry of Object.values(jobState)) {
      if (entry.applied) applied += 1;
      if (entry.saved) saved += 1;
    }

    // Counted off the live set rather than job state, so it means "new and
    // still open" — the only version of the number worth acting on.
    let fresh = 0;
    for (const job of jobs) {
      const entry = jobState[job.id];
      if (entry?.hidden || entry?.applied) continue;
      if (isNewSince(jobState, job.id, NEW_WINDOW_MS)) fresh += 1;
    }

    return { applied, saved, fresh };
  }, [jobState, jobs]);

  const rows = useMemo(
    () =>
      tab === 'applied'
        ? applied
        : open.map((job) => ({ id: job.id, job, appliedAt: undefined as number | undefined })),
    [tab, applied, open],
  );

  const selected = useMemo(() => {
    if (!selectedId) return null;
    const fromRows = rows.find((r) => r.id === selectedId)?.job;
    return fromRows ?? jobs.find((j) => j.id === selectedId) ?? null;
  }, [rows, jobs, selectedId]);

  // Greenhouse postings arrive without a description; pull it when one opens.
  useEffect(() => {
    if (selected) loadDescription(selected);
  }, [selected, loadDescription]);

  /* ------------------------------------------------------------ shortcuts */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      // Never steal keys from the search box or the board-token inputs.
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;

      if (e.key === 'Escape') { setSelectedId(null); return; }
      if (e.key !== 'j' && e.key !== 'k') return;

      e.preventDefault();
      const at = rows.findIndex((r) => r.id === selectedId);
      const next = e.key === 'j'
        ? Math.min(at + 1, rows.length - 1)
        : Math.max(at - 1, 0);
      if (rows[next]) setSelectedId(rows[next].id);
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rows, selectedId]);

  /* ---------------------------------------------------------------- render */

  const shown = rows.length;
  // On Applied the denominator is the log, not the fetch — most of those
  // postings are gone from every board by then.
  const total = tab === 'applied' ? counts.applied : jobs.length;

  const reasonFor = useCallback((job: Job) => explainMatch(job, prefs), [prefs]);
  const tunedCount = useMemo(() => countTuned(prefs), [prefs]);

  return (
    <main id="main-content" tabIndex={-1} ref={shellRef} className={`page-enter ${styles.shell}`}>
      {/* ---- header ----
          Identity and standing figures, plus the search field. Search belongs
          up here rather than in the filter bar: it acts on the whole corpus,
          not on the current view, and given a row of its own it stopped
          stretching to fill one. Scrolls away — only the filters are pinned. */}
      <header className={styles.header}>
        <div className={`${styles.wrap} ${styles.headerInner}`}>
          <div className={styles.headerId}>
            <h1 className={styles.wordmark}>
              Jobwatch<span className="accent">.</span>
            </h1>

            <div className={styles.headerStats}>
              <span className={styles.headerStat}>
                <strong>{ready ? jobs.length.toLocaleString() : '—'}</strong> tracked
              </span>
              <span className={styles.headerStat}>
                <strong>{ready ? counts.fresh : '—'}</strong> new this week
              </span>
              <span className={styles.headerStat}>
                <strong>{companies.length}</strong> {plural(companies.length, 'board')}
              </span>
              {errorCount > 0 && !usingIndex && (
                <span className={`${styles.headerStat} ${styles.headerAlert}`}>
                  <strong>{errorCount}</strong> failing
                </span>
              )}
              <span
                className={styles.headerStat}
                title={usingIndex
                  ? `Swept server-side — ${indexMeta?.shards ?? 0} of 12 shards reported`
                  : 'Fetched in this browser from the local watchlist'}
              >
                {usingIndex ? 'indexed' : 'local'} · synced {clockTime(lastSynced)}
              </span>
            </div>
          </div>

          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, company, location…"
            aria-label="Search postings"
            type="search"
          />
        </div>
      </header>

      {/* ---- filters ----
          One row, in weight order: the segmented control is the only ink-filled
          thing, the panel triggers are outlined, and the view narrowing is bare
          text. Two rows of bordered chips was what made this read as a cockpit. */}
      <div className={styles.bar} ref={barRef}>
        <div className={`${styles.wrap} ${styles.barInner} ${styles.scrollRow}`}>
          <div className={styles.tabs} role="group" aria-label="View">
            <button
              type="button"
              className={styles.tab}
              data-active={tab === 'open'}
              onClick={() => setTab('open')}
              aria-pressed={tab === 'open'}
            >
              Open
              <span className={styles.tabCount}>{ready ? open.length : '—'}</span>
            </button>

            <button
              type="button"
              className={styles.tab}
              data-active={tab === 'applied'}
              onClick={() => setTab('applied')}
              aria-pressed={tab === 'applied'}
            >
              Applied
              <span className={styles.tabCount}>{ready ? counts.applied : '—'}</span>
            </button>
          </div>

          <span className={styles.showing}>
            showing <strong>{ready ? shown : '—'}</strong> of {ready ? total : '—'}
          </span>

          <button
            type="button"
            className={styles.metaToggle}
            data-active={savedOnly}
            onClick={() => setSavedOnly((v) => !v)}
            aria-pressed={savedOnly}
            disabled={tab === 'applied'}
          >
            Saved{counts.saved > 0 ? ` ${counts.saved}` : ''}
          </button>

          <button
            type="button"
            className={styles.metaToggle}
            data-active={showHidden}
            onClick={() => setShowHidden((v) => !v)}
            aria-pressed={showHidden}
            disabled={tab === 'applied'}
            title="Bring hidden postings back into the list so you can unhide them"
          >
            Hidden
          </button>

          <button
            type="button"
            className={styles.metaToggle}
            data-active={deepSearch}
            onClick={() => setDeepSearch((v) => !v)}
            aria-pressed={deepSearch}
            title="Also search inside job descriptions — slower on large watchlists"
          >
            Deep
          </button>

          {/* Platform, not company — which job board a posting came off. Only
              lists platforms actually on the watchlist, so it doesn't offer a
              filter that can only ever return nothing. */}
          <select
            className={styles.metaSelect}
            value={source}
            onChange={(e) => setSource(e.target.value as SourceKind | 'all')}
            aria-label="Filter by job board"
          >
            <option value="all">All boards</option>
            {SOURCE_ORDER.filter((s) => sourceCounts.has(s)).map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]} ({sourceCounts.get(s)})
              </option>
            ))}
          </select>

          <select
            className={styles.metaSelect}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            aria-label="Filter by company"
          >
            <option value="all">All companies</option>
            {companies.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>

          <span className={styles.barGap} />

          <button
            type="button"
            className={styles.toggle}
            data-active={showPrefs}
            onClick={() => setShowPrefs((s) => !s)}
            aria-expanded={showPrefs}
          >
            <SlidersIcon />
            Filters
            {tunedCount > 0 && <span className={styles.count}>{tunedCount}</span>}
          </button>

          <button
            type="button"
            className={styles.toggle}
            data-active={showSources}
            onClick={() => setShowSources((s) => !s)}
            aria-expanded={showSources}
          >
            Boards
            <span className={styles.count}>{errorCount > 0 ? `${errorCount}!` : companies.length}</span>
          </button>

          <button type="button" className={styles.syncBtn} onClick={sync} disabled={syncing}>
            <RefreshIcon />
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
        </div>
      </div>

      {showPrefs && (
        <PrefsPanel
          prefs={prefs}
          // Always the Open list: preferences have no bearing on the
          // application log, so counting it here would make toggles look inert.
          shown={open.length}
          total={jobs.length}
          onChange={updatePrefs}
          onReset={resetPrefs}
        />
      )}

      {showSources && (
        <SourceDrawer
          companies={companies}
          results={results}
          onAdd={addCompany}
          onRemove={removeCompany}
        />
      )}

      {/* ---- body ---- */}
      <div className={`${styles.wrap} ${styles.body}`}>
        <div className={styles.list}>
          <div className={styles.listMeta}>
            <span>
              {ready ? `${shown} ${plural(shown, tab === 'applied' ? 'application' : 'posting')}` : 'Loading…'}
              {ready && tab === 'open' && shown !== total && ` of ${total}`}
            </span>
            <span>j / k to move · esc to close</span>
          </div>

          {!ready && (
            <div className={styles.empty}>
              <span className={styles.emptyTitle}>Starting up</span>
            </div>
          )}

          {ready && shown === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyTitle}>
                {tab === 'applied'
                  ? 'No applications logged'
                  : total === 0
                    ? 'Nothing tracked yet'
                    : 'No postings match'}
              </span>
              <p className={styles.emptyBody}>
                {tab === 'applied'
                  ? 'Mark a posting applied and it moves here, with a copy of the listing kept for after the req closes.'
                  : total === 0
                    ? syncing
                      ? 'Pulling boards now — this takes a few seconds on first load.'
                      : 'Add a board from the Boards panel above, then hit Sync.'
                    : 'Loosen something in Filters — the level switches and Remote only are the strictest.'}
              </p>
            </div>
          )}

          {ready &&
            rows.map(({ id, job, appliedAt }) => (
              <JobRow
                key={id}
                job={job}
                selected={id === selectedId}
                isNew={isNew(id)}
                entry={jobState[id]}
                reason={reasonFor(job)}
                appliedAt={tab === 'applied' ? appliedAt : undefined}
                onSelect={setSelectedId}
                onUnapply={tab === 'applied' ? unapply : undefined}
              />
            ))}
        </div>

        <JobDetail
          job={selected}
          entry={selected ? jobState[selected.id] : undefined}
          reason={selected ? reasonFor(selected) : ''}
          description={selected ? descriptions[selected.id] : undefined}
          onApply={markApplied}
          onUnapply={unapply}
          onToggleSaved={toggleSaved}
          onToggleHidden={toggleHidden}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </main>
  );
}
