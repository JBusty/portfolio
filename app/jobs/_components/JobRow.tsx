'use client';

import { memo } from 'react';
import { LEVEL_LABELS, usEligibility } from '@/lib/jobwatch/classify';
import { timeAgo, timeAgoFrom } from '@/lib/jobwatch/format';
import { SOURCE_CODES, SOURCE_LABELS } from '@/lib/jobwatch/sources';
import type { Job, JobStateEntry } from '@/lib/jobwatch/types';
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
};

/**
 * One posting in the list. Memoized because the list runs to a couple of
 * thousand rows across a full watchlist, and typing in the search box would
 * otherwise re-render every one of them on each keystroke.
 */
function JobRow({ job, selected, isNew, entry, reason, appliedAt, onSelect, onUnapply }: Props) {
  const isApplied = entry?.applied ?? false;
  // Only two values reach a row: anything non-US was dropped in `filterJobs`.
  const locationUnconfirmed = usEligibility(job.location) === 'unconfirmed';

  return (
    <div className={styles.row} data-selected={selected}>
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
          {isNew && <span className={`${styles.pill} ${styles.pillNew}`}>New</span>}
          {isApplied && <span className={`${styles.pill} ${styles.pillApplied}`}>Applied</span>}

          <span className={styles.pill}>{LEVEL_LABELS[job.level]}</span>
          {job.remote && <span className={`${styles.pill} ${styles.pillRemote}`}>Remote</span>}

          {job.salary && (
            <span
              className={`${styles.pill} ${styles.pillSalary} ${job.salary.estimated ? styles.pillEstimated : ''}`}
              // An estimated band was scraped out of the description rather than
              // read from a compensation field, so it says so on hover.
              title={job.salary.estimated ? 'Parsed from the job description' : undefined}
            >
              {job.salary.text}
              {job.salary.estimated && '*'}
            </span>
          )}

          <span className={styles.dot}>/</span>
          <span
            className={locationUnconfirmed ? styles.locationUnconfirmed : undefined}
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
    </div>
  );
}

export default memo(JobRow);
