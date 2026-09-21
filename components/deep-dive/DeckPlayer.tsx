'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import ImageViewer from '@/components/ImageViewer';
import Mark from '@/components/Mark';
import ScaledCanvas, { type CanvasFit } from './ScaledCanvas';
import SlideView from './SlideView';
import { Overview, Shortcuts } from './DeckOverlays';
import { isEditable, navAction, useDeckController } from './useDeckController';
import { DEEP_DIVE_PATH, allSlides, positionLabel, slideLabel } from '@/lib/deepDive';
import type { Deck } from '@/lib/deepDive/types';
import p from './player.module.css';

/** How close to the bottom of the window the pointer has to come for the controls to rise. */
const DOCK = 120;

/** The progress rail's top edge, in canvas px up from the slide's bottom edge. */
const RAIL_TOP = 80;

/** Where the controls sit: this far up from the bottom of the window. */
const DOCK_BOTTOM = 20;

/** The controls' height, near enough, and the gap they keep above the rail. */
const DOCK_H = 46;
const DOCK_GAP = 14;

/** The audience-facing deck: one slide, fitted to the screen. */
export default function DeckPlayer({
  deck,
  nextDeck,
}: {
  deck: Deck;
  nextDeck?: { slug: string; title: string };
}) {
  const router = useRouter();
  const slides = useMemo(() => allSlides(deck), [deck]);
  const nextHref = nextDeck ? `${DEEP_DIVE_PATH}/${nextDeck.slug}` : undefined;
  const onEnd = useCallback(() => {
    if (nextHref) router.push(nextHref);
  }, [nextHref, router]);

  const { pos, ready, next, prev, setStep, goto, back, toggleBlack, lastStep, talk, total } = useDeckController(deck, {
    hash: true,
    onEnd,
  });
  const { index, step, black, returnTo } = pos;
  const inBackup = index >= talk;

  const [shortcuts, setShortcuts] = useState(false);
  const [overview, setOverview] = useState(false);
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const [jump, setJump] = useState('');
  const [idle, setIdle] = useState(false);
  const [docked, setDocked] = useState(false);
  const [dockBottom, setDockBottom] = useState(DOCK_BOTTOM);
  const dockZone = useRef(DOCK);
  const rootRef = useRef<HTMLElement>(null);

  // The rail's sections are clickable, so the controls must not rise over
  // them. With room under the slide — a phone held upright — they sit in the
  // letterbox as before; otherwise just above the rail. The zone that raises
  // them grows to cover wherever they end up.
  const onCanvasFit = useCallback((fit: CanvasFit) => {
    const bottom = fit.y >= DOCK_BOTTOM + DOCK_H + DOCK_GAP ? DOCK_BOTTOM : fit.y + RAIL_TOP * fit.scale + DOCK_GAP;
    setDockBottom(bottom);
    dockZone.current = Math.max(DOCK, bottom + DOCK_H + DOCK_GAP);
  }, []);
  const raiseDock = useRef<() => void>(() => {});
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const closeOverlay = useCallback((close: () => void) => {
    close();
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  // Keep the page behind the deck from scrolling on trackpads and phones.
  useEffect(() => {
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = overflow; };
  }, []);

  // Two separate things, both about keeping the slide clean while it is up.
  // The cursor hides when the mouse sits still. The controls live in a dock
  // that only rises when the pointer comes down to it, so nothing floats over
  // the slide on the way to clicking something on it. Key presses raise
  // neither: a clicker should not flash UI on the projector.
  useEffect(() => {
    let still = 0;
    let tapped = 0;

    function onMove(e: PointerEvent) {
      setIdle(false);
      setDocked(e.clientY >= window.innerHeight - dockZone.current);
      window.clearTimeout(still);
      still = window.setTimeout(() => setIdle(true), 2500);
    }

    // A touch screen has no hover, so a tap brings the dock up for a moment.
    raiseDock.current = () => {
      setDocked(true);
      window.clearTimeout(tapped);
      tapped = window.setTimeout(() => setDocked(false), 4000);
    };

    const onLeave = () => setDocked(false);

    still = window.setTimeout(() => setIdle(true), 2500);
    window.addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.clearTimeout(still);
      window.clearTimeout(tapped);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  useEffect(() => {
    if (!jump) return;
    const timer = window.setTimeout(() => setJump(''), 2500);
    return () => window.clearTimeout(timer);
  }, [jump]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // The image viewer handles its own Escape; nothing else should move under it.
      if (zoom || isEditable(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (shortcuts) {
        if (key === 'Escape' || key === '?') {
          e.preventDefault();
          closeOverlay(() => setShortcuts(false));
        }
        return;
      }

      // The overview has the keyboard: arrows move between thumbnails and Enter
      // picks one, so none of it should move the deck underneath.
      if (overview) {
        if (key === 'Escape' || key === 'g') {
          e.preventDefault();
          closeOverlay(() => setOverview(false));
        }
        return;
      }

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        setJump((current) => (current + key).slice(-3));
        return;
      }

      if (jump && key === 'Enter') {
        e.preventDefault();
        const n = Number.parseInt(jump, 10);
        // One continuous run of numbers: the talk, then backup after it. So a
        // question that needs backup slide 2 of a 20-slide talk is "22, Enter",
        // and Escape puts the talk back where it was.
        if (n >= 1 && n <= total) goto(n - 1);
        setJump('');
        return;
      }

      if (jump && key === 'Backspace') {
        e.preventDefault();
        setJump((current) => current.slice(0, -1));
        return;
      }

      // Escape unwinds one thing at a time: a half-typed number, the black
      // screen, then a detour into backup.
      if (key === 'Escape') {
        if (jump) setJump('');
        else if (black) toggleBlack();
        else if (returnTo) back();
        return;
      }

      const action = navAction(e);
      if (action) {
        e.preventDefault();
        setJump('');
        if (action === 'next') next();
        else if (action === 'prev') prev();
        else if (inBackup) goto(action === 'first' ? talk : total - 1);
        else goto(action === 'first' ? 0 : talk - 1);
        return;
      }

      const commands: Record<string, () => void> = {
        '?': () => setShortcuts(true),
        g: () => setOverview(true),
        b: toggleBlack,
        '.': toggleBlack,
        f: toggleFullscreen,
      };
      if (commands[key]) {
        e.preventDefault();
        commands[key]();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [back, black, closeOverlay, goto, inBackup, jump, next, overview, prev, returnTo, shortcuts, talk, toggleBlack, total, zoom]);

  // Neighbours render too, hidden, so their screenshots have already loaded by
  // the time the clicker gets to them. Only within the same section: the talk
  // never steps into backup, so there is no point loading across the seam.
  const sectionStart = inBackup ? talk : 0;
  const sectionEnd = inBackup ? total : talk;
  const neighbours = [index - 1, index, index + 1].filter((i) => i >= sectionStart && i < sectionEnd);
  const atStart = index === sectionStart && step === 0;
  const atEnd = index === sectionEnd - 1 && step === lastStep(index);
  const handsOff = atEnd && !inBackup && Boolean(nextDeck);

  return (
    <main
      ref={rootRef}
      id="main-content"
      tabIndex={-1}
      className={p.root}
      style={{ '--dock-bottom': `${dockBottom}px` } as CSSProperties}
      data-idle={idle || undefined}
      data-dock={docked || undefined}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const start = swipe.current;
        swipe.current = null;
        if (!start) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) next();
          else prev();
        } else {
          raiseDock.current();
        }
      }}
    >
      <ScaledCanvas className={p.stage} onFit={onCanvasFit}>
        {ready && neighbours.map((i) => {
          const current = i === index;
          return (
            <div key={i} className={p.layer} data-current={current || undefined} aria-hidden={!current} inert={!current}>
              <SlideView
                deck={deck}
                index={i}
                step={current ? step : i < index ? lastStep(i) : 0}
                live={current}
                eager
                onZoom={current ? (src, alt) => setZoom({ src, alt }) : undefined}
                onStep={current ? setStep : undefined}
                onGoto={current ? goto : undefined}
              />
            </div>
          );
        })}
      </ScaledCanvas>

      <p className={p.srOnly} aria-live="polite">
        {ready ? `${inBackup ? 'Backup slide' : 'Slide'} ${positionLabel(deck, index)}: ${slideLabel(slides[index])}` : ''}
      </p>

      {black && <div className={p.blackout} onClick={toggleBlack} />}

      {jump && (
        <div className={p.jump} role="status">
          Go to slide <kbd>{jump}</kbd>, then Enter
        </div>
      )}

      <nav className={p.controls} aria-label="Deck controls">
        {returnTo && (
          <>
            <button type="button" className={`${p.control} ${p.controlReturn}`} onClick={back}>
              <Mark dir="left" />
              Back to slide {positionLabel(deck, returnTo.index)}
            </button>
            <span className={p.divider} aria-hidden />
          </>
        )}
        <button type="button" className={`${p.control} ${p.controlIcon}`} onClick={prev} disabled={atStart} aria-label="Previous">
          <Mark dir="left" />
        </button>
        <span className={p.count}>
          {inBackup ? `Backup ${index - talk + 1} / ${total - talk}` : `${index + 1} / ${talk}`}
        </span>
        <button
          type="button"
          className={`${p.control} ${handsOff ? '' : p.controlIcon}`}
          onClick={next}
          disabled={atEnd && !handsOff}
          aria-label={handsOff ? `Next deck: ${nextDeck!.title}` : 'Next'}
        >
          {handsOff && <span className={p.controlText}>Next deck</span>}
          <Mark />
        </button>
        <span className={p.divider} aria-hidden />
        <button type="button" className={`${p.control} ${p.controlWide}`} onClick={() => setOverview(true)}>
          All slides
        </button>
        <button type="button" className={`${p.control} ${p.controlWide}`} onClick={toggleFullscreen}>
          Full screen
        </button>
        <button type="button" className={`${p.control} ${p.controlIcon}`} onClick={() => setShortcuts(true)} aria-label="Keyboard shortcuts">
          ?
        </button>
      </nav>

      {overview && (
        <Overview
          deck={deck}
          index={index}
          onPick={(i) => closeOverlay(() => {
            setOverview(false);
            goto(i);
          })}
          onClose={() => closeOverlay(() => setOverview(false))}
        />
      )}

      {shortcuts && (
        <Shortcuts
          backupStart={deck.appendix?.length ? talk + 1 : undefined}
          onClose={() => closeOverlay(() => setShortcuts(false))}
        />
      )}

      {zoom && <ImageViewer src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />}
    </main>
  );
}

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => {});
}
