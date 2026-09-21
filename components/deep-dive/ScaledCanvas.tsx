'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CANVAS } from '@/lib/deepDive';

/**
 * Fits the fixed 1920×1080 slide canvas inside whatever box it is given, and
 * centres it. The same component drives the stage, the overview thumbnails,
 * and the presenter previews, so all three show exactly the same slide.
 *
 * Hidden until measured, so a slide never flashes at full size first.
 *
 * The box must be sized and positioned by the caller (absolute inset, or
 * relative with an aspect ratio). Nothing is set inline for that, because an
 * inline position would silently beat the caller's class.
 */
export interface CanvasFit {
  scale: number;
  /** The letterbox either side, in screen px. */
  x: number;
  /** The letterbox above and below, in screen px. */
  y: number;
}

export default function ScaledCanvas({
  children,
  className,
  style,
  onFit,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Told the fit whenever it changes, for anything positioned against the slide. */
  onFit?: (fit: CanvasFit) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<CanvasFit | null>(null);
  const onFitRef = useRef(onFit);

  useLayoutEffect(() => {
    onFitRef.current = onFit;
  });

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    function measure() {
      // client* rather than getBoundingClientRect: layout size, unaffected by
      // any transform an ancestor might carry.
      const width = box!.clientWidth;
      const height = box!.clientHeight;
      const scale = Math.min(width / CANVAS.w, height / CANVAS.h);
      const next = { scale, x: (width - CANVAS.w * scale) / 2, y: (height - CANVAS.h * scale) / 2 };
      setFit(next);
      onFitRef.current?.(next);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} className={className} style={{ overflow: 'hidden', ...style }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CANVAS.w,
          height: CANVAS.h,
          transformOrigin: '0 0',
          transform: fit ? `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})` : undefined,
          visibility: fit ? 'visible' : 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
