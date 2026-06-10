'use client';

import { useState } from 'react';

// ─── Palettes ─────────────────────────────────────────────────────────────────
const DARK  = { bg: '#111110', fg: '#ECE7DC', sub: 'rgba(236,231,220,0.4)' };
const LIGHT = { bg: '#E2DCCE', fg: '#111110', sub: '#6F6B61' };
const ACC   = '#E13B14';

type Theme = typeof DARK;

// ─── Card shell ───────────────────────────────────────────────────────────────
function Card({
  children,
  title,
  desc,
  t,
  wide,
}: {
  children: React.ReactNode;
  title: string;
  desc?: string;
  t: Theme;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        background: t.bg,
        borderRadius: 20,
        padding: '48px 32px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        gridColumn: wide ? 'span 2' : undefined,
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 140 }}>
        {children}
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, color: t.fg, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-inter)' }}>{title}</p>
        {desc && (
          <p style={{ margin: '4px 0 0', color: t.sub, fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {desc}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── TEXT MARKS ───────────────────────────────────────────────────────────────

function BadgeMark({ t }: { t: Theme }) {
  return (
    <div style={{
      width: 100, height: 100, background: t.fg, borderRadius: 22,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 600, fontSize: 38, color: t.bg,
      letterSpacing: '-0.02em',
    }}>
      JB
    </div>
  );
}

function BadgeRoundMark({ t }: { t: Theme }) {
  return (
    <div style={{
      width: 100, height: 100, background: t.fg, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 600, fontSize: 38, color: t.bg,
      letterSpacing: '-0.02em',
    }}>
      JB
    </div>
  );
}

function BadgeAccentMark() {
  return (
    <div style={{
      width: 100, height: 100, background: ACC, borderRadius: 22,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 600, fontSize: 38, color: '#ECE7DC',
      letterSpacing: '-0.02em',
    }}>
      JB
    </div>
  );
}

function PeriodMark({ t }: { t: Theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 600, fontSize: 72, color: t.fg, letterSpacing: '-0.04em', lineHeight: 1 }}>JB</span>
      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 600, fontSize: 72, color: ACC, lineHeight: 1 }}>.</span>
    </div>
  );
}

function SerifMark({ t }: { t: Theme }) {
  return (
    <span style={{ fontFamily: 'var(--font-instrument-serif)', fontSize: 88, color: t.fg, lineHeight: 1, fontStyle: 'italic' }}>
      jb
    </span>
  );
}

function SlashMark({ t }: { t: Theme }) {
  return (
    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 80, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, color: t.fg }}>
      J<span style={{ color: ACC }}>/</span>B
    </span>
  );
}

function CodeTagMark({ t }: { t: Theme }) {
  return (
    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 30, fontWeight: 500, color: t.fg, letterSpacing: '-0.01em', lineHeight: 1, whiteSpace: 'nowrap' }}>
      <span style={{ color: ACC }}>&lt;</span>JB<span style={{ color: t.sub }}>&nbsp;</span><span style={{ color: ACC }}>/&gt;</span>
    </span>
  );
}

function TerminalMark({ t }: { t: Theme }) {
  return (
    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 64, fontWeight: 600, color: t.fg, letterSpacing: '-0.03em', lineHeight: 1, display: 'flex', alignItems: 'center' }}>
      JB
      <span className="cursor-blink" style={{ display: 'inline-block', width: 9, height: '0.78em', background: ACC, marginLeft: 5, borderRadius: 2, verticalAlign: 'text-bottom' }} />
    </span>
  );
}

function WordmarkMark({ t }: { t: Theme }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: 14, color: t.sub, letterSpacing: '0.26em', textTransform: 'uppercase', lineHeight: 1, marginBottom: 2 }}>
        JOSHUA
      </div>
      <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 900, fontSize: 48, color: t.fg, letterSpacing: '-0.05em', lineHeight: 1, textTransform: 'uppercase' }}>
        BUSSEY
      </div>
      <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 500, fontSize: 9, color: t.sub, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 6 }}>
        PRODUCT DESIGNER
      </div>
    </div>
  );
}

function CompressedMark({ t }: { t: Theme }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 900, fontSize: 34, color: t.fg, letterSpacing: '-0.07em', textTransform: 'uppercase', lineHeight: 1 }}>
        JBUSSEY
      </div>
      <div style={{ width: '100%', height: 2, background: t.fg, marginTop: 8, borderRadius: 1 }} />
      <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 500, fontSize: 9, color: t.sub, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 6 }}>
        PRODUCT DESIGNER
      </div>
    </div>
  );
}

