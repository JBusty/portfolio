'use client';

import Link from 'next/link';
import Mark from '@/components/Mark';
import ScaledCanvas from './ScaledCanvas';
import SlideView from './SlideView';
import { DEEP_DIVE_PATH, positionLabel, stepsFor } from '@/lib/deepDive';
import type { Deck, Slide } from '@/lib/deepDive/types';
import p from './print.module.css';

/** One printed page: a slide, at the step it should print at. */
interface Page { slide: Slide; i: number; step: number; key: string }

/**
 * The talk as pages, every decision already revealed. Backup slides stay out:
 * they are for questions in the room, not for the PDF. Print it to PDF from
 * the browser — page size and margins are set in the stylesheet, so the dialog
 * needs no changes.
 */
export default function PrintDeck({
  deck,
}: {
  deck: Deck;
}) {
  // A live screen is a state machine, so every state gets its own page —
  // otherwise a printed deck shows only the last thing the room clicked.
  // Everything else prints once, already revealed.
  const pages: Page[] = deck.slides.flatMap((slide, i): Page[] =>
    slide.kind === 'screen'
      ? slide.states.map((state, step) => ({ slide, i, step, key: state.id }))
      : [{ slide, i, step: stepsFor(slide) - 1, key: slide.id }],
  );

  return (
    <main id="main-content" tabIndex={-1} className={p.root}>
      <div className={p.bar}>
        <div>
          <h1 className={p.title}>{deck.title}</h1>
          <p className={p.meta}>
            {deck.slides.length} slides. Print to PDF — one slide per page.
          </p>
        </div>
        <div className={p.actions}>
          <Link href={`${DEEP_DIVE_PATH}/${deck.slug}`} className={p.button}>
            <Mark dir="left" />
            Back to the deck
          </Link>
          <button type="button" className={`${p.button} ${p.primary}`} onClick={() => window.print()}>
            Save as PDF
          </button>
        </div>
      </div>

      {pages.map(({ slide, i, step, key }) => (
        <div key={`${slide.id}-${key}`} className={p.page}>
          <p className={p.pageLabel}>Slide {positionLabel(deck, i)}</p>
          <ScaledCanvas className={p.canvas}>
            <SlideView
              deck={deck}
              index={i}
              step={step}
              eager
            />
          </ScaledCanvas>
        </div>
      ))}
    </main>
  );
}
