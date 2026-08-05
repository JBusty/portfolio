/**
 * Jobwatch glyphs. Same 24 grid and 1.8 stroke as the nav icons elsewhere on
 * the site, so they sit in the same family.
 */

type IconProps = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export function CheckIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function HideIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.3A9.6 9.6 0 0 1 12 5.2c5 0 9 4.3 9 6.8 0 .9-.5 2-1.4 3.1" />
      <path d="M6.3 7.6C4 9 2.9 10.9 2.9 12c0 2.5 4 6.8 9 6.8 1.5 0 2.9-.4 4.1-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export function RefreshIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20 4v4h-4" />
    </svg>
  );
}

export function CloseIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function TrashIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 7h16" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6.5 7.5 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-11.5" />
    </svg>
  );
}

export function SlidersIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="10" cy="16" r="2" />
    </svg>
  );
}
