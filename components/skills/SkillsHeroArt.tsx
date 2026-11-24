import { SKILL_GROUPS } from '@/lib/skills';

/*
 * Header art for /skills, in the same line-drawing style as the Work and Contact
 * heroes (and the same draw-in classes): a card with one meter per skill group,
 * each marked with that group's icon, and a check stamp for "backed by proof".
 * The shared classes already turn the animation off for reduced motion.
 */

const ROWS = [
  { y: 190, len: 100, color: '#3D5A80' },
  { y: 236, len: 84, color: '#1B2233' },
  { y: 282, len: 94, color: '#3D5A80' },
];

export default function SkillsHeroArt() {
  return (
    <svg className="hero-line-art" viewBox="52 52 336 336" aria-hidden="true">
      {/* orbit rings, as on Contact */}
      <circle cx="220" cy="220" r="154" pathLength="100" fill="none" stroke="rgba(27, 34, 51, 0.18)" strokeWidth="1.5" strokeDasharray="8 10" className="hero-draw-stroke hero-draw-2" />
      <circle cx="220" cy="220" r="116" pathLength="100" fill="none" stroke="rgba(27, 34, 51, 0.10)" strokeWidth="1.5" strokeDasharray="4 10" className="hero-draw-stroke hero-draw-3" />

      {/* the card */}
      <rect x="118" y="112" width="204" height="216" rx="18" fill="#FFFFFF" className="hero-draw-fade hero-draw-1" />
      <rect x="118" y="112" width="204" height="216" rx="18" pathLength="100" fill="none" stroke="#1B2233" strokeWidth="1.5" className="hero-draw-stroke hero-draw-1" />
      <g className="hero-draw-fade hero-draw-2">
        <rect x="144" y="138" width="58" height="18" rx="9" fill="#1B2233" />
        <text x="173" y="151" textAnchor="middle" fill="#F8F8F7" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 8, letterSpacing: 1.4 }}>SKILLS</text>
      </g>

      {/* one meter per group, with the group's own icon */}
      {ROWS.map((r, i) => (
        <g key={r.y}>
          <g className={`hero-draw-fade hero-draw-${i + 2}`}>
            <circle cx="158" cy={r.y} r="15" fill="rgba(61, 90, 128, 0.10)" stroke="#3D5A80" strokeWidth="1.5" />
            <g transform={`translate(${158 - 7.2} ${r.y - 7.2}) scale(0.6)`}>
              <path d={SKILL_GROUPS[i].icon} fill="none" stroke="#3D5A80" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
          <line x1="186" y1={r.y} x2="296" y2={r.y} stroke="rgba(27, 34, 51, 0.10)" strokeWidth="7" strokeLinecap="round" className={`hero-draw-fade hero-draw-${i + 2}`} />
          <line x1="186" y1={r.y} x2={186 + r.len} y2={r.y} pathLength="100" stroke={r.color} strokeWidth="7" strokeLinecap="round" className={`hero-draw-stroke hero-draw-${i + 3}`} />
        </g>
      ))}

      {/* "proven" stamp */}
      <g transform="translate(296 300) rotate(-8)" className="hero-draw-fade hero-draw-5">
        <circle r="20" fill="#3D5A80" />
        <path d="M-8 0.5l5.5 5.5L9 -6" fill="none" stroke="#F8F8F7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* a spark on the outer ring, like Contact's dot */}
      <g className="hero-draw-fade hero-draw-5">
        <circle cx="220" cy="66" r="8" fill="#3D5A80" />
        <circle cx="220" cy="66" r="18" fill="none" stroke="rgba(61, 90, 128, 0.3)" strokeWidth="1.5" />
      </g>
      <g transform="translate(84 334)" className="hero-draw-fade hero-draw-4">
        <path d="M0 16 C 34 6 60 6 96 16" pathLength="100" fill="none" stroke="rgba(27, 34, 51, 0.18)" strokeWidth="1.5" strokeLinecap="round" className="hero-draw-stroke hero-draw-4" />
        <circle cx="12" cy="16" r="4" fill="#1B2233" />
        <circle cx="84" cy="16" r="4" fill="#1B2233" />
      </g>
    </svg>
  );
}
