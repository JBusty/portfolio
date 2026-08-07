'use client';

import { useMemo } from 'react';
import Mark from '@/components/Mark';
import { LEVEL_LABELS } from '@/lib/jobwatch/classify';
import { REASON_SHORT } from '@/lib/jobwatch/feedback';
import { salaryLabel, timeAgo, timeAgoFrom } from '@/lib/jobwatch/format';
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
  onDismiss: (id: string) => void;
  onRestore: (id: string) => void;
  onClose: () => void;
};

export default function JobDetail({
  job, entry, reason, description, onApply, onUnapply, onDismiss, onRestore, onClose,
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
      {/* A sibling of the head rather than its first line, which is what lets it
          pin. Below the split this pane is a sheet over the list and the only
          way out of it is this button, so it has to still be there four screens
          into a long write-up — and `position: sticky` is scoped to the
          containing block, which as part of the head would have scrolled away
          with it. */}
      <div className={styles.detailTop}>
        <span className={styles.rowCompany}>
          <span className={styles.src} title={SOURCE_LABELS[job.source]}>
            {SOURCE_CODES[job.source]}
          </span>
          {job.company} · {SOURCE_LABELS[job.source]}
        </span>
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.detailClose}`}
          onClick={onClose}
          aria-label="Close posting"
        >
          <CloseIcon size={15} />
        </button>
      </div>

      <div className={styles.detailHead}>
        <h2 className={styles.detailTitle}>{job.title}</h2>
        <p className={styles.reason}>{reason}</p>

        <div className={styles.detailFacts}>
          <span className={styles.pill}>{LEVEL_LABELS[job.level]}</span>
          {job.remote && <span className={`${styles.pill} ${styles.pillRemote}`}>Remote</span>}
          <span className={styles.pill}>{job.location}</span>
          {job.team && <span className={styles.pill}>{job.team}</span>}
          {salary && (
            <span
              className={`${styles.pill} ${styles.pillSalary} ${salary.estimated ? styles.pillEstimated : ''}`}
              title={salary.text}
            >
              {salaryLabel(salary.text)}
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
          {/* Your own answer, played back. The reason is the one thing on this
              pane that came from you rather than from the board, and it is the
              reason the posting is not on the list — so reading it back is what
              makes "Put it back" a considered press rather than a guess. */}
          {entry?.hidden && (
            <span className={`${styles.pill} ${styles.pillHidden}`}>
              {entry.dismissNote
                ? `Not relevant · ${entry.dismissNote}`
                : entry.dismissReason
                  ? `Not relevant · ${REASON_SHORT[entry.dismissReason]}`
                  : 'Not relevant'}
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

          {/* Not a toggle any more. Going out and coming back are two different
              acts now — one asks a question and records an answer, the other
              retracts it — and a single pressed-state button cannot say that,
              because "press again to undo" is exactly what it implies. */}
          {entry?.hidden ? (
            <>
              <button type="button" className={styles.toggle} onClick={() => onRestore(job.id)}>
                <CheckIcon />
                Put it back
              </button>
              {/* The way back to a question that was skipped. Dismissing from
                  the list is a press and a glance away, so skipping is the
                  common case rather than a lapse — and without this the answer
                  could only ever be given in the second it was first asked. */}
              {!entry.dismissReason && (
                <button type="button" className={styles.toggle} onClick={() => onDismiss(job.id)}>
                  Say why
                </button>
              )}
            </>
          ) : (
            <button type="button" className={styles.toggle} onClick={() => onDismiss(job.id)}>
              <HideIcon />
              Not relevant
            </button>
          )}
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
