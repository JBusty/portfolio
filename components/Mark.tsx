import type { CSSProperties } from 'react';

/** Where the chevron points. `out` is the offsite lean — up and away. */
type Dir = 'right' | 'left' | 'up' | 'out';

/**
 * The chevron that marks a link, in place of the → / ↗ pair the buttons used to
 * carry. It points where the link goes and travels that way on hover.
 *
 * Decorative; the link text carries the meaning for screen readers. The travel is
 * triggered in CSS by the enclosing link or button — hover or keyboard focus — so
 * there is nothing to wire up per call site.
 */
export default function Mark({
  dir = 'right',
  color,
}: {
  dir?: Dir;
  color?: string;
}) {
  return (
    <svg
      className={`mk mk-${dir}`}
      viewBox="0 0 6 12"
      width="6"
      height="12"
      aria-hidden
      style={color ? ({ '--mk': color } as CSSProperties) : undefined}
    >
      <polyline className="mk-path" points="1.3,2.4 4.7,6 1.3,9.6" />
    </svg>
  );
}
