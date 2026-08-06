'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { DISMISS_REASON_SPECS } from '@/lib/jobwatch/feedback';
import { NOTE_LIMIT } from '@/lib/jobwatch/store';
import type { DismissReason, Job } from '@/lib/jobwatch/types';
import styles from '../jobwatch.module.css';

/**
 * The question after the button.
 *
 * The posting is already gone by the time this opens — pressing "Not relevant"
 * removes it, and this only decides whether the removal teaches the search
 * anything. That ordering is the whole design: a dialog standing between you
 * and a list you are trying to clear gets answered at random within a dozen
 * postings, and random answers are worse than none, because everything
 * downstream of them proposes changing your filters.
 *
 * So: one press to answer, Escape to skip, and nothing lost either way.
 */
type Props = {
  /** The posting being asked about; null closes it. */
  job: Job | null;
  onAnswer: (reason: DismissReason, note?: string) => void;
  onSkip: () => void;
};

export default function DismissDialog({ job, onAnswer, onSkip }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState('');

  const open = job != null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Guarded both ways: showModal throws on an already-open dialog.
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // A note left in the box from the last posting would be attached to the next
  // one, which is the kind of thing you only notice weeks later in the counts.
  useEffect(() => { if (open) setNote(''); }, [open, job?.id]);

  const submitNote = () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    onAnswer('other', trimmed);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // No <form> in here, so Enter is wired by hand — same as the term inputs.
    if (e.key === 'Enter') { e.preventDefault(); submitNote(); }
  };

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${styles.dialogWide}`}
      // Fires for Escape and for close() alike. Answering also lands here, one
      // tick after the answer has been written — `onSkip` only clears the
      // pending posting, so arriving twice costs nothing.
      onClose={onSkip}
      onClick={(e) => { if (e.target === ref.current) onSkip(); }}
      aria-labelledby="dismiss-title"
      aria-describedby="dismiss-body"
    >
      <div className={styles.dialogCard}>
        <h2 id="dismiss-title" className={styles.dialogTitle}>Why isn’t this one right?</h2>
        <p id="dismiss-body" className={styles.dialogBody}>
          {job
            ? `${job.title} at ${job.company} is off the list either way. This only tunes what turns up next.`
            : ''}
        </p>

        {/* `why`, not `reason`: a reason on a row is already the line saying
            what let a posting through, and these are the opposite of that. */}
        <div className={styles.whyGrid}>
          {DISMISS_REASON_SPECS.filter((spec) => spec.id !== 'other').map((spec) => (
            <button
              key={spec.id}
              type="button"
              className={styles.whyBtn}
              onClick={() => onAnswer(spec.id)}
            >
              <span className={styles.whyLabel}>{spec.label}</span>
              <span className={styles.whyHint}>{spec.hint}</span>
            </button>
          ))}
        </div>

        {/* "Something else" is a field rather than an eighth chip: an `other`
            with nothing attached is a dismissal that counts toward no setting,
            which is what skipping already does more honestly. */}
        <div className={styles.whyNote}>
          <input
            className={styles.input}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={NOTE_LIMIT}
            placeholder="Something else…"
            aria-label="Another reason, in your own words"
          />
          <button
            type="button"
            className={styles.toggle}
            onClick={submitNote}
            disabled={note.trim() === ''}
          >
            Save
          </button>
        </div>

        <div className={styles.dialogActions}>
          {/* Skipping is the safe choice and takes focus, the same way Cancel
              does in the confirm dialog — but here it forfeits nothing except
              the answer, because the posting is already gone. */}
          <button type="button" className={styles.toggle} onClick={onSkip} autoFocus>
            Skip
          </button>
        </div>
      </div>
    </dialog>
  );
}
