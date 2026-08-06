'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  appliedRecords, countTuned, explainMatch, filterJobs, type Tab, type View,
} from '@/lib/jobwatch/filter';
import { LEVEL_ORDER } from '@/lib/jobwatch/classify';
import { dismissalSuggestions, summarizeDismissals } from '@/lib/jobwatch/feedback';
import { clockTime, plural } from '@/lib/jobwatch/format';
import { SOURCE_LABELS, SOURCE_MARKS, SOURCE_ORDER } from '@/lib/jobwatch/sources';
import { isNewSince } from '@/lib/jobwatch/store';
import type { DismissReason, Job, Prefs } from '@/lib/jobwatch/types';
import ConfirmDialog from './ConfirmDialog';
import CountUp from './CountUp';
import DismissDialog from './DismissDialog';
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

/**
 * Per-tab empty states, for the cases where nothing is being filtered out.
 *
 * The case that *is* a filter — postings indexed, none getting through — is
 * handled in the render instead, because it can say something specific and
 * offer a way out. See `narrowedBy`.
 */
const EMPTY_TITLE: Record<Tab, (total: number) => string> = {
  open: () => 'Nothing tracked yet',
  applied: (total) => (total > 0 ? 'Nothing in the log matches' : 'No applications logged'),
};

const EMPTY_BODY: Record<Tab, (total: number, syncing: boolean) => string> = {
  open: (_total, syncing) =>
    syncing
      ? 'Pulling boards now — this takes a few seconds on first load.'
      : 'Add a board from the Boards panel above; it is fetched as soon as the sweep reaches it.',
  applied: (total) =>
    total > 0
      // Preferences never reach this tab, so the search box is the only thing
      // that can have emptied it — which makes the advice exact.
      ? 'Your applications are all still here; the search is what is hiding them.'
      : 'Mark a posting applied and it moves here, with a copy of the listing kept for after the req closes.',
};

/**
 * What is actually narrowing the list, in the words the controls use.
 *
 * An empty board is nearly always one setting doing the work, and "loosen
 * something in Filters" does not say which — by then the panel is collapsed and
 * the salary floor that emptied the board is two clicks away and out of sight.
 * Naming the live constraints turns a shrug into somewhere to go.
 *
 * Job types are deliberately absent: they sit in the hero, never folded away,
 * so they cannot be the forgotten reason. Sort is absent for the reason
 * `countTuned` gives — it reorders, it never hides.
 */
function narrowedBy(prefs: Prefs, query: string): string[] {
  const out: string[] = [];
  const q = query.trim();

  if (q) out.push(`the search “${q}”`);
  if (prefs.levels.length > 0) {
    out.push(`${prefs.levels.length} of ${LEVEL_ORDER.length} seniorities`);
  }
  if (prefs.salaryFloor != null) {
    out.push(`pay from $${Math.round(prefs.salaryFloor / 1000)}k`);
  }
  if (!prefs.includeUnlistedSalary) out.push('a published salary');
  if (prefs.maxAgeDays != null) {
    // "the last 1 day" is the kind of thing that reads as generated.
    out.push(prefs.maxAgeDays === 1 ? 'the last day' : `the last ${prefs.maxAgeDays} days`);
  }
  if (prefs.exclude.length > 0) {
    out.push(`${prefs.exclude.length} excluded ${plural(prefs.exclude.length, 'word')}`);
  }
  return out;
}

