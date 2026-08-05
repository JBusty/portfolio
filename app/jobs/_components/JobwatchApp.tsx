'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  appliedRecords, countTuned, explainMatch, filterJobs, type Tab, type View,
} from '@/lib/jobwatch/filter';
import { clockTime, plural } from '@/lib/jobwatch/format';
import { SOURCE_LABELS, SOURCE_MARKS, SOURCE_ORDER } from '@/lib/jobwatch/sources';
import { isNewSince } from '@/lib/jobwatch/store';
import type { Job } from '@/lib/jobwatch/types';
import ConfirmDialog from './ConfirmDialog';
import CountUp from './CountUp';
import JobDetail from './JobDetail';
import JobTypesInput from './JobTypesInput';
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

/** The two lists. Hidden flips whichever of these is showing. */
const TABS: Array<[Tab, string]> = [
  ['open', 'Open'],
  ['applied', 'Applied'],
];

/** Per-tab empty states. Each tab is empty for its own reason. */
const EMPTY_TITLE: Record<Tab, (total: number) => string> = {
  open: (total) => (total === 0 ? 'Nothing tracked yet' : 'No postings match'),
  applied: () => 'No applications logged',
};

const EMPTY_BODY: Record<Tab, (total: number, syncing: boolean) => string> = {
  open: (total, syncing) =>
    total > 0
      ? 'Loosen something in Filters, or widen the job types above.'
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
    sweeping, sweepNote, runSweep,
    addCompany, removeCompany, loadDescription,
    markApplied, unapply, toggleHidden,
    updatePrefs, resetPrefs,
  } = useJobwatch();

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('open');
  const [hiddenOnly, setHiddenOnly] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Job id awaiting confirmation before it leaves the application log. */
  const [pendingUnapply, setPendingUnapply] = useState<string | null>(null);

  const barRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  /** True once the nav has lifted off the hero and is pinned. */
  const [navStuck, setNavStuck] = useState(false);

  const prefsRef = useRef<HTMLDivElement>(null);
  const prefsBtnRef = useRef<HTMLButtonElement>(null);
  const sourcesRef = useRef<HTMLDivElement>(null);
  const sourcesBtnRef = useRef<HTMLButtonElement>(null);

  useClickOff(showPrefs, () => setShowPrefs(false), prefsRef, prefsBtnRef);
  useClickOff(showSources, () => setShowSources(false), sourcesRef, sourcesBtnRef);

  /**
   * Both pinned bars republish their height, because everything below them
   * pins off it: the toolbar sits under the nav, and the detail pane under
   * both. The toolbar wraps to a different number of rows depending on width
   * and the nav changes height with it, so a fixed offset is wrong at most
   * viewport sizes.
   */
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || typeof ResizeObserver === 'undefined') return;

    const measure = (el: Element | null, prop: string) => {
      if (!el) return null;
      const observer = new ResizeObserver(([entry]) => {
        // Border box, not content box. The nav carries a 1px bottom rule that
        // `contentRect` does not count, and pinning the toolbar to a number one
        // pixel short leaves a hairline of the page showing between them.
        const height = entry.borderBoxSize?.[0]?.blockSize
          ?? el.getBoundingClientRect().height;
        shell.style.setProperty(prop, `${Math.round(height)}px`);
      });
      observer.observe(el);
      return observer;
    };

    const observers = [
      measure(navRef.current, '--jw-nav'),
      measure(barRef.current, '--jw-bar'),
    ];
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  /**
   * Whether the nav has anything behind it, which is what decides the glass.
   *
   * Not an IntersectionObserver, which is the usual way to detect a stuck
   * element and is wrong here: the nav is the first thing in the document, so
   * it sits at `top: 0` before any scrolling at all and the observer reports it
   * pinned from the first paint. It was glass on the hero, which is the state
   * this is meant to avoid. Scroll position answers the actual question — is
   * there page underneath me — and nothing else does.
   *
   * The listener is passive and only touches state when the answer flips, so a
   * long scroll is one render rather than one per frame.
   */
  useEffect(() => {
    const onScroll = () => setNavStuck(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
    (job: Job) => isNewSince(job, jobState, NEW_WINDOW_MS),
    [jobState],
  );

  /* -------------------------------------------------------------- filter */

  const view = useMemo<View>(() => {
    const q = query.trim().toLowerCase();
    return {
      tab,
      hiddenOnly,
      terms: q ? q.split(/\s+/) : [],
      index,
    };
  }, [tab, hiddenOnly, query, index]);

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

  /**
   * The Open list with the Hidden switch forced off — the one set every figure
   * on the page is measured against.
   *
   * Everything in the header used to be counted off `jobs`, the raw index, and
   * that is a different set from the one on screen by a long way: the sweep
   * only ever applied the title test, so `jobs` still holds the on-site roles,
   * the non-US ones, the wrong seniorities and everything under the salary
   * floor. Reporting a count over that while showing a list filtered from it
   * gives two numbers that can never be reconciled by looking — and "new this
   * week" was the one where it showed, because you can count the New badges.
   *
   * Same rule as the tab pinning above: the Hidden switch is forced off because
   * a figure has to describe the list you get, and flipping Hidden is looking
   * somewhere else rather than the postings going away. Only pays for the extra
   * pass while the switch is on.
   */
  const openRoles = useMemo(
    () => (hiddenOnly
      ? filterJobs(jobs, prefs, jobState, { ...view, tab: 'open', hiddenOnly: false })
      : open),
    [hiddenOnly, open, jobs, prefs, jobState, view],
  );

  const openCount = openRoles.length;

  /**
   * What the Hidden switch would actually show.
   *
   * Counting hidden flags in job state instead gives a number the list can
   * never match: it includes postings that have since closed, and ones the
   * other filters drop for being the wrong level or not remote. The badge has
   * to promise what flipping it delivers, so it is measured through the same
   * pipeline with the switch forced on — forced, so the number doesn't vanish
   * the moment you flip it.
   */
  const hiddenAvailable = useMemo(
    () => filterJobs(jobs, prefs, jobState, { ...view, tab: 'open', hiddenOnly: true }).length,
    [jobs, prefs, jobState, view],
  );

  /**
   * Terms the boards have not actually been searched for.
   *
   * This used to be `prefs.updatedAt > indexMeta.updatedAt`, which was wrong in
   * both directions and mostly wrong. Any preference stamps `updatedAt` —
   * changing the sort order lit the Sweep button — and the stamp persists, so
   * one edit left it lit until the next sweep, which on a daily cron is all
   * day. It was on in every screenshot of it ever taken.
   *
   * The real question is narrower and answerable: is there a term the index was
   * not built with? Narrowing the list never needs a sweep, because those
   * postings are already in hand. Only widening does.
   *
   * Empty while the index reports no coverage at all — one built before the
   * field existed — rather than flagging every term, which would be the old
   * always-on behaviour wearing a better explanation.
   */
  const unsweptTypes = useMemo(() => {
    if (!indexMeta || indexMeta.types.length === 0) return [];
    const covered = new Set(indexMeta.types);
    return prefs.jobTypes.filter((term) => !covered.has(term));
  }, [indexMeta, prefs.jobTypes]);

  /* --------------------------------------------------------------- counts */

  const counts = useMemo(() => {
    // Applied is counted off job state on purpose — the log is the record, and
    // most of those postings are gone from every board by the time you look.
    // Hidden is not counted here: see `hiddenAvailable`, which measures it
    // through the pipeline so the badge matches the list.
    let applied = 0;
    for (const entry of Object.values(jobState)) {
      if (entry.applied) applied += 1;
    }

    // Both of these come off `openRoles` — the postings actually on the list —
    // so every figure in the header is a count of the same set and any of them
    // can be checked by scrolling. Hidden and applied need no guard here: the
    // pipeline has already dropped them.
    let fresh = 0;
    const hiring = new Set<string>();
    for (const job of openRoles) {
      hiring.add(job.companyKey);
      if (isNewSince(job, jobState, NEW_WINDOW_MS)) fresh += 1;
    }

    return { applied, fresh, hiring: hiring.size };
  }, [jobState, openRoles]);

  const rows = useMemo(
    () =>
      tab === 'applied'
        ? applied
        : open.map((job) => ({ id: job.id, job, appliedAt: undefined as number | undefined })),
    [tab, applied, open],
  );

  const tabCounts: Record<Tab, number> = {
    open: openCount,
    applied: counts.applied,
  };

  const selected = useMemo(() => {
    if (!selectedId) return null;
    const fromRows = rows.find((r) => r.id === selectedId)?.job;
    return fromRows ?? jobs.find((j) => j.id === selectedId) ?? null;
  }, [rows, jobs, selectedId]);

  // Some boards publish a bare listing; pull the write-up when one opens.
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
      <JobwatchNav ref={navRef} stuck={navStuck} />

      {/* ---- header ----
          The standing story, in the order it is worth reading: who this is,
          what is being looked for, what that comes to, and where it came from.
          Scrolls away; only the filter bar is pinned, which is why the search
          box lives down there instead — a control you reach for mid-scroll
          cannot sit in the part that scrolls off. */}
      <header className={styles.header}>
        <div className={`${styles.wrap} ${styles.headerInner}`}>
          <div className={styles.headerId}>
            <h1 className={styles.wordmark}>
              Jobwatch<span className="accent">.</span>
            </h1>

            {/* What you are looking for, before what that turned up. The
                figures below are a count of what this line asks for, so asking
                first and answering second is the order the header reads in —
                the other way round opens on a number with nothing yet to say
                what it counts. */}
            <JobTypesInput
              value={prefs.jobTypes}
              onChange={(jobTypes) => updatePrefs({ jobTypes })}
              unswept={unsweptTypes}
              sweeping={sweeping}
              sweepNote={sweepNote}
              onSweep={() => void runSweep()}
            />

            {/* Where it was looked for, between the asking and the answer.
                Named and marked rather than coded: GH/LV/AB is shorthand that
                works on a row only once you already know the three, and this is
                the one place on the page that says what they are. */}
            <p className={styles.headerSources}>
              <span className={styles.headerSourcesLabel}>sourced from</span>
              {SOURCE_ORDER.map((source) => (
                <span key={source} className={styles.headerSource}>
                  {/* Decorative: the platform's name is set right beside it,
                      so announcing the mark too would only say it twice. */}
                  <Image
                    className={styles.headerSourceMark}
                    src={SOURCE_MARKS[source]}
                    alt=""
                    width={18}
                    height={18}
                  />
                  {SOURCE_LABELS[source]}
                </span>
              ))}
            </p>

            {/* Directly under the marks, because it finishes the same sentence
                they start: those say where the list was looked for, this says
                when. Below the figures it read as a footnote on the numbers,
                which is the smaller of the two things it qualifies. */}
            <p
              className={styles.headerSynced}
              title={usingIndex
                ? `Swept server-side — ${indexMeta?.shards ?? 0} of ${3} shards reported`
                : 'Fetched in this browser from the local watchlist'}
            >
              {usingIndex ? 'indexed' : 'local'} · synced {clockTime(lastSynced)}
            </p>

            {/* The answer: a readout, not a marketing stat row — figure over
                label, because the number is the thing being reported and the
                word only says which one. */}
            <div className={styles.headerStats}>
              {/* "tracked" named what Jobwatch was doing rather than what you
                  are being handed a count of — and counted the whole index,
                  filters and all, which is not what the list below shows. */}
              <span className={styles.headerStat}>
                <strong><CountUp value={openCount} ready={ready} /></strong>
                <span className={styles.headerStatLabel}>
                  {plural(openCount, 'open role')}
                </span>
              </span>

              {/* The only figure worth acting on, so it is the only one in the
                  accent — everything else is context for it. */}
              <span className={`${styles.headerStat} ${styles.headerStatLive}`}>
                <strong><CountUp value={counts.fresh} ready={ready} /></strong>
                <span className={styles.headerStatLabel}>new this week</span>
              </span>

              {/* Not "boards". A board is the thing being polled, which is
                  Jobwatch's plumbing showing through — what is worth knowing is
                  how many companies the roles in front of you came from, which
                  is also why this counts the list rather than the watchlist. */}
              <span className={styles.headerStat}>
                <strong><CountUp value={counts.hiring} ready={ready} /></strong>
                <span className={styles.headerStatLabel}>
                  {plural(counts.hiring, 'company hiring', 'companies hiring')}
                </span>
              </span>

              {errorCount > 0 && !usingIndex && (
                <span className={`${styles.headerStat} ${styles.headerAlert}`}>
                  <strong>{errorCount}</strong>
                  <span className={styles.headerStatLabel}>failing</span>
                </span>
              )}
            </div>

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

          {/* A switch, not a narrowing: it swaps the list for the hidden pile
              rather than adding to it, which is the only way back to a posting
              you hid. Sits with the panel triggers rather than in the switcher
              because it is orthogonal to Open/Applied. Disabled on Applied,
              where the log is the record and nothing is hidden from it. */}
          <button
            type="button"
            className={`${styles.toggle} ${styles.barBtn}`}
            data-active={hiddenOnly}
            onClick={() => setHiddenOnly((v) => !v)}
            aria-pressed={hiddenOnly}
            disabled={tab === 'applied'}
            title="Show only the postings you have hidden, so you can unhide them"
          >
            Hidden
            {hiddenAvailable > 0 && <span className={styles.count}>{hiddenAvailable}</span>}
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
          {/* The hidden pile is a different room, not a filtered version of
              this one — none of the preferences apply in it and everything in
              it is something you removed. So it says so outright rather than
              leaving the lit switch in the bar as the only clue. */}
          <div className={styles.listMeta} data-hidden={hiddenOnly}>
            <span>
              {ready ? `${shown} ${plural(shown, tab === 'applied' ? 'application' : 'posting')}` : 'Loading…'}
              {ready && !hiddenOnly && shown !== total && ` of ${total}`}
              {ready && hiddenOnly && ' you hid · filters do not apply here'}
            </span>
            {hiddenOnly ? (
              <button
                type="button"
                className={styles.listMetaExit}
                onClick={() => setHiddenOnly(false)}
              >
                Back to open roles
              </button>
            ) : (
              <span>j / k to move · esc to close</span>
            )}
          </div>

          {!ready && (
            <div className={styles.empty}>
              <span className={styles.emptyTitle}>Starting up</span>
            </div>
          )}

          {ready && shown === 0 && (
            <div className={styles.empty}>
              {/* An empty hidden pile is not a filter that needs loosening —
                  it is the ordinary state of having hidden nothing yet. */}
              {hiddenOnly ? (
                <>
                  <span className={styles.emptyTitle}>Nothing hidden</span>
                  <p className={styles.emptyBody}>
                    Hide a posting and it moves here, out of Open until you flip this back.
                  </p>
                </>
              ) : (
                <>
                  <span className={styles.emptyTitle}>{EMPTY_TITLE[tab](total)}</span>
                  <p className={styles.emptyBody}>{EMPTY_BODY[tab](total, syncing)}</p>
                </>
              )}
            </div>
          )}

          {ready &&
            rows.map(({ id, job, appliedAt }) => (
              <JobRow
                key={id}
                job={job}
                selected={id === selectedId}
                isNew={isNew(job)}
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
