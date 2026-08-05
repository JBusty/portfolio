'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A number that counts to its value instead of appearing at it.
 *
 * The hero figures land late — the index arrives over the network, and the
 * filters then re-cut it — so they snap from an em dash to a four-digit number
 * with nothing in between. Counting up is what makes that read as a readout
 * settling rather than the page changing its mind.
 *
 * Only ever animates *to* a number. A figure that moves because you edited a
 * filter should track the edit, so those are handled by the duration being
 * short and the easing dying out; a figure appearing for the first time is the
 * one worth watching.
 */

/** Long enough to read as motion, short enough that nobody waits on it. */
const DURATION_MS = 900;

/** Ease-out cubic: fast enough to feel immediate, settles rather than stops. */
const ease = (t: number) => 1 - (1 - t) ** 3;

type Props = {
  value: number;
  /** Rendered instead of the number before there is one — the em dash. */
  placeholder?: string;
  ready?: boolean;
};

export default function CountUp({ value, placeholder = '—', ready = true }: Props) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!ready) return;

    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    // Someone who has asked not to see motion gets the number, not a slower
    // version of the number.
    const still = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (still) {
      fromRef.current = to;
      setShown(to);
      return;
    }

    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / DURATION_MS);
      // `|| 0` is not belt-and-braces: rounding a value a hair below zero gives
      // -0, and `(-0).toLocaleString()` renders "-0" — which flickered on the
      // first frame of a count starting from nothing.
      const at = Math.round(from + (to - from) * ease(t)) || 0;
      setShown(at);

      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      // Whatever was on screen is where the next run starts, so interrupting a
      // count mid-flight continues from there rather than jumping back.
      fromRef.current = shown;
      frameRef.current = null;
    };
    // `shown` is deliberately not a dependency: it changes every frame, and
    // depending on it would restart the animation it is being written by.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ready]);

  if (!ready) return <>{placeholder}</>;
  return <>{shown.toLocaleString()}</>;
}
