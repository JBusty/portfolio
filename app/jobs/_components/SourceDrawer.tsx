'use client';

import { useState, type KeyboardEvent } from 'react';
import { clockTime, plural } from '@/lib/jobwatch/format';
import { SOURCE_CODES, SOURCE_LABELS } from '@/lib/jobwatch/sources';
import type { Company, CompanyResult, SourceKind } from '@/lib/jobwatch/types';
import { TrashIcon } from './icons';
import styles from '../jobwatch.module.css';

type Props = {
  companies: Company[];
  results: Record<string, CompanyResult>;
  onAdd: (source: SourceKind, token: string, label?: string) => { ok: boolean; message: string };
  onRemove: (key: string) => void;
};

const STATUS_CLASS: Record<string, string> = {
  ok: styles.statusOk,
  error: styles.statusError,
  loading: styles.statusLoading,
};

export default function SourceDrawer({ companies, results, onAdd, onRemove }: Props) {
  const [source, setSource] = useState<SourceKind>('greenhouse');
  const [token, setToken] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  function submit() {
    const result = onAdd(source, token, label);
    setError(result.ok ? '' : result.message);
    if (result.ok) {
      setToken('');
      setLabel('');
    }
  }

  // Deliberately not a <form>: nothing here needs a submit event, and a form on
  // a page with this many controls only adds ways to reload it by accident.
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  };

  return (
    <div className={styles.drawer}>
      <div className={`${styles.wrap} ${styles.drawerInner}`}>
        <div className={styles.groupLabel}>
          Watchlist — {companies.length} {plural(companies.length, 'board')}
        </div>

        <div className={styles.sourceGrid}>
          {companies.map((c) => {
            const r = results[c.key];
            const status = r?.status ?? 'idle';
            const count = r?.jobs.length ?? 0;
            // A board that answers cleanly with nothing on it is the ambiguous
            // case — a revoked token and a hiring freeze look identical from
            // here. Flagging it is the only way to tell you to go and look.
            const empty = status === 'ok' && count === 0;

            return (
              <div key={c.key} className={styles.sourceCard} data-empty={empty}>
                <span
                  className={`${styles.statusDot} ${STATUS_CLASS[status] ?? ''}`}
                  aria-hidden="true"
                />
                <div className={styles.sourceInfo}>
                  <div className={styles.sourceName}>{c.label}</div>
                  <div
                    className={`${styles.sourceMeta} ${status === 'error' ? styles.sourceMetaError : ''}`}
                    title={r?.error ?? undefined}
                  >
                    <span className={styles.src} title={SOURCE_LABELS[c.source]}>
                      {SOURCE_CODES[c.source]}
                    </span>
                    {status === 'error'
                      ? r?.error
                      : status === 'loading'
                        ? 'loading…'
                        : empty
                          ? `0 roles · ${clockTime(r?.fetchedAt ?? null)} · check the token`
                          : `${count} open · ${clockTime(r?.fetchedAt ?? null)}`}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => onRemove(c.key)}
                  aria-label={`Remove ${c.label} from watchlist`}
                >
                  <TrashIcon />
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.addRow}>
          <select
            className={styles.select}
            value={source}
            onChange={(e) => setSource(e.target.value as SourceKind)}
            aria-label="Job board platform"
          >
            <option value="greenhouse">Greenhouse</option>
            <option value="lever">Lever</option>
            <option value="ashby">Ashby</option>
          </select>

          <input
            className={styles.input}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="board token — e.g. figma"
            aria-label="Board token"
            style={{ flex: '1 1 200px' }}
          />

          <input
            className={styles.input}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="display name (optional)"
            aria-label="Display name"
            style={{ flex: '0 1 160px' }}
          />

          <button type="button" className="btn ghost" onClick={submit}>Add board</button>
          {error && (
            <span className={styles.sourceMetaError} style={{ fontSize: 12 }} role="alert">
              {error}
            </span>
          )}
        </div>

        <p className={styles.hint}>
          The token is the company&rsquo;s slug in its careers URL:{' '}
          <code>boards.greenhouse.io/<strong>figma</strong></code>,{' '}
          <code>jobs.lever.co/<strong>matchgroup</strong></code>,{' '}
          <code>jobs.ashbyhq.com/<strong>ramp</strong></code>. All three APIs are public and
          CORS-open, so this runs entirely in your browser — nothing is sent anywhere.
        </p>
      </div>
    </div>
  );
}
