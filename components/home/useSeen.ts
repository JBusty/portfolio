'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * True once the element has scrolled far enough into view, and stays true.
 * Drives the one-time "animate in" on homepage sections. With reduced motion
 * it's true straight away, so nothing waits on a scroll to appear.
 */
export function useSeen<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}
