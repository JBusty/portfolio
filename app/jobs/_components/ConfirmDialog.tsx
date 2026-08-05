'use client';

import { useEffect, useRef } from 'react';
import styles from '../jobwatch.module.css';

/**
 * A confirm step for actions that can't be undone.
 *
 * Built on <dialog> with showModal() rather than a div with a high z-index:
 * focus trapping, restoring focus to whatever opened it, Escape, inertness of
 * the page behind, and the backdrop are all things the element already does
 * correctly and a hand-rolled overlay usually gets subtly wrong.
 */
type Props = {
  open: boolean;
  title: string;
  /** What is lost, in plain terms. The dialog is only worth showing if it says. */
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open, title, body, confirmLabel, onConfirm, onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Guarded both ways: calling showModal on an open dialog throws.
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      // Fires for Escape and for close() alike, so cancelling has one path.
      onClose={onCancel}
      // The backdrop is part of the dialog's own box, so a click that lands on
      // the element itself rather than on the card inside it is a click outside.
      onClick={(e) => { if (e.target === ref.current) onCancel(); }}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
    >
      <div className={styles.dialogCard}>
        <h2 id="confirm-title" className={styles.dialogTitle}>{title}</h2>
        <p id="confirm-body" className={styles.dialogBody}>{body}</p>

        <div className={styles.dialogActions}>
          {/* Cancel takes focus: the safe choice should be the one a reflexive
              Enter lands on. */}
          <button type="button" className={styles.toggle} onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button type="button" className={styles.dialogDanger} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
