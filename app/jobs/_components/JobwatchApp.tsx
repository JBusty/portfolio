'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  appliedRecords, countTuned, explainMatch, filterJobs, type Tab, type View,
} from '@/lib/jobwatch/filter';
import { clockTime, plural } from '@/lib/jobwatch/format';
import { isNewSince } from '@/lib/jobwatch/store';
import type { Job } from '@/lib/jobwatch/types';
import ConfirmDialog from './ConfirmDialog';
import JobDetail from './JobDetail';
import JobwatchNav from './JobwatchNav';
import JobRow from './JobRow';
import PrefsPanel from './PrefsPanel';
import SourceDrawer from './SourceDrawer';
import { SlidersIcon } from './icons';
import { useClickOff } from './useClickOff';
import { useJobwatch } from './useJobwatch';
import styles from '../jobwatch.module.css';

/** A posting counts as new for a week after Jobwatch first saw it. */
const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** The two lists. Saved and hidden narrow whichever of these is showing. */
const TABS: Array<[Tab, string]> = [
  ['open', 'Open'],
  ['applied', 'Applied'],
];

/**
 * Per-tab empty states. Each tab is empty for its own reason, and "No postings
 * match" on the Saved tab reads as a broken filter rather than as "you have not
 * saved anything yet".
 */
const EMPTY_TITLE: Record<Tab, (total: number) => string> = {
  open: (total) => (total === 0 ? 'Nothing tracked yet' : 'No postings match'),
  applied: () => 'No applications logged',
};

const EMPTY_BODY: Record<Tab, (total: number, syncing: boolean) => string> = {
  open: (total, syncing) =>
    total > 0
      ? 'Loosen something in Filters — the level switches are the strictest.'
      : syncing
        ? 'Pulling boards now — this takes a few seconds on first load.'
        : 'Add a board from the Boards panel above; it is fetched as soon as the sweep reaches it.',
  applied: () =>
    'Mark a posting applied and it moves here, with a copy of the listing kept for after the req closes.',
};

