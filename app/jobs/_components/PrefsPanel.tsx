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
import type { Level, Prefs, SortBy } from '@/lib/jobwatch/types';
import { CloseIcon } from './icons';
import styles from '../jobwatch.module.css';

type Props = {
  prefs: Prefs;
  shown: number;
  total: number;
  onChange: (patch: Partial<Prefs>) => void;
  onReset: () => void;
  /** So the page can tell a press inside the panel from one that dismisses it. */
  ref?: Ref<HTMLDivElement>;
};

const SALARY_STEPS: Array<[number | null, string]> = [
  [null, 'Any'],
  [150_000, '$150k+'],
  [180_000, '$180k+'],
  [200_000, '$200k+'],
  [250_000, '$250k+'],
];

const AGE_STEPS: Array<[number | null, string]> = [
  [null, 'Any age'],
  [1, 'Last 24h'],
  [3, 'Last 3 days'],
  [7, 'Last week'],
  [14, 'Last 2 weeks'],
  [30, 'Last month'],
];

const SORTS: Array<[SortBy, string]> = [
  ['firstSeen', 'First seen'],
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

export default function PrefsPanel({ prefs, shown, total, onChange, onReset, ref }: Props) {
  const setLevel = (level: Level) =>
    onChange({ levels: { ...prefs.levels, [level]: !prefs.levels[level] } });

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
          {/* ---- levels ---- */}
          <div className={styles.field}>
            <span className={styles.groupLabel}>Levels</span>
            <p className={styles.fieldHint}>
              Independent switches, not a floor. All off means no level filter.
            </p>
            <div className={styles.group}>
              {LEVEL_ORDER.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={styles.toggle}
                  data-active={prefs.levels[level]}
                  onClick={() => setLevel(level)}
                  aria-pressed={prefs.levels[level]}
                >
                  {LEVEL_LABELS[level]}
                </button>
              ))}
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
        </div>
      </div>
    </div>
  );
}
