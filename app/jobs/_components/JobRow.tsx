'use client';

import { memo } from 'react';
import { LEVEL_LABELS, usEligibility } from '@/lib/jobwatch/classify';
import { REASON_SHORT } from '@/lib/jobwatch/feedback';
import { salaryLabel, timeAgo, timeAgoFrom } from '@/lib/jobwatch/format';
import { SOURCE_CODES, SOURCE_LABELS } from '@/lib/jobwatch/sources';
import type { Job, JobStateEntry } from '@/lib/jobwatch/types';
import { HideIcon } from './icons';
import styles from '../jobwatch.module.css';

type Props = {
  job: Job;
  selected: boolean;
  isNew: boolean;
  entry: JobStateEntry | undefined;
  /** Precomputed match reasoning — a plain string, so `memo` still bites. */
  reason: string;
  /** Set on the Applied tab, where the stamp matters more than the posting date. */
  appliedAt?: number;
  onSelect: (id: string) => void;
  onUnapply?: (id: string) => void;
  /** Open tab only: takes it off the list and asks why. */
  onDismiss?: (id: string) => void;
  /** Hidden view only: the way back, without opening the posting first. */
  onRestore?: (id: string) => void;
};

/**
 * One posting in the list. Memoized because the list runs to a couple of
 * thousand rows across a full watchlist, and typing in the search box would
 * otherwise re-render every one of them on each keystroke.
 */
function JobRow({
  job, selected, isNew, entry, reason, appliedAt,
  onSelect, onUnapply, onDismiss, onRestore,
}: Props) {
  const isApplied = entry?.applied ?? false;
  // Only two values reach a row: anything non-US was dropped in `filterJobs`.
  const locationUnconfirmed = usEligibility(job.location) === 'unconfirmed';

  return (
    <div className={styles.row} data-selected={selected} data-hidden={entry?.hidden === true}>
      <span className={styles.rowBar} aria-hidden="true" />

      <button
        type="button"
        className={styles.rowOpen}
        onClick={() => onSelect(job.id)}
        aria-current={selected}
      >
        <span className={styles.rowTop}>
          <span className={styles.rowCompany}>
            <span className={styles.src} title={SOURCE_LABELS[job.source]}>
              {SOURCE_CODES[job.source]}
            </span>
            {job.company}
          </span>
          <span className={styles.rowAge}>
            {!isApplied
              ? timeAgo(job.publishedAt)
              // Marks migrated from the pre-v1 store carry no timestamp, so
              // they say so rather than claiming to be from 1970.
              : appliedAt === undefined
                ? 'applied · date unknown'
                : `applied ${timeAgoFrom(appliedAt)} ago`}
          </span>
        </span>

        <span className={styles.rowTitle}>{job.title}</span>

        {/* Why this surfaced, computed locally from the prefs that let it through. */}
        <span className={styles.reason}>{reason}</span>

        <span className={styles.rowFacts}>
          {/* Only reachable from the Hidden view, where every row carries it —
              which is the point: the badge is what makes an individual row
              legible as hidden once it is out of the list it was removed from.
              With an answer on it the badge says which, because "hidden" is the
              one thing every row in that view already has in common. */}
          {entry?.hidden && (
            <span
              className={`${styles.pill} ${styles.pillHidden}`}
              title={entry.dismissNote || undefined}
            >
              {entry.dismissReason ? REASON_SHORT[entry.dismissReason] : 'no reason given'}
            </span>
          )}
          {isNew && <span className={`${styles.pill} ${styles.pillNew}`}>New</span>}
          {isApplied && <span className={`${styles.pill} ${styles.pillApplied}`}>Applied</span>}

          <span className={styles.pill}>{LEVEL_LABELS[job.level]}</span>
          {job.remote && <span className={`${styles.pill} ${styles.pillRemote}`}>Remote</span>}

          {job.salary && (
            <span
              className={`${styles.pill} ${styles.pillSalary} ${job.salary.estimated ? styles.pillEstimated : ''}`}
              // Two things worth saying on hover, and the verbatim string is the
              // one that got trimmed — see `salaryLabel`. An estimated band was
              // scraped out of the description rather than read from a
              // compensation field, so it still says so.
              title={job.salary.estimated
                ? `${job.salary.text} — parsed from the job description`
                : job.salary.text}
            >
              {salaryLabel(job.salary.text)}
              {job.salary.estimated && '*'}
            </span>
          )}

          <span className={styles.dot}>/</span>
          <span
            className={`${styles.rowLocation} ${locationUnconfirmed ? styles.locationUnconfirmed : ''}`}
            // The posting named no country, so the row says so rather than
            // letting a US-only board imply one.
            title={locationUnconfirmed ? 'No location given — US eligibility unconfirmed' : undefined}
          >
            {job.location}
            {locationUnconfirmed && <span className={styles.unconfirmedMark}>?</span>}
          </span>
        </span>
      </button>

      {onUnapply && (
        <button
          type="button"
          className={`${styles.toggle} ${styles.rowAction}`}
          onClick={() => onUnapply(job.id)}
        >
          Unapply
        </button>
      )}

      {onRestore && (
        <button
          type="button"
          className={`${styles.toggle} ${styles.rowAction}`}
          onClick={() => onRestore(job.id)}
        >
          Restore
        </button>
      )}

      {/* Triage is a scan down the list, so the fastest way out of it has to be
          on the row. Icon-only and quiet until the row is under the pointer:
          spelling "Not relevant" out on every line makes the list read as a
          column of buttons with postings attached. It stays reachable by
          keyboard — see `.rowDismiss`, which reveals on focus. */}
      {onDismiss && (
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.rowDismiss}`}
          onClick={() => onDismiss(job.id)}
          title="Not relevant"
          aria-label={`Mark ${job.title} at ${job.company} not relevant`}
        >
          <HideIcon size={15} />
        </button>
      )}
    </div>
  );
}

export default memo(JobRow);
