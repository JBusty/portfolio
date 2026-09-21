'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { allSlides, hashFor, indexFromHash, indexOfSlide, landingStep, stepsFor } from '@/lib/deepDive';
import type { Deck } from '@/lib/deepDive/types';

export interface DeckPosition {
  /** Into the talk followed by the backup slides — see allSlides(). */
  index: number;
  /** Presses into the current slide. Only decisions have more than one. */
  step: number;
  /** Screen blanked — for when the conversation leaves the slides. */
  black: boolean;
  /** Where the talk was when a backup slide was pulled up. */
  returnTo: { index: number; step: number } | null;
}

type Message =
  /** `move` when someone pressed something; `sync` when a window is only being told where the talk is. */
  | ({ type: 'state'; from: string; reason: 'move' | 'sync' } & DeckPosition)
  | { type: 'hello'; from: string }
  | { type: 'end'; from: string };

/**
 * Position in a deck, shared between every window that has it open.
 *
 * The audience window and the presenter window each run one of these on the
 * same BroadcastChannel, so either can drive: a clicker aimed at the projector
 * and arrow keys on the laptop move both. A window that opens late says hello
 * and is told where the talk is.
 *
 * The running order never walks into backup. Backup is reached by jumping —
 * from the overview or a pushback answer — and the position it was reached
 * from is kept, so one press puts the talk back where it was.
 */
export function useDeckController(
  deck: Deck,
  { hash, onEnd }: { hash: boolean; onEnd?: () => void },
) {
  // Memoised: lastStep and the channel effect depend on it, and a fresh array
  // each render would reopen the channel and re-announce on every render.
  const slides = useMemo(() => allSlides(deck), [deck]);
  const total = slides.length;
  const talk = deck.slides.length;

  const [pos, setPos] = useState<DeckPosition>({ index: 0, step: 0, black: false, returnTo: null });
  const [ready, setReady] = useState(false);
  // Presses, in any window. Catching up to where the talk already is — a hash
  // on load, a late window being told the position — is not a press.
  const [moves, setMoves] = useState(0);

  // Actions read and write the ref synchronously, so a burst of key presses
  // from a clicker never computes from a position React has not rendered yet.
  const posRef = useRef(pos);
  const channel = useRef<BroadcastChannel | null>(null);
  const self = useRef('');
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const lastStep = useCallback((index: number) => stepsFor(slides[index]) - 1, [slides]);
  const landing = useCallback((index: number) => landingStep(slides[index]), [slides]);

  const commit = useCallback((next: DeckPosition, source: 'local' | 'remote' | 'sync' = 'local') => {
    posRef.current = next;
    setPos(next);
    if (source !== 'sync') setMoves((n) => n + 1);
    if (source === 'local') {
      channel.current?.postMessage({ type: 'state', from: self.current, reason: 'move', ...next } satisfies Message);
    }
  }, []);

  const end = useCallback(() => {
    channel.current?.postMessage({ type: 'end', from: self.current } satisfies Message);
    onEndRef.current?.();
  }, []);

  const next = useCallback(() => {
    const p = posRef.current;
    const inBackup = p.index >= talk;
    if (p.step < lastStep(p.index)) commit({ ...p, step: p.step + 1, black: false });
    else if (p.index < (inBackup ? total : talk) - 1) commit({ ...p, index: p.index + 1, step: 0, black: false });
    else if (!inBackup) end();
  }, [commit, end, lastStep, talk, total]);

  const prev = useCallback(() => {
    const p = posRef.current;
    if (p.step > 0) commit({ ...p, step: p.step - 1, black: false });
    else if (p.index > 0 && p.index !== talk) commit({ ...p, index: p.index - 1, step: lastStep(p.index - 1), black: false });
  }, [commit, lastStep, talk]);

  /**
   * A move inside the current slide — a hotspot clicked on a live screen.
   * Same commit path as the arrow keys, so every window follows it.
   */
  const setStep = useCallback((step: number) => {
    const p = posRef.current;
    const clamped = Math.min(lastStep(p.index), Math.max(0, step));
    if (clamped !== p.step) commit({ ...p, step: clamped, black: false });
  }, [commit, lastStep]);

  /**
   * Jumps land where the slide is most useful to arrive at — see landingStep().
   */
  const goto = useCallback((target: number) => {
    const p = posRef.current;
    const index = Math.min(total - 1, Math.max(0, target));
    const returnTo = index < talk ? null : p.index < talk ? { index: p.index, step: p.step } : p.returnTo;
    commit({ index, step: landing(index), black: false, returnTo });
  }, [commit, landing, talk, total]);

  /** Puts a backup slide up by id — the button beside a pushback answer. */
  const show = useCallback((id: string) => {
    const index = indexOfSlide(deck, id);
    if (index === -1) {
      console.warn(`[deep dive] No slide with id "${id}" in ${deck.slug}.`);
      return;
    }
    goto(index);
  }, [deck, goto]);

  /** Back to where the talk was before backup was pulled up. */
  const back = useCallback(() => {
    const { returnTo } = posRef.current;
    if (returnTo) commit({ index: returnTo.index, step: returnTo.step, black: false, returnTo: null });
  }, [commit]);

  const toggleBlack = useCallback(() => {
    commit({ ...posRef.current, black: !posRef.current.black });
  }, [commit]);

  useEffect(() => {
    self.current = Math.random().toString(36).slice(2);

    if (hash) {
      const index = indexFromHash(deck, window.location.hash);
      if (index !== null) commit({ index, step: landing(index), black: false, returnTo: null }, 'sync');
    }
    setReady(true);

    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(`deep-dive:${deck.slug}`);
    channel.current = ch;
    ch.onmessage = (event: MessageEvent<Message>) => {
      const msg = event.data;
      if (!msg || msg.from === self.current) return;
      if (msg.type === 'state') {
        const next = { index: msg.index, step: msg.step, black: msg.black, returnTo: msg.returnTo };
        commit(next, msg.reason === 'move' ? 'remote' : 'sync');
      } else if (msg.type === 'hello') {
        ch.postMessage({ type: 'state', from: self.current, reason: 'sync', ...posRef.current } satisfies Message);
      } else if (msg.type === 'end') {
        onEndRef.current?.();
      }
    };
    ch.postMessage({ type: 'hello', from: self.current } satisfies Message);

    return () => {
      ch.close();
      channel.current = null;
    };
  }, [commit, deck, hash, landing]);

  // The slide lives in the hash, so a refresh mid-talk lands back on it.
  // replaceState, not push: Back should leave the deck, not rewind it.
  useEffect(() => {
    if (!hash || !ready) return;
    const target = hashFor(deck, pos.index);
    if (window.location.hash !== target) window.history.replaceState(window.history.state, '', target);
  }, [deck, hash, pos.index, ready]);

  useEffect(() => {
    if (!hash) return;
    function onHashChange() {
      const index = indexFromHash(deck, window.location.hash);
      if (index !== null && index !== posRef.current.index) goto(index);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [deck, goto, hash]);

  return { pos, ready, moves, next, prev, setStep, goto, show, back, toggleBlack, lastStep, talk, total };
}

export type NavAction = 'next' | 'prev' | 'first' | 'last';

/**
 * Keys that move through a deck. Covers presentation clickers, which send
 * PageUp/PageDown (most) or arrows (some).
 */
export function navAction(e: KeyboardEvent): NavAction | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
      return 'next';
    case ' ':
      return e.shiftKey ? 'prev' : 'next';
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
      return 'prev';
    case 'Home':
      return 'first';
    case 'End':
      return 'last';
    default:
      return null;
  }
}

export function isEditable(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}
