import type { Deck, Slide, Tone } from './types';
import { identityProfiles } from './decks/identity-profiles';
import { unifiedOnboarding } from './decks/unified-onboarding';
import { DEEP_DIVE_PATH } from './route';

export { DEEP_DIVE_PATH, PASSPHRASE } from './route';

/**
 * Presentation order. The last slide of one deck hands off to the next, skipping
 * any given from a `link` instead of slides.
 */
export const DECKS: Deck[] = [unifiedOnboarding, identityProfiles];

/**
 * One or two sentences under the cover title: how the time will be used, and
 * an invitation to interrupt. The cover is often the first thing on screen.
 */
export const COVER_LEDE = 'Some stories about when things go right and when they go wrong. ';

export function getDeck(slug: string): Deck | undefined {
  return DECKS.find((deck) => deck.slug === slug);
}

export function getNextDeck(slug: string): Deck | undefined {
  const index = DECKS.findIndex((deck) => deck.slug === slug);
  return index === -1 ? undefined : DECKS.slice(index + 1).find((deck) => !deck.link);
}

/** Where a deck's cover row goes: its own link if it has one, otherwise its slides. */
export function coverHref(deck: Deck): string {
  return deck.link?.href ?? `${DEEP_DIVE_PATH}/${deck.slug}`;
}

/** The canvas every slide is laid out on, scaled to fit whatever screen it lands on. */
export const CANVAS = { w: 1920, h: 1080 } as const;

/*
 * Positions. A deck is one list — the talk, then the backup slides — so an
 * index means the same thing in every window. Anything at or past
 * `deck.slides.length` is backup.
 */

export function allSlides(deck: Deck): Slide[] {
  return deck.appendix?.length ? [...deck.slides, ...deck.appendix] : deck.slides;
}

export function isBackup(deck: Deck, index: number): boolean {
  return index >= deck.slides.length;
}

/** "7" for the seventh slide of the talk, "B2" for the second backup slide. */
export function positionLabel(deck: Deck, index: number): string {
  return isBackup(deck, index) ? `B${index - deck.slides.length + 1}` : String(index + 1);
}

/** #7 for the talk, #b2 for backup — so the talk's numbers never shift when backup changes. */
export function hashFor(deck: Deck, index: number): string {
  return `#${positionLabel(deck, index).toLowerCase()}`;
}

export function indexFromHash(deck: Deck, hash: string): number | null {
  const match = /^#(b?)(\d+)$/i.exec(hash);
  if (!match) return null;
  const n = Number.parseInt(match[2], 10);
  const backupCount = deck.appendix?.length ?? 0;
  if (match[1]) return n >= 1 && n <= backupCount ? deck.slides.length + n - 1 : null;
  return n >= 1 && n <= deck.slides.length ? n - 1 : null;
}

export function indexOfSlide(deck: Deck, id: string): number {
  return allSlides(deck).findIndex((slide) => slide.id === id);
}

export function defaultTone(slide: Slide): Tone {
  if (slide.tone) return slide.tone;
  switch (slide.kind) {
    case 'title':
    case 'quote':
      return 'tint';
    case 'chapter':
    case 'decision':
    case 'highlights':
      return 'ink';
    default:
      return 'bone';
  }
}

/**
 * Presses a slide takes before the next one. Decisions reveal their choice on
 * the second; a live screen gives one press per state, and a Q&A one per
 * answer, so a clicker walks what a mouse can click.
 */
export function stepsFor(slide: Slide): number {
  switch (slide.kind) {
    case 'decision': return slide.reveal === false ? 1 : 2;
    case 'screen': return slide.states.length;
    case 'qa': return slide.items.length + 1;
    default: return 1;
  }
}

/**
 * Where a jump lands inside a slide. A jump is almost always a return — the
 * question is about the choice — so most slides land on their last step. A
 * live screen lands on its first: it is there to be used, and the reveal is
 * worth nothing if the room did not get to walk into it.
 */
export function landingStep(slide: Slide): number {
  return slide.kind === 'screen' ? 0 : stepsFor(slide) - 1;
}

export interface Act {
  /** Null for the slides before the first chapter. */
  title: string | null;
  /** Act number as shown on the chapter slide, 1-based. 0 for the opening. */
  n: number;
  start: number;
  /** Exclusive. */
  end: number;
}

/** Splits the talk into acts at each chapter slide. Backup slides belong to no act. */
export function actsFor(slides: Slide[]): Act[] {
  const acts: Act[] = [];
  let chapter = 0;
  slides.forEach((slide, index) => {
    if (slide.kind === 'chapter') {
      chapter += 1;
      acts.push({ title: slide.title, n: chapter, start: index, end: index + 1 });
    } else if (acts.length === 0) {
      acts.push({ title: null, n: 0, start: index, end: index + 1 });
    } else {
      acts[acts.length - 1].end = index + 1;
    }
  });
  return acts;
}

export function actIndexAt(acts: Act[], slideIndex: number): number {
  return Math.max(0, acts.findIndex((act) => slideIndex >= act.start && slideIndex < act.end));
}

export function isPlaceholder(text: string): boolean {
  const t = text.trim();
  return t.startsWith('[') && t.endsWith(']');
}

/** Unfilled '[...]' strings anywhere in a deck or slide, notes and pushback included. */
export function countPlaceholders(value: unknown): number {
  if (typeof value === 'string') return isPlaceholder(value) ? 1 : 0;
  if (Array.isArray(value)) return value.reduce<number>((sum, item) => sum + countPlaceholders(item), 0);
  if (value && typeof value === 'object') {
    return Object.values(value).reduce<number>((sum, item) => sum + countPlaceholders(item), 0);
  }
  return 0;
}

/** A readable name for a slide in the overview and presenter view. */
export function slideLabel(slide: Slide): string {
  switch (slide.kind) {
    case 'title':
    case 'chapter':
      return slide.title;
    case 'statement':
      return slide.statement;
    case 'decision':
      return slide.question;
    case 'failure':
      return slide.tried;
    case 'quote':
      return slide.quote;
    case 'image':
      return slide.heading ?? slide.caption ?? 'Image';
    default:
      return slide.heading;
  }
}
