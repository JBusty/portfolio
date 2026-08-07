'use client';

import { useRef, useState } from 'react';
import styles from '../jobwatch.module.css';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  /**
   * Terms the boards have not been searched for yet — the one thing about this
   * control that is not obvious. Narrowing takes effect instantly because those
   * postings are already indexed; a new term reaches the boards only on a
   * sweep, and until then it can only match what is already in hand.
   */
  unswept: string[];
  sweeping: boolean;
  /** Result of the last sweep, or the reason it failed. */
  sweepNote: string | null;
  onSweep: () => void;
  /**
   * Sweeping costs fifteen thousand outbound requests, so the route refuses it
   * without an account — see `authorized` in the refresh route. Without this the
   * button is still here for anonymous visitors, still pressable, and answers
   * every press with a 401 in the console and "Unauthorized" under the field:
   * a control that exists only to fail.
   */
  canSweep: boolean;
};

/**
 * The job types the sweep goes looking for.
 *
 * A chip field rather than a comma-separated text box: the terms are matched
 * independently, so they should look independent and be removable one at a
 * time. A single string would also make "product design, ux" ambiguous about
 * whether the comma is a separator or part of a title.
 *
 * Terms are stored lowercase because matching is case-insensitive — keeping the
 * casing someone typed would only produce two chips that behave identically.
 */
export default function JobTypesInput({
  value, onChange, unswept, sweeping, sweepNote, onSweep, canSweep,
}: Props) {
  // Only worth flagging as pending when it can actually be acted on.
  const pending = canSweep && unswept.length > 0;

  /**
   * Names a few and counts the rest.
   *
   * Listing them all is unreadable at the sizes this reaches once somebody has
   * built a real search — a dozen job types set inline is a paragraph, not a
   * hint. Three is enough to make the warning concrete; the tooltip carries the
   * full list.
   */
  const named = unswept.slice(0, 3).join(', ');
  const rest = unswept.length - 3;

  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /** Splits on commas too, so pasting a list works as well as typing one. */
  const commit = (raw: string) => {
    const added = raw
      .split(',')
      .map((term) => term.trim().toLowerCase())
      .filter(Boolean);

    if (added.length > 0) {
      const next = [...value];
      for (const term of added) if (!next.includes(term)) next.push(term);
      if (next.length !== value.length) onChange(next);
    }
    setDraft('');
  };

  const remove = (term: string) => onChange(value.filter((t) => t !== term));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      // Enter would submit anything this is ever nested in; the comma would
      // otherwise land in the field it was meant to end.
      e.preventDefault();
      commit(draft);
      return;
    }
    // Backspace on an empty field takes the last chip — the convention every
    // token field has, and the only way to correct a typo without the mouse.
    if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className={styles.types}>
      <span className={styles.typesLabel} id="jobtypes-label">watching for</span>

      {/* Sweep sits beside the field, not in the filter bar below it. The bar
          reshapes what is already on screen; this goes back out to the boards,
          and what it goes looking for is exactly the terms next to it. */}
      <div className={styles.typesRow}>
        <div
          className={styles.typesField}
          // Clicking the padding focuses the field, the way a real input
          // behaves. Guarded to the container itself so it can't steal a
          // chip's remove button.
          onClick={(e) => { if (e.target === e.currentTarget) inputRef.current?.focus(); }}
        >
          {value.map((term) => (
            <span key={term} className={styles.typeChip}>
              {term}
              <button
                type="button"
                className={styles.typeChipX}
                onClick={() => remove(term)}
                aria-label={`Stop watching for ${term}`}
              >
                ×
              </button>
            </span>
          ))}

          <input
            ref={inputRef}
            className={styles.typesInput}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            // Losing what was typed because focus moved is the standard way
            // these fields annoy people.
            onBlur={() => commit(draft)}
            // Short once there are chips, so it fits on the end of their last
            // row rather than forcing a line of its own.
            placeholder={value.length === 0 ? 'Any title — add one to narrow' : 'Add…'}
            aria-labelledby="jobtypes-label"
            aria-describedby={pending ? 'jobtypes-unswept' : undefined}
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        <button
          type="button"
          className={styles.typesSweep}
          onClick={onSweep}
          disabled={sweeping || !canSweep}
          aria-busy={sweeping}
          // Filled only when there is a term the boards have not been asked
          // about. Everything else — narrowing, removing, reordering — is
          // already answered by what is indexed, and a button lit for those is
          // a button you learn to ignore.
          data-urgent={pending && !sweeping}
          title={!canSweep
            ? 'Sign in to send these terms back out to the boards'
            : pending
              ? `Not yet searched for: ${unswept.join(', ')}`
              : 'Re-check a third of the boards for these terms'}
        >
          {sweeping ? 'Sweeping…' : 'Sweep'}
        </button>
      </div>

      {/* Below the field, because it is a sentence about what just happened or
          what to do next — not a control. The unswept warning outranks the last
          result: it is the one that asks you to act. */}
      {pending ? (
        <p className={styles.typesHint} id="jobtypes-unswept" role="status">
          {/* Names them. "Something changed, press the button" is what the old
              version said, and it said it constantly. */}
          Not searched for yet: <strong>{named}</strong>
          {rest > 0 && ` and ${rest} more`} — sweep to look.
        </p>
      ) : sweepNote ? (
        <p className={styles.typesNote} role="status">{sweepNote}</p>
      ) : null}
    </div>
  );
}
