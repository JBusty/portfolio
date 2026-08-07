'use client';

/**
 * The preferences editor: a collapsible panel that sits above the results
 * rather than a modal, so you can watch the count move as you flip things.
 *
 * Every control writes straight through to prefs, which only ever re-filter
 * what has already been fetched — nothing in here triggers a network call.
 */

import { useState, type KeyboardEvent, type Ref } from 'react';
import { LEVEL_LABELS, LEVEL_ORDER } from '@/lib/jobwatch/classify';
import { REASON_SHORT, type DismissalSummary, type Suggestion } from '@/lib/jobwatch/feedback';
import { plural } from '@/lib/jobwatch/format';
import { AGE_STEPS, SALARY_STEPS } from '@/lib/jobwatch/store';
import type { Prefs, SortBy } from '@/lib/jobwatch/types';
import { CloseIcon } from './icons';
import styles from '../jobwatch.module.css';

type Props = {
  prefs: Prefs;
  shown: number;
  total: number;
  /** What has been marked not relevant, and why. */
  feedback: DismissalSummary;
  /** The changes those reasons point at. Empty until a few agree. */
  suggestions: Suggestion[];
  onChange: (patch: Partial<Prefs>) => void;
  onReset: () => void;
  /** So the page can tell a press inside the panel from one that dismisses it. */
  ref?: Ref<HTMLDivElement>;
};

const SORTS: Array<[SortBy, string]> = [
  ['published', 'Published'],
  ['salary', 'Salary'],
  ['company', 'Company'],
];

/** Add/remove chips for one of the two term lists. */
function TermList({
  label,
  hint,
  terms,
  onChange,
}: {
  label: string;
  hint: string;
  terms: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const term = draft.trim().toLowerCase();
    if (!term || terms.includes(term)) {
      setDraft('');
      return;
    }
    onChange([...terms, term]);
    setDraft('');
  };

  // No <form> anywhere in here, so Enter is wired by hand rather than by submit.
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
  };

  return (
    <div className={styles.field}>
      <span className={styles.groupLabel}>{label}</span>
      <p className={styles.fieldHint}>{hint}</p>

      <div className={styles.group}>
        {terms.map((term) => (
          <span key={term} className={`${styles.pill} ${styles.termChip}`}>
            {term}
            <button
              type="button"
              className={styles.termRemove}
              onClick={() => onChange(terms.filter((t) => t !== term))}
              aria-label={`Remove ${term} from ${label.toLowerCase()}`}
            >
              <CloseIcon size={10} />
            </button>
          </span>
        ))}
        {terms.length === 0 && <span className={styles.fieldHint}>none</span>}
      </div>

      <div className={styles.group} style={{ marginTop: 8 }}>
        <input
          className={styles.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="add a term…"
          aria-label={`Add ${label.toLowerCase()} term`}
          style={{ flex: '1 1 160px' }}
        />
        <button type="button" className={styles.toggle} onClick={add}>Add</button>
      </div>
    </div>
  );
}

/**
 * What you've been dismissing, and the one press that acts on it.
 *
 * This is the return leg of the "not relevant" button. Asking why and then
 * filing the answer where nobody sees it is a survey; the point of collecting
 * it is that a dozen dismissals for the same reason are a filter that is wrong,
 * and this is the panel where filters get changed — so the evidence and the fix
 * are in front of each other.
 *
 * Nothing here applies itself. Every suggestion is read off a pattern in
 * postings you rejected, and a pattern is not the same as an intention: the
 * button says exactly which setting moves, and it moves when it is pressed.
 */
function Feedback({
  feedback,
  suggestions,
  onChange,
}: {
  feedback: DismissalSummary;
  suggestions: Suggestion[];
  onChange: (patch: Partial<Prefs>) => void;
}) {
  const { total, answered, tallies } = feedback;

  return (
    <div className={styles.field}>
      <span className={styles.groupLabel}>Not relevant</span>
      <p className={styles.fieldHint}>
        {total === 0
          ? 'Mark a posting not relevant and the reason you give turns up here, as the setting it points at.'
          : answered === 0
            ? `${total} ${plural(total, 'posting')} dismissed, none with a reason. The reasons are what tell this list what to stop showing you.`
            : `${answered} of ${total} dismissed ${plural(total, 'posting')} came with a reason.`}
      </p>

      {tallies.length > 0 && (
        <div className={styles.group}>
          {tallies.map(({ reason, count }) => (
            <span key={reason} className={`${styles.pill} ${styles.tallyChip}`}>
              {REASON_SHORT[reason]}
              <span className={styles.tallyCount}>{count}</span>
            </span>
          ))}
        </div>
      )}

      {suggestions.map((suggestion) => (
        <div key={suggestion.key} className={styles.suggestion}>
          <p className={styles.suggestionWhy}>{suggestion.because}</p>
          <button
            type="button"
            className={styles.toggle}
            onClick={() => onChange(suggestion.patch)}
          >
            {suggestion.label}
          </button>
        </div>
      ))}
    </div>
  );
}