function StampMark({ t }: { t: Theme }) {
  const r = 57, cx = 70, cy = 70;
  const id = t.bg === DARK.bg ? 'sp-d' : 'sp-l';
  return (
    <svg width={140} height={140} viewBox="0 0 140 140" fill="none">
      <defs>
        <path id={id} d={`M ${cx},${cy - r} a ${r},${r} 0 1,1 -0.01,0`} />
      </defs>
      <circle cx={cx} cy={cy} r={r + 3} stroke={t.fg} strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r - 14} stroke={t.fg} strokeWidth="1.5" />
      <text x={cx} y={cy + 14} textAnchor="middle"
        style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 600, fontSize: 28, fill: t.fg, letterSpacing: '-0.02em' } as React.CSSProperties}>
        JB
      </text>
      <text style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 500, fontSize: 9, fill: t.fg, letterSpacing: '0.13em' } as React.CSSProperties}>
        <textPath href={`#${id}`}>JOSHUA BUSSEY · PRODUCT DESIGNER · </textPath>
      </text>
    </svg>
  );
}

// ─── ILLUSTRATED MARKS ────────────────────────────────────────────────────────

function SilhouetteMark({ t }: { t: Theme }) {
  const c = t.fg;
  return (
    <svg width={120} height={132} viewBox="0 0 120 132" fill="none" aria-hidden>
      <ellipse cx="60" cy="50" rx="34" ry="40" fill={c} />
      <ellipse cx="27" cy="52" rx="6" ry="10" fill={c} />
      <ellipse cx="93" cy="52" rx="6" ry="10" fill={c} />
      <path d="M50 87 L70 87 L72 100 L48 100 Z" fill={c} />
      <path d="M4 132 C8 110 30 100 60 98 C90 100 112 110 116 132 Z" fill={c} />
    </svg>
  );
}

function GeometricMark({ t }: { t: Theme }) {
  const ink = t.fg, paper = t.bg;
  return (
    <svg width={120} height={132} viewBox="0 0 120 132" fill="none" aria-hidden>
      {/* Square head */}
      <rect x="16" y="6" width="88" height="84" rx="14" fill={ink} />
      {/* Brow bar */}
      <rect x="24" y="28" width="72" height="6" rx="3" fill={paper} />
      {/* Left eye */}
      <rect x="26" y="42" width="24" height="16" rx="8" fill={paper} />
      {/* Right eye */}
      <rect x="70" y="42" width="24" height="16" rx="8" fill={paper} />
      {/* Glasses bridge */}
      <rect x="50" y="48" width="20" height="4" fill={paper} />
      {/* Mouth */}
      <rect x="38" y="70" width="44" height="10" rx="5" fill={paper} />
      {/* Neck */}
      <rect x="50" y="90" width="20" height="14" rx="4" fill={ink} />
      {/* Shoulders */}
      <path d="M4 132 C12 114 34 103 60 101 C86 103 108 114 116 132 Z" fill={ink} />
    </svg>
  );
}

function CartoonMark({ t }: { t: Theme }) {
  const ink = t.fg, paper = t.bg;
  return (
    <svg width={120} height={132} viewBox="0 0 120 132" fill="none" aria-hidden>
      {/* Big round head */}
      <circle cx="60" cy="54" r="46" fill={ink} />
      {/* Big eyes */}
      <circle cx="43" cy="48" r="12" fill={paper} />
      <circle cx="77" cy="48" r="12" fill={paper} />
      {/* Pupils */}
      <circle cx="46" cy="51" r="7" fill={ink} />
      <circle cx="80" cy="51" r="7" fill={ink} />
      {/* Eye shine */}
      <circle cx="48" cy="48" r="2" fill={paper} />
      <circle cx="82" cy="48" r="2" fill={paper} />
      {/* Smile */}
      <path d="M44 68 Q60 82 76 68" stroke={paper} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      {/* Blush */}
      <ellipse cx="28" cy="62" rx="9" ry="6" fill={ACC} opacity="0.55" />
      <ellipse cx="92" cy="62" rx="9" ry="6" fill={ACC} opacity="0.55" />
      {/* Neck */}
      <rect x="50" y="98" width="20" height="14" rx="5" fill={ink} />
      {/* Shoulders */}
      <path d="M6 132 C14 112 36 102 60 100 C84 102 106 112 114 132 Z" fill={ink} />
    </svg>
  );
}

function PixelMark({ t }: { t: Theme }) {
  const fill = t.fg;
  const map = [
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,0,0,1,1,0,0,1,1],
    [1,1,0,0,1,1,0,0,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,0,1,1,1,1,0,1,1],
    [1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,0,0],
  ];
  const W = map[0].length, H = map.length;
  return (
    <svg width={120} height={Math.round(120 * H / W)} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden
      style={{ imageRendering: 'pixelated' } as React.CSSProperties}>
      {map.map((row, y) =>
        row.map((cell, x) =>
          cell ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} /> : null
        )
      )}
    </svg>
  );
}