/** "a", "a and b", "a, b and c" — an Oxford-less list, because it is prose. */
function sentenceList(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

export default function JobwatchApp() {
  const {
    ready, companies, results, jobs, jobState, prefs, syncing, lastSynced, errorCount,
    descriptions, usingIndex, indexMeta,
    sweeping, sweepNote, runSweep,
    addCompany, removeCompany, loadDescription,
    markApplied, unapply, dismissJob, restoreJob,
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
  /**
   * The posting the "why" dialog is asking about.
   *
   * Held by id rather than by object so it cannot go stale against a refetch,
   * and resolved against the index below — the posting is already dismissed by
   * the time this is set, so it is no longer in `rows` to be found there.
   */
  const [pendingDismiss, setPendingDismiss] = useState<string | null>(null);

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

  /**
   * Both badges promise the same thing: how many rows clicking gets you.
   *
   * Applied used to count the log directly, which made it the one figure on the
   * page that ignored the search box — type a company name and the Open badge
   * narrowed, the Applied list narrowed, and the Applied badge sat there
   * reporting the whole log. `appliedRecords` is the list itself, so counting it
   * cannot drift from what renders.
   *
   * This does not put preferences back in the way of an application record:
   * `appliedRecords` deliberately ignores prefs and honours only the search
   * terms, so a salary floor still cannot hide something you applied to.
   */
  const tabCounts: Record<Tab, number> = {
    open: openCount,
    applied: applied.length,
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

  /**
   * Below the split, the posting opens as a sheet over the list rather than
   * beside it — and a sheet over a scrollable document scrolls the document
   * behind it the moment its own content runs out, so you close it to find the
   * list somewhere it never was. Locking the page is the only thing that stops
   * that.
   *
   * A class on the root rather than an inline style, because the width this
   * applies at is the width the sheet exists at, and that number belongs in the
   * media query that makes the sheet — not duplicated in a `matchMedia` here
   * that would then have to be kept in step with it. `overflow` is set on both
   * elements: iOS Safari propagates the body's to the viewport and will happily
   * scroll the html element otherwise.
   */
  useEffect(() => {
    if (!selectedId) return;
    const { documentElement: root, body } = document;
    root.classList.add('jw-sheet-open');
    body.classList.add('jw-sheet-open');
    return () => {
      root.classList.remove('jw-sheet-open');
      body.classList.remove('jw-sheet-open');
    };
  }, [selectedId]);

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

  /**
   * Dismissing is done the instant it is pressed; the dialog that follows only
   * collects the reason.
   *
   * The other way round — ask first, remove on answer — is what turns a triage
   * pass into a form. It also makes skipping mean two different things, since
   * an unanswered question would have to either drop the posting anyway or
   * quietly put it back, and neither is what the button said it would do.
   */
  const askWhy = useCallback((id: string) => {
    dismissJob(id);
    setPendingDismiss(id);
  }, [dismissJob]);

  const answerWhy = useCallback((reason: DismissReason, note?: string) => {
    if (pendingDismiss) dismissJob(pendingDismiss, reason, note);
    setPendingDismiss(null);
  }, [pendingDismiss, dismissJob]);

  /** Already off the list; this only closes the question. */
  const skipWhy = useCallback(() => setPendingDismiss(null), []);

  const dismissed = useMemo(
    () => (pendingDismiss ? jobs.find((j) => j.id === pendingDismiss) ?? null : null),
    [pendingDismiss, jobs],
  );

  const reasonFor = useCallback((job: Job) => explainMatch(job, prefs), [prefs]);
  const tunedCount = useMemo(() => countTuned(prefs), [prefs]);

  /**
   * What the dismissals add up to, and what to do about them.
   *
   * The join behind the suggestions is a pass over the whole index, so it is
   * skipped outright until at least one posting has been given a reason —
   * which on a fresh install is forever.
   */
  const feedback = useMemo(() => summarizeDismissals(jobState), [jobState]);
  const suggestions = useMemo(
    () => (feedback.answered > 0 ? dismissalSuggestions(jobState, jobs, prefs) : []),
    [feedback.answered, jobState, jobs, prefs],
  );
  /** Only read by the empty state, so it costs nothing while there are rows. */
  const narrowing = useMemo(() => narrowedBy(prefs, query), [prefs, query]);

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
            <p
              className={styles.headerSynced}
              title={usingIndex
                ? `Swept server-side — ${indexMeta?.shards ?? 0} of ${3} shards reported`
                : 'Fetched in this browser from the local watchlist'}
            >
              {usingIndex ? 'indexed' : 'local'} · synced {clockTime(lastSynced)}
            </p>
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
        <div className={`${styles.wrap} ${styles.barInner}`}>
          {/* One flat row at every width the two panes fit side by side, and two
              rows below it: the switcher and the panel triggers become a strip
              that scrolls sideways, and the search field takes the line under
              them. The wrapper is `display: contents` above the split, so on a
              desktop it is not a box at all and the five controls lay out as
              one row — see `.barViews`. */}
          <div className={`${styles.barViews} ${styles.scrollRow}`}>
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

            {/* A switch, not a narrowing: it swaps the list for the dismissed
                pile rather than adding to it, which is the only way back to a
                posting you marked not relevant. Sits with the panel triggers
                rather than in the switcher because it is orthogonal to
                Open/Applied. Disabled on Applied, where the log is the record
                and nothing is dismissed from it.

                Named for the act rather than for the flag behind it — the store
                still calls it `hidden`, and the button that fills this pile says
                "not relevant", so a control labelled after the column would be
                the only place either word appeared. */}
            <button
              type="button"
              className={`${styles.toggle} ${styles.barBtn}`}
              data-active={hiddenOnly}
              onClick={() => setHiddenOnly((v) => !v)}
              aria-pressed={hiddenOnly}
              disabled={tab === 'applied'}
              title="Show only the postings you marked not relevant, so you can put one back"
            >
              Dismissed
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
            // What you have been marking not relevant, in the one place where
            // anything can be done about it. A reason given three postings ago
            // and never surfaced again is just a click you wasted.
            feedback={feedback}
            suggestions={suggestions}
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
          {/* The dismissed pile is a different room, not a filtered version of
              this one — none of the preferences apply in it and everything in
              it is something you removed. So it says so outright rather than
              leaving the lit switch in the bar as the only clue. */}
          <div className={styles.listMeta} data-hidden={hiddenOnly}>
            <span>
              {ready ? `${shown} ${plural(shown, tab === 'applied' ? 'application' : 'posting')}` : 'Loading…'}
              {ready && !hiddenOnly && shown !== total && ` of ${total}`}
              {ready && hiddenOnly && ' you dismissed · filters do not apply here'}
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
              // Keyboard-only advice, so it is not shown to a pointer that has
              // no keyboard behind it — see `.listMetaHint`.
              <span className={styles.listMetaHint}>j / k to move · esc to close</span>
            )}
          </div>

          {!ready && (
            <div className={styles.empty}>
              <span className={styles.emptyTitle}>Starting up</span>
            </div>
          )}

          {ready && shown === 0 && (
            <div className={styles.empty}>
              {/* An empty dismissed pile is not a filter that needs loosening —
                  it is the ordinary state of having dismissed nothing yet. */}
              {hiddenOnly ? (
                <>
                  <span className={styles.emptyTitle}>Nothing dismissed</span>
                  <p className={styles.emptyBody}>
                    Mark a posting not relevant and it moves here, out of Open until you
                    flip this back. The reason you give tunes what turns up next.
                  </p>
                </>
              ) : tab === 'open' && total > 0 ? (
                /* Postings are indexed and none are getting through, which is
                   the only empty state that is somebody's settings rather than
                   the ordinary state of a new install. So it names them and
                   offers the way back, instead of saying "loosen something". */
                <>
                  <span className={styles.emptyTitle}>No roles match</span>
                  <p className={styles.emptyBody}>
                    {narrowing.length > 0
                      // "Loosen one" needs something to point at, so the two
                      // cases are written out rather than sharing a tail.
                      ? `${total.toLocaleString()} ${plural(total, 'posting')} indexed, and `
                        + `none get past ${sentenceList(narrowing)}. `
                        + 'Loosen one and they come back.'
                      : `${total.toLocaleString()} ${plural(total, 'posting')} indexed, and `
                        + 'none of them match the job types above. Widen one and they come back.'}
                  </p>
                  <div className={styles.emptyActions}>
                    {query.trim() !== '' && (
                      <button
                        type="button"
                        className={styles.toggle}
                        onClick={() => setQuery('')}
                      >
                        Clear search
                      </button>
                    )}
                    {tunedCount > 0 && (
                      <button
                        type="button"
                        className={styles.toggle}
                        onClick={resetPrefs}
                      >
                        Reset {tunedCount} {plural(tunedCount, 'filter')}
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.toggle}
                      onClick={() => setShowPrefs(true)}
                    >
                      Open filters
                    </button>
                  </div>
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
                // Three lists, one action each: the log gets Unapply, the
                // dismissed pile gets the way back out of it, and the open list
                // gets the way in. Nothing carries two.
                onDismiss={tab === 'open' && !hiddenOnly ? askWhy : undefined}
                onRestore={hiddenOnly ? restoreJob : undefined}
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
          onDismiss={askWhy}
          onRestore={restoreJob}
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

      <DismissDialog job={dismissed} onAnswer={answerWhy} onSkip={skipWhy} />
    </main>
  );
}
