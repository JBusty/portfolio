'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import Link from 'next/link';
import Mark from '@/components/Mark';
import ScaledCanvas from './ScaledCanvas';
import SlideView from './SlideView';
import {
  DEEP_DIVE_PATH,
  actsFor,
  allSlides,
  countPlaceholders,
  isPlaceholder,
  positionLabel,
  slideLabel,
  stepsFor,
} from '@/lib/deepDive';
import type { Deck } from '@/lib/deepDive/types';
import p from './player.module.css';

/**
 * Only while building the deck: in production the overview is something you
 * open in front of the room, and "shrunk to 88%" is not for them.
 */
const SHOW_FIT = process.env.NODE_ENV !== 'production';

/**
 * Every slide at once, grouped by act, with backup at the end. For the moment
 * someone asks about a slide from ten minutes ago: open this, find it, press
 * Enter.
 *
 * It doubles as the writing checklist — each thumbnail says how many prompts
 * are still unfilled, and in development, whether its copy had to shrink.
 */
export function Overview({
  deck,
  index,
  onPick,
  onClose,
}: {
  deck: Deck;
  index: number;
  onPick: (index: number) => void;
  onClose: () => void;
}) {
  const slides = allSlides(deck);
  const acts = actsFor(deck.slides);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const remaining = countPlaceholders(deck);
  const backupCount = deck.appendix?.length ?? 0;
  const [fits, setFits] = useState<Record<number, number>>({});

  const onFit = useCallback((i: number, scale: number) => {
    setFits((current) => (current[i] === scale ? current : { ...current, [i]: scale }));
  }, []);

  useEffect(() => {
    const current = buttons.current[index];
    current?.focus({ preventScroll: true });
    current?.scrollIntoView({ block: 'center' });
    // Once, on open: the index cannot move while the overview has the keyboard.
  }, []);

  function onKeyDown(e: ReactKeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const els = buttons.current;
    const from = els.findIndex((el) => el === document.activeElement);
    if (from === -1) return;
    e.preventDefault();

    let to = from;
    if (e.key === 'ArrowLeft') to = from - 1;
    else if (e.key === 'ArrowRight') to = from + 1;
    else to = nearestInNextRow(els, from, e.key === 'ArrowDown' ? 1 : -1);
    els[Math.min(els.length - 1, Math.max(0, to))]?.focus();
  }

  const sections = [
    ...acts.map((act) => ({
      key: `act-${act.start}`,
      title: `${act.n ? `${String(act.n).padStart(2, '0')} ` : ''}${act.title ?? 'Opening'}`,
      start: act.start,
      end: act.end,
    })),
    ...(backupCount ? [{ key: 'backup', title: 'Backup', start: deck.slides.length, end: slides.length }] : []),
  ];

  function thumb(i: number) {
    const slide = slides[i];
    const label = slideLabel(slide);
    const toFill = countPlaceholders(slide);
    const fit = fits[i];

    return (
      <li key={slide.id} className={p.thumb} data-current={i === index || undefined}>
        <div className={p.thumbCanvas} aria-hidden inert>
          <ScaledCanvas style={{ position: 'absolute', inset: 0 }}>
            <SlideView
              deck={deck}
              index={i}
              step={stepsFor(slide) - 1}
              onFit={SHOW_FIT ? (scale) => onFit(i, scale) : undefined}
            />
          </ScaledCanvas>
        </div>
        <div className={p.thumbCaption} aria-hidden>
          <span className={p.thumbNum}>{positionLabel(deck, i).padStart(2, '0')}</span>
          <span className={`${p.thumbLabel} ${isPlaceholder(label) ? p.thumbPlaceholder : ''}`}>{label}</span>
        </div>
        {(toFill > 0 || (SHOW_FIT && fit !== undefined && fit < 0.99)) && (
          <div className={p.thumbFlags} aria-hidden>
            {toFill > 0 && <span className={p.flag}>{toFill} to fill</span>}
            {SHOW_FIT && fit !== undefined && fit < 0.99 && (
              <span className={`${p.flag} ${p.flagWarn}`}>Shrunk to {Math.round(fit * 100)}%</span>
            )}
          </div>
        )}
        <button
          ref={(el) => { buttons.current[i] = el; }}
          type="button"
          className={p.thumbButton}
          onClick={() => onPick(i)}
          aria-label={`${i >= deck.slides.length ? 'Backup slide' : 'Slide'} ${positionLabel(deck, i)}: ${label}`}
          aria-current={i === index ? 'true' : undefined}
        />
      </li>
    );
  }

  return (
    <div className={p.overview} role="dialog" aria-modal="true" aria-label="All slides" onKeyDown={onKeyDown}>
      <div className={p.overviewHead}>
        <div>
          <h2 className={p.overviewTitle}>{deck.title}</h2>
          <p className={p.overviewMeta}>
            {deck.slides.length} slides
            {backupCount > 0 && `, ${backupCount} backup`}
            {remaining > 0 && <>, <strong>{remaining} placeholders to fill</strong></>}
          </p>
        </div>
        <div className={p.overviewActions}>
          <Link href={DEEP_DIVE_PATH} className={p.pill}>
            <Mark dir="left" />
            All deep dives
          </Link>
          <a href={`${DEEP_DIVE_PATH}/${deck.slug}/print`} target="_blank" rel="noopener" className={p.pill}>
            Save as PDF
          </a>
          <button type="button" className={p.pill} onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.key} className={p.act} aria-label={section.title}>
          <h3 className={p.actTitle}>{section.title}</h3>
          {section.key === 'backup' && (
            <p className={p.actNote}>Not in the running order. Pull one up for a question; Escape returns to the talk.</p>
          )}
          <ol className={p.grid}>
            {Array.from({ length: section.end - section.start }, (_, offset) => thumb(section.start + offset))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** Up/down across a wrapping grid: the closest thumbnail in the nearest row that way. */
function nearestInNextRow(els: (HTMLElement | null)[], from: number, dir: 1 | -1) {
  const origin = els[from]!.getBoundingClientRect();
  const originX = origin.left + origin.width / 2;
  let best = from;
  let bestScore = Infinity;

  els.forEach((el, i) => {
    if (!el || i === from) return;
    const r = el.getBoundingClientRect();
    const gap = dir > 0 ? r.top - origin.bottom : origin.top - r.bottom;
    if (gap < -1) return;
    const score = gap * 10_000 + Math.abs(r.left + r.width / 2 - originX);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });

  return best;
}

const SHORTCUTS: Array<{ label: string; keys: string[] }> = [
  { label: 'Next', keys: ['→', 'Space', 'Page Down'] },
  { label: 'Back', keys: ['←', 'Shift Space', 'Page Up'] },
  { label: 'First or last slide', keys: ['Home', 'End'] },
  { label: 'Go to a slide', keys: ['Type its number', 'Enter'] },
  { label: 'All slides', keys: ['G'] },
  { label: 'Return from backup', keys: ['Esc'] },
  { label: 'Full screen', keys: ['F'] },
  { label: 'Black screen', keys: ['B'] },
  { label: 'Shortcuts', keys: ['?'] },
];

export function Shortcuts({
  backupStart,
  onClose,
}: {
  /** The number the deck's backup slides start at. Absent when it has none. */
  backupStart?: number;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className={p.backdrop} onClick={onClose}>
      <div
        className={p.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-shortcuts-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={p.dialogHead}>
          <h2 id="deck-shortcuts-title" className={p.dialogTitle}>Keyboard shortcuts</h2>
          <button ref={closeRef} type="button" className={p.close} onClick={onClose}>
            Close
          </button>
        </div>
        <dl className={p.keys}>
          {SHORTCUTS.map((row) => (
            <div key={row.label} style={{ display: 'contents' }}>
              <dt>{row.label}</dt>
              <dd>
                {row.keys.map((key) =>
                  key === 'Type its number'
                    ? <span key={key}>{key}</span>
                    : <kbd key={key} className={p.kbd}>{key}</kbd>,
                )}
              </dd>
            </div>
          ))}
        </dl>
        {backupStart !== undefined && (
          <p className={p.dialogNote}>
            Backup slides carry on from the talk’s numbers: this deck’s backup is {backupStart} onwards. A question
            that needs one is its number and Enter, and Escape puts the talk back exactly where it was.
          </p>
        )}
      </div>
    </div>
  );
}