function LowPolyMark({ t }: { t: Theme }) {
  const ink = t.fg, paper = t.bg;
  return (
    <svg width={120} height={132} viewBox="0 0 120 132" fill="none" aria-hidden>
      {/* Big triangle head */}
      <polygon points="60,6 10,90 110,90" fill={ink} />
      {/* Lower face / jaw */}
      <polygon points="10,90 110,90 88,116 32,116" fill={ink} />
      {/* Accent triangle — hair ridge */}
      <polygon points="60,6 44,42 76,42" fill={ACC} opacity="0.75" />
      {/* Left eye */}
      <polygon points="30,66 42,57 42,75" fill={paper} />
      {/* Right eye */}
      <polygon points="90,66 78,57 78,75" fill={paper} />
      {/* Mouth — pointing down = smile */}
      <polygon points="44,89 60,100 76,89" fill={paper} />
      {/* Neck */}
      <rect x="50" y="116" width="20" height="12" rx="3" fill={ink} />
      {/* Shoulders */}
      <path d="M6 132 C14 114 36 103 60 101 C84 103 106 114 114 132 Z" fill={ink} />
    </svg>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ label, num }: { label: string; num: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--sub)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{num}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
      <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--ink)' }}>{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PlaygroundPage() {
  const [dark, setDark] = useState(true);
  const t = dark ? DARK : LIGHT;

  return (
    <main className="page-enter">

      {/* Header */}
      <section style={{ borderBottom: '1px solid var(--rule)', paddingTop: 72, paddingBottom: 64 }}>
        <div className="container" style={{ padding: '0 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sub)', background: 'var(--bone-3)', padding: '4px 10px', borderRadius: 999 }}>
              Not linked
            </span>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sub)', background: 'var(--bone-3)', padding: '4px 10px', borderRadius: 999 }}>
              Design scratchpad
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-inter)', fontWeight: 900, fontSize: 'clamp(48px, 6vw, 80px)', letterSpacing: '-0.045em', lineHeight: 1, margin: '0 0 16px', color: 'var(--ink)' }}>
            Logo<br />Playground
          </h1>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 17, color: 'var(--sub)', maxWidth: '48ch', margin: 0, lineHeight: 1.6 }}>
            Messing around with marks, monograms, and faces. Nothing precious — just vibes.
          </p>

          {/* Toggle */}
          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--sub)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Card bg:
            </span>
            <button
              onClick={() => setDark(d => !d)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 999,
                background: dark ? '#111110' : '#E2DCCE',
                color: dark ? '#ECE7DC' : '#111110',
                border: '1px solid var(--rule-strong)',
                fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 180ms ease',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: dark ? '#ECE7DC' : '#111110', display: 'inline-block' }} />
              {dark ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>
      </section>

      {/* Text Marks */}
      <section style={{ padding: '64px 0 72px' }}>
        <div className="container" style={{ padding: '0 48px' }}>
          <SectionLabel num="01" label="Text Marks" />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            <Card t={t} title="Square Badge" desc="Monogram · monospace">
              <BadgeMark t={t} />
            </Card>
            <Card t={t} title="Round Badge" desc="Monogram · circle">
              <BadgeRoundMark t={t} />
            </Card>
            <Card t={t} title="Accent Badge" desc="Monogram · red">
              <BadgeAccentMark />
            </Card>
            <Card t={t} title="JB." desc="Period as punctuation accent">
              <PeriodMark t={t} />
            </Card>
            <Card t={t} title="jb" desc="Lowercase · italic serif">
              <SerifMark t={t} />
            </Card>
            <Card t={t} title="J/B" desc="Slash mark · bold sans">
              <SlashMark t={t} />
            </Card>
            <Card t={t} title="&lt;JB /&gt;" desc="Code tag · monospace">
              <CodeTagMark t={t} />
            </Card>
            <Card t={t} title="JB█" desc="Terminal · blinking cursor">
              <TerminalMark t={t} />
            </Card>
            <Card t={t} title="JBUSSEY" desc="Compressed wordmark">
              <CompressedMark t={t} />
            </Card>
            <Card t={t} title="Joshua / BUSSEY" desc="Contrast weight wordmark">
              <WordmarkMark t={t} />
            </Card>
            <Card t={t} title="Stamp" desc="Circular seal · SVG textPath" wide>
              <StampMark t={t} />
            </Card>
          </div>
        </div>
      </section>

      {/* Illustrated Marks */}
      <section style={{ padding: '0 0 96px', borderTop: '1px solid var(--rule)' }}>
        <div className="container" style={{ padding: '64px 48px 0' }}>
          <SectionLabel num="02" label="Illustrated Marks" />
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 14, color: 'var(--sub)', margin: '0 0 28px', maxWidth: '52ch', lineHeight: 1.6 }}>
            Head silhouettes, cartoon faces, and abstract representations. What if the logo was <em>me</em>?
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            <Card t={t} title="Silhouette" desc="Head + shoulders · pure shape">
              <SilhouetteMark t={t} />
            </Card>
            <Card t={t} title="Geometric" desc="Square head · glasses · Bauhaus">
              <GeometricMark t={t} />
            </Card>
            <Card t={t} title="Cartoon" desc="Big eyes · round head · kooky">
              <CartoonMark t={t} />
            </Card>
            <Card t={t} title="Pixel" desc="8-bit face · grid art">
              <PixelMark t={t} />
            </Card>
            <Card t={t} title="Low-Poly" desc="Triangle face · angular">
              <LowPolyMark t={t} />
            </Card>
          </div>
        </div>
      </section>

    </main>
  );
}
