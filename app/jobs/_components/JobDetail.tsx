'use client';

import { useMemo } from 'react';
import Mark from '@/components/Mark';
import { LEVEL_LABELS } from '@/lib/jobwatch/classify';
import { timeAgo, timeAgoFrom } from '@/lib/jobwatch/format';
import { sanitizeHtml } from '@/lib/jobwatch/html';
import { hasDescriptionEndpoint, SOURCE_CODES, SOURCE_LABELS } from '@/lib/jobwatch/sources';
import type { Job, JobStateEntry } from '@/lib/jobwatch/types';
import type { DescriptionEntry } from './useJobwatch';
import { CheckIcon, CloseIcon, HideIcon } from './icons';
import styles from '../jobwatch.module.css';

type Props = {
  job: Job | null;
  entry: JobStateEntry | undefined;
  reason: string;
  /** Greenhouse descriptions arrive on open — see `loadDescription`. */
  description: DescriptionEntry | undefined;
  onApply: (job: Job) => void;
  onUnapply: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onClose: () => void;
};

export default function JobDetail({
  job, entry, reason, description, onApply, onUnapply, onToggleHidden, onClose,
}: Props) {
  const raw = description?.html || job?.descriptionHtml || '';

  // Sanitizing is the expensive part of opening a posting — some descriptions
  // are hundreds of KB — so it is keyed to the markup rather than the render.
  const html = useMemo(() => sanitizeHtml(raw), [raw]);

  if (!job) {
    return (
      <div className={`${styles.detail} ${styles.detailClosed}`}>
        <div className={styles.empty}>
          <span className={styles.emptyTitle}>Nothing selected</span>
          <p className={styles.emptyBody}>Pick a posting from the list to read it here.</p>
        </div>
      </div>
    );
  }

  const applied = entry?.applied ?? false;

  /**
   * Three different reasons the panel can come up empty, and they deserve
   * different words. Either the write-up never reaches us — no detail route on
   * the board, or the index dropped it and there is nothing to re-fetch — or we
   * asked for it and the request failed, or we asked and the posting genuinely
   * has no body. Only the middle one is a problem on our end.
   */
  const askable = hasDescriptionEndpoint(job.source);
  // `undefined` means the fetch effect hasn't fired yet — one render, but long
  // enough to flash the wrong message if it were treated as an answer.
  const pending = askable && (description === undefined || description.status === 'loading');
  // Greenhouse publishes no compensation field, so any band is in the prose —
  // which only arrives with the description.
  const salary = job.salary ?? description?.salary ?? null;

  const posted = job.publishedAt
    ? new Date(job.publishedAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : 'Date not published';

  return (
    <div className={styles.detail}>
      <div className={styles.detailHead}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <span className={styles.rowCompany}>
            <span className={styles.src} title={SOURCE_LABELS[job.source]}>
              {SOURCE_CODES[job.source]}
            </span>
            {job.company} · {SOURCE_LABELS[job.source]}
          </span>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close posting">
            <CloseIcon size={15} />
          </button>
        </div>

        <h2 className={styles.detailTitle}>{job.title}</h2>
        <p className={styles.reason}>{reason}</p>

        <div className={styles.detailFacts}>
          <span className={styles.pill}>{LEVEL_LABELS[job.level]}</span>
          {job.remote && <span className={`${styles.pill} ${styles.pillRemote}`}>Remote</span>}
          <span className={styles.pill}>{job.location}</span>
          {job.team && <span className={styles.pill}>{job.team}</span>}
          {salary && (
            <span className={`${styles.pill} ${styles.pillSalary} ${salary.estimated ? styles.pillEstimated : ''}`}>
              {salary.text}
              {salary.estimated && ' (estimated)'}
            </span>
          )}
          <span className={styles.pill}>
            {posted} · {timeAgo(job.publishedAt)} old
          </span>
          {applied && (
            <span className={`${styles.pill} ${styles.pillApplied}`}>
              {entry?.appliedAt
                ? `Applied ${timeAgoFrom(entry.appliedAt)} ago`
                : 'Applied · date unknown'}
            </span>
          )}
        </div>

        <div className={styles.detailActions}>
          {job.url ? (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn">
              Open posting
              <Mark dir="out" />
            </a>
          ) : (
            <span className={styles.fieldHint}>No link on record</span>
          )}

          <button
            type="button"
            className={styles.toggle}
            data-active={applied}
            onClick={() => (applied ? onUnapply(job.id) : onApply(job))}
            aria-pressed={applied}
          >
            <CheckIcon />
            {applied ? 'Unapply' : 'Mark applied'}
          </button>

          <button
            type="button"
            className={styles.toggle}
            data-active={entry?.hidden === true}
            onClick={() => onToggleHidden(job.id)}
            aria-pressed={entry?.hidden === true}
          >
            <HideIcon />
            {entry?.hidden ? 'Hidden' : 'Hide'}
          </button>
        </div>
      </div>

      {html ? (
        // Third-party markup, run through an allowlist sanitizer first.
        <div className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />
      ) : pending ? (
        <div className={styles.empty}>
          <span className={styles.emptyTitle}>Loading the posting…</span>
        </div>
      ) : description?.status === 'error' ? (
        <div className={styles.empty}>
          <span className={styles.emptyTitle}>Couldn’t load the description</span>
          <p className={styles.emptyBody}>
            {description.error ?? 'The request didn’t come back'}. Open the posting and
            you’ll get it straight from the source.
          </p>
        </div>
      ) : askable ? (
        <div className={styles.empty}>
          <span className={styles.emptyTitle}>No write-up on this one</span>
          <p className={styles.emptyBody}>
            {job.company} listed the role without a description. Worth opening the posting
            anyway — sometimes one turns up there later.
          </p>
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyTitle}>Description lives on the posting</span>
          <p className={styles.emptyBody}>
            {SOURCE_LABELS[job.source]} postings only reach us as listing details — the
            write-up stays on the posting page. Open it and it’s all there.
          </p>
        </div>
      )}
    </div>
  );
}
