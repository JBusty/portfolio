'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Mark from '@/components/Mark';
import ScaledCanvas from './ScaledCanvas';
import SlideView from './SlideView';
import { isEditable, navAction, useDeckController } from './useDeckController';
import {
  DEEP_DIVE_PATH,
  actIndexAt,
  actsFor,
  allSlides,
  countPlaceholders,
  indexOfSlide,
  isPlaceholder,
  positionLabel,
  slideLabel,
  stepsFor,
} from '@/lib/deepDive';
import type { Deck, Slide } from '@/lib/deepDive/types';
import s from './presenter.module.css';

/** Within this of plan either way counts as on pace. */
const PACE_SLACK_MS = 30_000;

/**
 * The second window. Current slide, what the next press shows, your notes,
 * the challenges you expect with the backup that answers them, and a clock
 * paced against the deck's planned time — all in step with the audience window.
 */
export default function Presenter({
  deck,
  nextDeck,
}: {
  deck: Deck;
  nextDeck?: { slug: string; title: string };
}) {
  const router = useRouter();
  const slides = useMemo(() => allSlides(deck), [deck]);
  const onEnd = useCallback(() => {
    if (nextDeck) router.push(`${DEEP_DIVE_PATH}/${nextDeck.slug}/presenter`);
  }, [nextDeck, router]);

  const { pos, ready, moves, next, prev, goto, show, back, toggleBlack, talk, total } = useDeckController(deck, {
    hash: false,
    onEnd,
  });
  const { index, step, black, returnTo } = pos;
  const slide = slides[index];
  const inBackup = index >= talk;
  const steps = stepsFor(slide);
  const acts = actsFor(deck.slides);
  const act = acts[actIndexAt(acts, index)];
  const toFill = countPlaceholders(slide);
  const [fit, setFit] = useState(1);

  const sectionEnd = inBackup ? total : talk;
  const upcoming = step < steps - 1
    ? { index, step: step + 1 }
    : index < sectionEnd - 1 ? { index: index + 1, step: 0 } : null;

  const clock = useTalkClock(deck.slug);

  // The clock starts itself on the first press in either window, so it can be
  // opened well before the talk without eating into the time. Through a ref:
  // the clock object changes every tick, and only a press should trigger this.
  const startIfUnused = useRef(clock.startIfUnused);
  useEffect(() => {
    startIfUnused.current = clock.startIfUnused;
  });
  useEffect(() => {
    if (moves > 0) startIfUnused.current();
  }, [moves]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isEditable(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const action = navAction(e);
      if (action) {
        e.preventDefault();
        if (action === 'next') next();
        else if (action === 'prev') prev();
        else if (inBackup) goto(action === 'first' ? talk : total - 1);
        else goto(action === 'first' ? 0 : talk - 1);
      } else if (e.key === 'b' || e.key === 'B' || e.key === '.') {
        e.preventDefault();
        toggleBlack();
      } else if (e.key === 'Escape' && returnTo) {
        e.preventDefault();
        back();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [back, goto, inBackup, next, prev, returnTo, talk, toggleBlack, total]);

  // Pace is measured against the talk only: time spent in backup is time spent
  // answering, and the plan should absorb it rather than pretend it didn't happen.
  const planMs = deck.minutes * 60_000;
  const expected = planMs * ((inBackup && returnTo ? returnTo.index : index) / talk);
  const drift = clock.deckElapsed - expected;
  const pace = !clock.started
    ? null
    : Math.abs(drift) <= PACE_SLACK_MS
      ? { tone: 'even', text: 'On pace' }
      : drift > 0
        ? { tone: 'behind', text: `${formatMs(drift)} behind` }
        : { tone: 'ahead', text: `${formatMs(-drift)} ahead` };

  return (
    <main id="main-content" tabIndex={-1} className={s.root}>
      <div className={s.bar}>
        <span className={s.deckName}>{deck.title}</span>
        <span>{inBackup ? 'Backup' : act.title ?? 'Opening'}</span>
        <span className={s.grow} />
        {!clock.started && <span className={s.hint}>On a call, share only the slides window</span>}
        <div className={s.timer}>
          {pace && <span className={s.pace} data-tone={pace.tone}>{pace.text}</span>}
          <span className={s.time} data-paused={!clock.running || undefined} aria-label="Time on this deck">
            {formatMs(clock.deckElapsed)}
          </span>
          <span className={s.plan}>of {deck.minutes}:00</span>
          {clock.sessionElapsed > clock.deckElapsed + 1000 && (
            <span className={s.plan}>Total {formatMs(clock.sessionElapsed)}</span>
          )}
          <button type="button" className={s.button} onClick={clock.toggle}>
            {clock.running ? 'Pause' : clock.started ? 'Resume' : 'Start'}
          </button>
          <button type="button" className={s.button} onClick={clock.reset}>
            Reset
          </button>
        </div>
        <span className={s.clock}>{clock.wallTime}</span>
      </div>

      <div className={s.column}>
        <div className={s.frame}>
          <ScaledCanvas className={s.canvas}>
            {ready && (
              <SlideView
                deck={deck}
                index={index}
                step={step}
                live
                eager
                onFit={setFit}
              />
            )}
          </ScaledCanvas>
          {black && <div className={s.blackNote}>The audience screen is black</div>}
        </div>

        <div className={s.nav}>
          {returnTo ? (
            <button type="button" className={`${s.button} ${s.buttonReturn}`} onClick={back}>
              <Mark dir="left" />
              Back to slide {positionLabel(deck, returnTo.index)}
            </button>
          ) : (
            <button type="button" className={s.button} onClick={prev} disabled={index === 0 && step === 0}>
              <Mark dir="left" />
              Back
            </button>
          )}
          <span className={s.position}>
            {inBackup ? `Backup ${index - talk + 1} of ${total - talk}` : `Slide ${index + 1} of ${talk}`}
            {steps > 1 && `, step ${step + 1} of ${steps}`}
          </span>
          <button type="button" className={s.button} onClick={toggleBlack} aria-pressed={black}>
            Black screen
          </button>
          <button type="button" className={s.button} onClick={next} disabled={!upcoming && (inBackup || !nextDeck)}>
            Next
            <Mark />
          </button>
        </div>

        {(toFill > 0 || fit < 0.99) && (
          <p className={s.flags}>
            {toFill > 0 && <span>{toFill} {toFill === 1 ? 'prompt' : 'prompts'} still to fill on this slide</span>}
            {fit < 0.99 && <span>Copy shrunk to {Math.round(fit * 100)}% to fit — trim it</span>}
          </p>
        )}

        <section className={`${s.panel} ${s.panelScroll}`} aria-labelledby="presenter-notes">
          <h2 id="presenter-notes" className={s.heading}>Talking points</h2>
          {slide.notes?.length ? (
            <ul className={s.notes}>
              {slide.notes.map((note, i) => <li key={i}><span><T>{note}</T></span></li>)}
            </ul>
          ) : (
            <p className={s.empty}>No notes on this slide.</p>
          )}
        </section>
      </div>

      <div className={s.column}>
        <section aria-labelledby="presenter-next">
          <h2 id="presenter-next" className={s.heading}>Next</h2>
          {upcoming ? (
            <>
              <ScaledCanvas className={s.canvas}>
                {ready && (
                  <SlideView
                    deck={deck}
                    index={upcoming.index}
                    step={upcoming.step}
                  />
                )}
              </ScaledCanvas>
              {upcoming.index === index && <p className={s.upNext}>{sameSlideNote(slide)}</p>}
            </>
          ) : (
            <p className={s.upNext}>
              {inBackup
                ? 'Last backup slide.'
                : nextDeck
                  ? `End of deck. Next press opens ${nextDeck.title}.`
                  : 'End of the last deck.'}
            </p>
          )}
        </section>

        <section className={`${s.panel} ${s.panelScroll}`} aria-labelledby="presenter-pushback">
          <h2 id="presenter-pushback" className={s.heading}>If they push back</h2>
          {slide.pushback?.length ? (
            <dl className={s.pushback}>
              {slide.pushback.map((item, i) => {
                const target = item.show ? indexOfSlide(deck, item.show) : -1;
                return (
                  <div key={i}>
                    <dt><T>{item.q}</T></dt>
                    <dd>
                      <T>{item.a}</T>
                      {target !== -1 && (
                        <button type="button" className={`${s.button} ${s.showButton}`} onClick={() => show(item.show!)}>
                          Show {positionLabel(deck, target)}: <span className={s.showLabel}>{slideLabel(slides[target])}</span>
                          <Mark />
                        </button>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <p className={s.empty}>Nothing prepared for this slide.</p>
          )}
        </section>
      </div>
    </main>
  );
}

function T({ children }: { children: string }) {
  return isPlaceholder(children) ? <span className={s.ph}>{children}</span> : <>{children}</>;
}

interface ClockState {
  startedAt: number | null;
  banked: number;
}

const CLOCK_KEY = 'deep-dive:clock';
const DECK_START_KEY = 'deep-dive:deck-start:';

/**
 * The talk clock. It lives in sessionStorage, so it survives the presenter
 * window moving on to the next deck (a new page) and a refresh mid-talk. Each
 * deck records the session time it began at, which is what pace is measured
 * from.
 */
function useTalkClock(slug: string) {
  const [state, setState] = useState<ClockState>({ startedAt: null, banked: 0 });
  const [deckStart, setDeckStart] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setState(readStorage<ClockState>(CLOCK_KEY) ?? { startedAt: null, banked: 0 });
    setDeckStart(readStorage<number>(DECK_START_KEY + slug));
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, [slug]);

  const running = state.startedAt !== null;
  const sessionElapsed = now === null ? 0 : state.banked + (state.startedAt !== null ? now - state.startedAt : 0);
  const started = running || state.banked > 0;

  // The first moment the clock runs on this deck is where the deck began.
  useEffect(() => {
    if (running && deckStart === null && now !== null) {
      setDeckStart(sessionElapsed);
      writeStorage(DECK_START_KEY + slug, sessionElapsed);
    }
  }, [deckStart, now, running, sessionElapsed, slug]);

  const update = useCallback((next: ClockState) => {
    setState(next);
    setNow(Date.now());
    writeStorage(CLOCK_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    const t = Date.now();
    if (state.startedAt !== null) update({ startedAt: null, banked: state.banked + (t - state.startedAt) });
    else update({ startedAt: t, banked: state.banked });
  }, [state, update]);

  const startIfUnused = useCallback(() => {
    if (state.startedAt === null && state.banked === 0) update({ startedAt: Date.now(), banked: 0 });
  }, [state, update]);

  const reset = useCallback(() => {
    update({ startedAt: null, banked: 0 });
    setDeckStart(null);
    try {
      Object.keys(window.sessionStorage)
        .filter((key) => key.startsWith(DECK_START_KEY))
        .forEach((key) => window.sessionStorage.removeItem(key));
    } catch {
      // Storage unavailable: the in-memory reset above is enough for this window.
    }
  }, [update]);

  return useMemo(() => ({
    running,
    started,
    sessionElapsed,
    deckElapsed: Math.max(0, sessionElapsed - (deckStart ?? sessionElapsed)),
    wallTime: now === null ? '' : new Date(now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    toggle,
    startIfUnused,
    reset,
  }), [deckStart, now, reset, running, sessionElapsed, startIfUnused, started, toggle]);
}

function readStorage<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private windows can refuse storage; the clock still runs for this page.
  }
}

function formatMs(ms: number) {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/** What the next press does when it stays on the slide already up. */
function sameSlideNote(slide: Slide): string {
  switch (slide.kind) {
    case 'screen': return 'Same slide — the screen moves on.';
    case 'qa': return 'Same slide — the next answer lands.';
    default: return 'Reveals the choice.';
  }
}