export default function JobwatchApp() {
  const {
    ready, companies, results, jobs, jobState, prefs, syncing, lastSynced, errorCount,
    descriptions, usingIndex, indexMeta,
    addCompany, removeCompany, loadDescription,
    markApplied, unapply, toggleSaved, toggleHidden,
    updatePrefs, resetPrefs,
  } = useJobwatch();

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('open');
  const [savedOnly, setSavedOnly] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Job id awaiting confirmation before it leaves the application log. */
  const [pendingUnapply, setPendingUnapply] = useState<string | null>(null);

  const barRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLElement>(null);

  const prefsRef = useRef<HTMLDivElement>(null);
  const prefsBtnRef = useRef<HTMLButtonElement>(null);
  const sourcesRef = useRef<HTMLDivElement>(null);
  const sourcesBtnRef = useRef<HTMLButtonElement>(null);

  useClickOff(showPrefs, () => setShowPrefs(false), prefsRef, prefsBtnRef);
  useClickOff(showSources, () => setShowSources(false), sourcesRef, sourcesBtnRef);

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
   * than on every keystroke.
   *
   * Descriptions are not in it. Scanning megabytes of HTML on every character
   * typed is the difference between instant and unusable, and on the index path
   * the descriptions aren't even loaded — the sweep drops them, so the toggle
   * that used to opt into this was searching empty strings.
   */
  const index = useMemo(() => {
    const map = new Map<string, string>();
    for (const j of jobs) {
      map.set(j.id, `${j.title} ${j.company} ${j.location} ${j.team ?? ''}`.toLowerCase());
    }
    return map;
  }, [jobs]);

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
      terms: q ? q.split(/\s+/) : [],
      index,
    };
  }, [tab, savedOnly, showHidden, query, index]);

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
    let hidden = 0;
    for (const entry of Object.values(jobState)) {
      if (entry.applied) applied += 1;
      if (entry.saved) saved += 1;
      if (entry.hidden) hidden += 1;
    }

    // Counted off the live set rather than job state, so it means "new and
    // still open" — the only version of the number worth acting on.
    let fresh = 0;
    for (const job of jobs) {
      const entry = jobState[job.id];
      if (entry?.hidden || entry?.applied) continue;
      if (isNewSince(jobState, job.id, NEW_WINDOW_MS)) fresh += 1;
    }

    return { applied, saved, hidden, fresh };
  }, [jobState, jobs]);

  const rows = useMemo(
    () =>
      tab === 'applied'
        ? applied
        : open.map((job) => ({ id: job.id, job, appliedAt: undefined as number | undefined })),
    [tab, applied, open],
  );

  const tabCounts: Record<Tab, number> = {
    open: open.length,
    applied: counts.applied,
  };

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
  // On Applied the denominator is the log, not the fetch — most of those
  // postings are gone from every board by then. Saved and Hidden are the same
  // shape of question: how many of that set, not how many were fetched.
  const total = tab === 'applied' ? counts.applied : jobs.length;

  /**
   * Unapplying drops `appliedAt`, and nothing else in the store records when
   * you applied — re-applying stamps today, not the original date. So this is
   * destructive in a way the button does not look, and it gets a confirm.
   *
   * The request is held here rather than confirmed at each button: it is called
   * from the row and from the detail pane already, and a third call site should
   * not be able to miss the step.
   */
  const confirmUnapply = useCallback((id: string) => setPendingUnapply(id), []);

  const pendingRecord = useMemo(
    () => (pendingUnapply ? applied.find((r) => r.id === pendingUnapply) ?? null : null),
    [pendingUnapply, applied],
  );

  const reasonFor = useCallback((job: Job) => explainMatch(job, prefs), [prefs]);
  const tunedCount = useMemo(() => countTuned(prefs), [prefs]);

  return (
    <main id="main-content" tabIndex={-1} ref={shellRef} className={`page-enter ${styles.shell}`}>
      <JobwatchNav />

      {/* ---- header ----
          Identity and the standing figures, nothing interactive. Scrolls away;
          only the filter bar is pinned, which is why search moved down there —
          a control you reach for mid-scroll cannot live in the part that
          scrolls off. */}
      <header className={styles.header}>
        <div className={`${styles.wrap} ${styles.headerInner}`}>
          <div className={styles.headerId}>
            <h1 className={styles.wordmark}>
              Jobwatch<span className="accent">.</span>
            </h1>

            {/* A readout, not a stat row: figure over label, because the number
                is the thing being reported and the word only says which one. */}
            <div className={styles.headerStats}>
              <span className={styles.headerStat}>
                <strong>{ready ? jobs.length.toLocaleString() : '—'}</strong>
                <span className={styles.headerStatLabel}>tracked</span>
              </span>

              {/* The only figure worth acting on, so it is the only one in the
                  accent — everything else is context for it. */}
              <span className={`${styles.headerStat} ${styles.headerStatLive}`}>
                <strong>{ready ? counts.fresh : '—'}</strong>
                <span className={styles.headerStatLabel}>new this week</span>
              </span>

              <span className={styles.headerStat}>
                <strong>{companies.length}</strong>
                <span className={styles.headerStatLabel}>{plural(companies.length, 'board')}</span>
              </span>

              {errorCount > 0 && !usingIndex && (
                <span className={`${styles.headerStat} ${styles.headerAlert}`}>
                  <strong>{errorCount}</strong>
                  <span className={styles.headerStatLabel}>failing</span>
                </span>
              )}
            </div>

            <p
              className={styles.headerSynced}
              title={usingIndex
                ? `Swept server-side — ${indexMeta?.shards ?? 0} of 12 shards reported`
                : 'Fetched in this browser from the local watchlist'}
            >
              {usingIndex ? 'indexed' : 'local'} · synced {clockTime(lastSynced)}
            </p>
          </div>

        </div>
      </header>

      {/* ---- filters ----
          One row, in weight order: the segmented control is the only ink-filled
          thing, the panel triggers are outlined, and the view narrowing is bare
          text. Two rows of bordered chips was what made this read as a cockpit. */}
      <div className={styles.bar} ref={barRef}>
        <div className={`${styles.wrap} ${styles.barInner} ${styles.scrollRow}`}>
          <div className={styles.tabs} role="group" aria-label="View">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={styles.tab}
                data-active={tab === id}
                onClick={() => setTab(id)}
                aria-pressed={tab === id}
              >
                {label}
                <span className={styles.tabCount}>{ready ? tabCounts[id] : '—'}</span>
              </button>
            ))}
          </div>

          {/* Beside the switcher, not up in the header: both narrow the same
              list, and the count they produce is read off the list itself. */}
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, company, location…"
            aria-label="Search postings"
            type="search"
          />

          {/* Narrowings, not destinations — they refine whichever list is
              showing, which is why they sit with the panel triggers rather than
              inside the switcher. Disabled on Applied, where neither applies. */}
          <button
            type="button"
            className={`${styles.toggle} ${styles.barBtn}`}
            data-active={savedOnly}
            onClick={() => setSavedOnly((v) => !v)}
            aria-pressed={savedOnly}
            disabled={tab === 'applied'}
          >
            Saved
            {counts.saved > 0 && <span className={styles.count}>{counts.saved}</span>}
          </button>

          <button
            type="button"
            className={`${styles.toggle} ${styles.barBtn}`}
            data-active={showHidden}
            onClick={() => setShowHidden((v) => !v)}
            aria-pressed={showHidden}
            disabled={tab === 'applied'}
            title="Bring hidden postings back into the list so you can unhide them"
          >
            Hidden
            {counts.hidden > 0 && <span className={styles.count}>{counts.hidden}</span>}
          </button>

          <button
            type="button"
            ref={prefsBtnRef}
            className={`${styles.toggle} ${styles.barBtn}`}
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
            ref={sourcesBtnRef}
            className={`${styles.toggle} ${styles.barBtn}`}
            data-active={showSources}
            onClick={() => setShowSources((s) => !s)}
            aria-expanded={showSources}
          >
            Boards
            <span className={styles.count}>{errorCount > 0 ? `${errorCount}!` : companies.length}</span>
          </button>

        </div>

        {/*
          Inside the sticky bar on purpose. As siblings below it these sat at
          their own place in the document, so once the page had scrolled the bar
          stayed pinned and opening a panel revealed it somewhere off-screen
          above. Nested, they pin with the bar — and because the ResizeObserver
          measures this element into `--jw-bar`, the detail pane beneath
          re-offsets itself instead of being overlapped.
        */}
        {showPrefs && (
          <PrefsPanel
            ref={prefsRef}
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
            ref={sourcesRef}
            companies={companies}
            results={results}
            onAdd={addCompany}
            onRemove={removeCompany}
          />
        )}
      </div>

      {/* ---- body ---- */}
      <div className={`${styles.wrap} ${styles.body}`}>
        <div className={styles.list}>
          <div className={styles.listMeta}>
            <span>
              {ready ? `${shown} ${plural(shown, tab === 'applied' ? 'application' : 'posting')}` : 'Loading…'}
              {ready && shown !== total && ` of ${total}`}
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
              <span className={styles.emptyTitle}>{EMPTY_TITLE[tab](total)}</span>
              <p className={styles.emptyBody}>{EMPTY_BODY[tab](total, syncing)}</p>
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
                onUnapply={tab === 'applied' ? confirmUnapply : undefined}
              />
            ))}
        </div>

        <JobDetail
          job={selected}
          entry={selected ? jobState[selected.id] : undefined}
          reason={selected ? reasonFor(selected) : ''}
          description={selected ? descriptions[selected.id] : undefined}
          onApply={markApplied}
          onUnapply={confirmUnapply}
          onToggleSaved={toggleSaved}
          onToggleHidden={toggleHidden}
          onClose={() => setSelectedId(null)}
        />
      </div>

      <ConfirmDialog
        open={pendingRecord != null}
        title="Remove from applications?"
        body={
          pendingRecord
            ? `${pendingRecord.job.title} at ${pendingRecord.job.company} goes back to the open list.` +
              (pendingRecord.appliedAt
                ? ` The date you applied — ${new Date(pendingRecord.appliedAt).toLocaleDateString()} — is discarded, and marking it applied again will stamp today instead.`
                : ' The date you applied is discarded and cannot be recovered.')
            : ''
        }
        confirmLabel="Unapply"
        onConfirm={() => {
          if (pendingUnapply) unapply(pendingUnapply);
          setPendingUnapply(null);
        }}
        onCancel={() => setPendingUnapply(null)}
      />
    </main>
  );
}