export default function PrefsPanel({
  prefs, shown, total, feedback, suggestions, onChange, onReset, ref,
}: Props) {
  /** Stored as the empty list — see `Prefs.levels`. */
  const everyLevel = prefs.levels.length === 0;

  return (
    <div className={styles.panel} ref={ref}>
      <div className={`${styles.wrap} ${styles.panelInner}`}>
        <div className={styles.panelHead}>
          <span className={styles.groupLabel}>Preferences</span>
          <span className={styles.showing}>
            showing <strong>{shown}</strong> of {total}
          </span>
          <button type="button" className={styles.toggle} onClick={onReset}>
            Reset to defaults
          </button>
        </div>

        <div className={styles.panelGrid}>
          {/* ---- seniority ----
              One row of chips, same language as every other toggle in here.
              This was two selects and a "to" — a min and a max that had to be
              kept from crossing — which is a lot of apparatus for six values
              where any band is just a selection you could have clicked. */}
          <div className={styles.field}>
            <span className={styles.groupLabel}>Seniority</span>
            <p className={styles.fieldHint}>
              {everyLevel
                ? 'Job types match on wording alone, which is loose enough to reach a Director posting from a senior search — this is what keeps it out.'
                : `Showing ${prefs.levels.length} of ${LEVEL_ORDER.length}.`}
            </p>
            <div className={styles.group}>
              {/* An explicit All rather than six chips that light up together.
                  "Nothing selected" and "everything selected" are the same list,
                  but only one of them is a thing you can point at — and having
                  the six read as on while none were actually chosen meant the
                  row looked identical whether you had picked all six or none. */}
              <button
                type="button"
                className={styles.toggle}
                data-active={everyLevel}
                onClick={() => onChange({ levels: [] })}
                aria-pressed={everyLevel}
              >
                All
              </button>

              {LEVEL_ORDER.map((level) => {
                const on = prefs.levels.includes(level);
                return (
                  <button
                    key={level}
                    type="button"
                    className={styles.toggle}
                    data-active={on}
                    // Turning the last one off lands on the empty list, which is
                    // All — so the row can never end up selecting nothing and
                    // showing nothing.
                    onClick={() => onChange({
                      levels: on
                        ? prefs.levels.filter((l) => l !== level)
                        // Stored in LEVEL_ORDER, never click order, so the value
                        // is stable and comparing two of them is a plain equal.
                        : LEVEL_ORDER.filter((l) => l === level || prefs.levels.includes(l)),
                    })}
                    aria-pressed={on}
                  >
                    {LEVEL_LABELS[level]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---- terms ---- */}
          <TermList
            label="Exclude"
            hint="Any title containing one of these is dropped. Every posting is already filtered to design roles, so this is for trimming what&rsquo;s left."
            terms={prefs.exclude}
            onChange={(exclude) => onChange({ exclude })}
          />

          {/* ---- pay ---- */}
          <div className={styles.field}>
            <span className={styles.groupLabel}>Pay</span>
            <p className={styles.fieldHint}>
              Two thirds of postings publish no number. Keep unlisted on unless you
              mean it.
            </p>
            <div className={styles.group}>
              <select
                className={styles.select}
                value={prefs.salaryFloor ?? ''}
                onChange={(e) =>
                  onChange({ salaryFloor: e.target.value ? Number(e.target.value) : null })
                }
                aria-label="Minimum salary"
              >
                {SALARY_STEPS.map(([value, label]) => (
                  <option key={label} value={value ?? ''}>{label}</option>
                ))}
              </select>
              <button
                type="button"
                className={styles.toggle}
                data-active={prefs.includeUnlistedSalary}
                onClick={() => onChange({ includeUnlistedSalary: !prefs.includeUnlistedSalary })}
                aria-pressed={prefs.includeUnlistedSalary}
              >
                Keep unlisted pay
              </button>
            </div>
          </div>

          {/* ---- age ---- */}
          <div className={styles.field}>
            <span className={styles.groupLabel}>Age</span>
            <p className={styles.fieldHint}>
              From when Jobwatch first saw it, falling back to the board&rsquo;s own date
              for anything that was already there on the first sync.
            </p>
            <select
              className={styles.select}
              value={prefs.maxAgeDays ?? ''}
              onChange={(e) =>
                onChange({ maxAgeDays: e.target.value ? Number(e.target.value) : null })
              }
              aria-label="Maximum age"
            >
              {AGE_STEPS.map(([value, label]) => (
                <option key={label} value={value ?? ''}>{label}</option>
              ))}
            </select>
          </div>

          {/* ---- sort ---- */}
          <div className={styles.field}>
            <span className={styles.groupLabel}>Sort</span>
            <p className={styles.fieldHint}>
              Salary sorts on the low end. No number always lands at the bottom.
            </p>
            <div className={styles.group}>
              <select
                className={styles.select}
                value={prefs.sortBy}
                onChange={(e) => onChange({ sortBy: e.target.value as SortBy })}
                aria-label="Sort by"
              >
                {SORTS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button
                type="button"
                className={styles.toggle}
                onClick={() => onChange({ sortDir: prefs.sortDir === 'desc' ? 'asc' : 'desc' })}
              >
                {prefs.sortDir === 'desc' ? 'Descending' : 'Ascending'}
              </button>
            </div>
          </div>

          {/* ---- feedback ----
              Last in the grid on purpose: it is the only field here that is not
              a control, and it reads as a summing-up of the five above it
              rather than a sixth thing to set. */}
          <Feedback feedback={feedback} suggestions={suggestions} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
