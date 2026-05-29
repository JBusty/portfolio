'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SectionHead from '@/components/SectionHead';
import ScrollReveal from '@/components/ScrollReveal';
import { PROJECTS, STATS, VALUES, CREW, JOURNEY, FAQ, COMPANIES } from '@/lib/data';
import styles from './page.module.css';

// ---------- HOME ----------
export default function Home() {
  return (
    <main className="page-enter">
      <HomeHero />
      <HomeStats />
      <HomeValues />
      <HomeJourney />
      <HomeFeatured />
      <HomeFAQ />
      <HomeCompanies />
    </main>
  );
}

// ---------- HERO ----------
function HomeHero() {
  const heroRef = useRef<HTMLElement>(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999, on: false });

  return (
    <section
      ref={heroRef}
      onMouseMove={e => {
        const r = heroRef.current!.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top, on: true });
      }}
      onMouseLeave={() => setPos(p => ({ ...p, on: false }))}
      style={{
        position: 'relative',
        borderBottom: '1px solid var(--ink)',
        background: 'var(--hero-home)',
        overflow: 'hidden',
      }}
    >
      <div className="spotlight" style={{ left: pos.x, top: pos.y, opacity: pos.on ? 1 : 0 }} />

      <div className={`container ${styles.heroInner}`}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <h1 className={`tight ${styles.heroTitle}`}>
              <span className={styles.heroLine} style={{ animationDelay: '0ms' }}>
                Designing complex
              </span>
              <span className={styles.heroLine} style={{ animationDelay: '100ms' }}>
                systems that
              </span>
              <span className={`${styles.heroLine} ${styles.heroShipLine}`} style={{ animationDelay: '200ms' }}>
                <span className={styles.heroShip}>ship</span>
                <span className="accent">.</span>
              </span>
            </h1>
            {/*
              ▍ Now serving
            */}
            <p className={styles.heroIntro}>
              Hi, I'm Josh — a front-end developer turned senior product
              designer with 12+ years of experience untangling enterprise
              software. I lead 0→1 work, design systems, and the kind of
              quiet refactors no one notices but everyone benefits from.
            </p>
            <div className={styles.heroActions}>
              <Link href="/work" className="btn">
                View selected work <span className="arr">→</span>
              </Link>
              <Link href="/work/identity-profiles" className="btn ghost">
                Read a case study <span className="arr">↗</span>
              </Link>
            </div>
          </div>

          <div className={styles.heroStackWrap}>
            <PolaroidStack />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- POLAROID STACK ----------
function PolaroidStack() {
  const [order, setOrder] = useState([0, 1, 2]);
  const [shuffling, setShuffling] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const slots = [
    { x: 0, y: 0, r: -4, z: 30, shadow: '0 30px 50px -20px rgba(17,17,16,0.40)' },
    { x: 18, y: 22, r: 3, z: 20, shadow: '0 22px 40px -22px rgba(17,17,16,0.32)' },
    { x: -10, y: 42, r: -1, z: 10, shadow: '0 14px 28px -18px rgba(17,17,16,0.26)' },
  ];

  function shuffle() {
    if (shuffling) return;
    setShuffling(true);
    setTimeout(() => {
      setOrder(o => [o[1], o[2], o[0]]);
      setShuffling(false);
    }, 420);
  }

  function slotForItem(idx: number) {
    return slots[order.indexOf(idx)];
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStart.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = null;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8 || (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy))) shuffle();
  }

  return (
    <div className={styles.polaroidShell}>
      <div
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onMouseMove={e => {
          if (!wrapRef.current) return;
          const r = wrapRef.current.getBoundingClientRect();
          setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -8, y: ((e.clientX - r.left) / r.width - 0.5) * 8 });
        }}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 240ms ease-out',
          touchAction: 'pan-y',
          cursor: shuffling ? 'default' : 'grab',
          userSelect: 'none',
        }}
      >
        {CREW.map((c, i) => {
          const slot = slotForItem(i);
          const isTop = order[0] === i;
          const flying = isTop && shuffling;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 'auto 0 0 0',
                top: 0,
                width: '84%',
                margin: '0 auto',
                background: 'var(--bone)',
                border: '1px solid var(--ink)',
                borderRadius: 'var(--radius)',
                padding: '14px 14px 12px',
                boxShadow: slot.shadow,
                transformOrigin: 'center 70%',
                transform: flying
                  ? `translate(${slot.x - 90}px, ${slot.y - 80}px) rotate(-22deg)`
                  : `translate(${slot.x}px, ${slot.y}px) rotate(${slot.r}deg)`,
                opacity: flying ? 0 : 1,
                transition: 'transform 420ms cubic-bezier(.2,.7,.2,1), opacity 380ms ease, box-shadow 280ms ease',
                zIndex: slot.z,
              }}
            >
              <div className="photo" style={{ aspectRatio: '4/5', borderRadius: 8 }}>
                <img src={c.img} alt={c.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, pointerEvents: 'none' }} />
              </div>
              <div style={{
                paddingTop: 14, paddingBottom: 6,
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12,
              }}>
                <div className="tight" style={{ fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em' }}>
                  {c.name}
                </div>
                <div className="mono upper" style={{ fontSize: 10, color: 'var(--sub)', letterSpacing: '0.1em' }}>
                  {c.role}
                </div>
              </div>
            </div>
          );
        })}

        {/* Rotating stamp */}
        <div style={{ position: 'absolute', top: -28, right: -28, width: 116, height: 116, zIndex: 40, pointerEvents: 'none' }}>
          <div className="stamp-spin" style={{ width: '100%', height: '100%' }}>
            <CircularStamp />
          </div>
        </div>

        {/* Hint */}
        <div className="mono upper" style={{
          position: 'absolute', left: 0, right: 0, bottom: -36,
          textAlign: 'center', fontSize: 11, color: 'var(--sub)', letterSpacing: '0.12em',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 18, height: 18, border: '1px solid var(--rule-strong)', borderRadius: '50%', fontSize: 11,
          }}>↻</span>
          Click the top card to shuffle · {order[0] + 1} / {CREW.length}
        </div>
      </div>
    </div>
  );
}

function CircularStamp() {
  const text = '  ★  AVAILABLE Q3 \'26  ★  HUDSON VALLEY NY  ★  AVAILABLE Q3 \'26  ★  HUDSON VALLEY NY  ';
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
      <defs>
        <path id="stamp-path" d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" fill="none" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="#111110" />
      <circle cx="60" cy="60" r="50" fill="none" stroke="#ECE7DC" strokeWidth={1} strokeDasharray="2 3" />
      <circle cx="60" cy="60" r="22" fill="#E13B14" />
      <text style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: '#ECE7DC', letterSpacing: 1.5, fontWeight: 600 }}>
        <textPath href="#stamp-path" startOffset="0">{text}</textPath>
      </text>
      <text x="60" y="63" textAnchor="middle" style={{
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 9, fontWeight: 700, fill: '#ECE7DC', letterSpacing: 1,
      }}>HI.</text>
    </svg>
  );
}

// ---------- COUNT UP ----------
function parseStatN(n: string): { value: number; suffix: string; fmt: (v: number) => string } {
  if (n.includes('M')) {
    const value = parseInt(n);
    return { value, suffix: 'M+', fmt: v => String(v) };
  }
  const suffix = n.endsWith('+') ? '+' : '';
  const value = parseInt(n.replace(/[^0-9]/g, ''));
  const needsComma = value >= 1000;
  return { value, suffix, fmt: v => needsComma ? v.toLocaleString('en-US') : String(v) };
}

function CountUp({ n, delayMs }: { n: string; delayMs: number }) {
  const { value, suffix, fmt } = parseStatN(n);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(value);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      setTimeout(() => {
        const duration = 1100;
        const start = performance.now();
        function tick(now: number) {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setCount(Math.round(eased * value));
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }, delayMs);
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, delayMs]);

  const final = fmt(value) + suffix;
  const current = fmt(count) + suffix;

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-block', fontVariantNumeric: 'tabular-nums' }}>
      <span style={{ visibility: 'hidden', display: 'block', pointerEvents: 'none' }} aria-hidden>{final}</span>
      <span style={{ position: 'absolute', top: 0, left: 0 }} aria-live="off">{current}</span>
    </span>
  );
}

// ---------- STATS ----------
function HomeStats() {
  return (
    <section style={{ background: 'var(--bone)', borderTop: '1px solid var(--ink)' }}>
      <div className="container" style={{ padding: '112px 32px 128px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {STATS.map((s, i) => (
            <ScrollReveal key={i} delayMs={i * 100} style={{ padding: '4px 28px', borderLeft: i === 0 ? 'none' : '1px solid var(--rule-strong)' }}>
              <div className="tight" style={{
                fontSize: 'clamp(44px, 5.5vw, 84px)',
                lineHeight: 0.95,
                fontWeight: 700,
                letterSpacing: '-0.04em',
              }}>
                <CountUp n={s.n} delayMs={i * 100} />
              </div>
              <div style={{ marginTop: 16, fontSize: 14, color: 'var(--ink-2)', maxWidth: '22ch', lineHeight: 1.45 }}>
                {s.label}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- VALUES ----------
function HomeValues() {
  return (
    <section style={{ background: 'var(--ink)', color: 'var(--bone)', overflow: 'hidden' }}>
      <div className="container" style={{ padding: '160px 32px 208px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 32, flexWrap: 'wrap', marginBottom: 64 }}>
          <div>
            <h2 className="tight" style={{
              margin: 0,
              fontSize: 'clamp(36px, 5vw, 80px)',
              lineHeight: 0.96,
              letterSpacing: '-0.04em',
              fontWeight: 700,
            }}>
              How I show up<span className="accent">.</span>
            </h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {VALUES.map((v, i) => <ValueCard key={v.title} v={v} idx={i} />)}
        </div>
      </div>
    </section>
  );
}

function ValueCard({ v, idx }: { v: typeof VALUES[number]; idx: number }) {
  const [hover, setHover] = useState(false);
  const [noted, setNoted] = useState(false);
  const restRot = [-1.8, 1.2, -1.0][idx];

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setNoted(true)}
      style={{
        position: 'relative',
        background: hover ? 'rgba(236,231,220,0.06)' : 'rgba(236,231,220,0.03)',
        border: `1px solid ${hover ? 'var(--accent)' : 'rgba(236,231,220,0.18)'}`,
        borderRadius: 'var(--radius)',
        padding: '28px 28px 24px',
        minHeight: 360,
        display: 'flex',
        flexDirection: 'column',
        cursor: noted ? 'default' : 'pointer',
        userSelect: 'none',
        transformOrigin: 'center bottom',
        transform: hover && !noted
          ? 'translateY(-8px) rotate(0deg) scale(1.01)'
          : `translateY(0) rotate(${noted ? 0 : restRot}deg) scale(1)`,
        transition: 'transform 340ms cubic-bezier(.2,.7,.2,1), background 220ms, border-color 220ms, box-shadow 240ms',
        boxShadow: hover
          ? '0 24px 56px -28px rgba(0,0,0,0.65)'
          : '0 10px 22px -18px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 36 }}>
        {noted ? (
          <div style={{
            width: 72, height: 72,
            border: '2px dashed var(--accent)',
            borderRadius: '50%',
            background: 'rgba(225,59,20,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9,
            textTransform: 'uppercase', letterSpacing: '0.14em',
            color: 'var(--accent)', textAlign: 'center', lineHeight: 1.1,
            transform: 'rotate(-14deg)',
            animation: 'notedStamp 320ms cubic-bezier(.2,.7,.2,1)',
            flexShrink: 0,
          }}>Noted ✓</div>
        ) : (
          <ValueGlyph kind={v.kind} hover={hover} />
        )}
      </div>

      <h3 className="tight" style={{
        margin: 0,
        fontSize: 'clamp(28px, 2.6vw, 38px)',
        fontWeight: 700,
        letterSpacing: '-0.035em',
        lineHeight: 1,
        color: hover ? 'var(--accent)' : 'var(--bone)',
        transition: 'color 220ms',
      }}>
        {v.title}
        <span style={{
          display: 'block',
          marginTop: 14,
          height: 2,
          background: 'var(--accent)',
          width: hover ? '44px' : '20px',
          transition: 'width 320ms cubic-bezier(.2,.7,.2,1)',
        }} />
      </h3>

      <p style={{ margin: '20px 0 0', fontSize: 15, lineHeight: 1.55, color: 'rgba(236,231,220,0.78)', maxWidth: '32ch' }}>
        {v.body}
      </p>

      <div className="mono upper" style={{
        marginTop: 'auto',
        paddingTop: 28,
        fontSize: 10,
        color: 'rgba(236,231,220,0.42)',
        letterSpacing: '0.14em',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>// {v.tag}</span>
        {!noted && <span style={{ color: 'rgba(236,231,220,0.3)' }}>tap</span>}
      </div>

    </div>
  );
}

function ValueGlyph({ kind, hover }: { kind: string; hover: boolean }) {
  if (kind === 'collab') {
    return (
      <div style={{
        fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 600,
        fontSize: 28, color: 'var(--accent)', lineHeight: 1,
        display: 'inline-flex', alignItems: 'center',
        gap: hover ? 0 : 16, transition: 'gap 320ms cubic-bezier(.2,.7,.2,1)',
      }}>
        <span style={{ display: 'inline-block', transform: hover ? 'translateX(2px)' : 'translateX(0)', transition: 'transform 320ms cubic-bezier(.2,.7,.2,1)' }}>→</span>
        <span style={{ display: 'inline-block', transform: hover ? 'translateX(-2px)' : 'translateX(0)', transition: 'transform 320ms cubic-bezier(.2,.7,.2,1)' }}>←</span>
      </div>
    );
  }
  if (kind === 'relentless') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'end', gap: 4, height: 26 }}>
        {[10, 14, 18, 22, 26].map((h, i) => (
          <span key={i} style={{
            display: 'inline-block', width: 4, height: h,
            background: 'var(--accent)',
            opacity: hover ? 1 : 0.32,
            transform: hover ? 'translateY(0)' : 'translateY(2px)',
            transition: `opacity 200ms ease ${i * 70}ms, transform 240ms cubic-bezier(.2,.7,.2,1) ${i * 70}ms`,
          }} />
        ))}
      </div>
    );
  }
  return (
    <div style={{
      fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 500,
      fontSize: 28, color: 'var(--accent)', lineHeight: 1,
      display: 'inline-flex', alignItems: 'center',
      gap: hover ? 14 : 4, transition: 'gap 320ms cubic-bezier(.2,.7,.2,1)',
    }}>
      <span style={{ display: 'inline-block', transform: hover ? 'rotate(-12deg)' : 'rotate(0deg)', transition: 'transform 320ms cubic-bezier(.2,.7,.2,1)' }}>{'{'}</span>
      <span style={{ display: 'inline-block', transform: hover ? 'rotate(12deg)' : 'rotate(0deg)', transition: 'transform 320ms cubic-bezier(.2,.7,.2,1)' }}>{'}'}</span>
    </div>
  );
}

// ---------- FEATURED WORK ----------
function HomeFeatured() {
  const featured = PROJECTS.slice(0, 3);
  return (
    <section>
      <SectionHead title={<>Work that wasn't<br />just a deck<span className="accent">.</span></>} />
      <div className="container" style={{ padding: '0 32px 160px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {featured.map(p => <FeaturedCard key={p.slug} p={p} />)}
        </div>
        <div style={{
          marginTop: 24,
          padding: '20px 24px',
          border: '1px solid var(--rule)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>
            {PROJECTS.length - 3} more projects — including NDA work, design systems, and a personal build.
          </span>
          <Link href="/work" className="btn">
            View all work <span className="arr">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ p }: { p: typeof PROJECTS[number] }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={`/work/${p.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: '1px solid var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 360,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'transform 200ms, background 200ms',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        background: hover ? 'var(--ink)' : 'var(--paper)',
        color: hover ? 'var(--bone)' : 'var(--ink)',
      }}
    >
      <div className="mono upper" style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: hover ? '1px solid rgba(236,231,220,0.2)' : '1px solid var(--rule)',
        fontSize: 11, letterSpacing: '0.08em',
        color: hover ? 'rgba(236,231,220,0.65)' : 'var(--sub)',
      }}>
        <span>{p.company}</span>
        <span>{p.quarter}</span>
      </div>

      <div style={{ padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <div className="tight" style={{ fontSize: 'clamp(22px, 2vw, 28px)', lineHeight: 1.02, fontWeight: 600, letterSpacing: '-0.035em' }}>
          {p.title}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.45, color: hover ? 'rgba(236,231,220,0.75)' : 'var(--ink-2)', maxWidth: '44ch' }}>
          {p.blurb}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: 12, marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.tags.map(t => (
              <span key={t} className="chip" style={{
                borderColor: hover ? 'rgba(236,231,220,0.45)' : 'var(--rule-strong)',
                color: hover ? 'var(--bone)' : 'var(--ink-2)',
              }}>{t}</span>
            ))}
          </div>
          <span className="mono upper" style={{ fontSize: 11, letterSpacing: '0.1em', color: hover ? 'var(--accent)' : 'var(--ink)' }}>
            View case →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------- JOURNEY ----------
function HomeJourney() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      if (!trackRef.current) return;
      const r = trackRef.current.getBoundingClientRect();
      const triggerY = window.innerHeight * 0.42;
      let idx = 0;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        if (el.getBoundingClientRect().top <= triggerY) idx = i;
      });
      setActive(idx);
      const passed = triggerY - r.top;
      setProgress(Math.max(0, Math.min(1, passed / r.height)));
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const current = JOURNEY[active];

  return (
    <section>
      <SectionHead title={<>12 years,<br />one winding road<span className="accent">.</span></>} />
      <div className="container" style={{ padding: '0 32px 240px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 56 }}>
          {/* Sticky scrubber */}
          <div style={{ position: 'sticky', top: 100, alignSelf: 'start' }}>
            <div className="tight" style={{
              fontSize: 88, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1,
              display: 'flex', alignItems: 'baseline', gap: 2,
            }}>
              <span style={{ color: 'var(--accent)' }}>{String(active + 1).padStart(2, '0')}</span>
              <span className="mono" style={{ fontSize: 16, color: 'var(--sub)', letterSpacing: 0, fontWeight: 500 }}>
                / {String(JOURNEY.length).padStart(2, '0')}
              </span>
            </div>
            <div style={{ overflow: 'hidden', marginTop: 20, minHeight: 90 }}>
              <div key={active} style={{ animation: 'phaseSwap 380ms cubic-bezier(.2,.7,.2,1)' }}>
                <div className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>{current.range}</div>
                <div className="tight" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 8, lineHeight: 1.2 }}>
                  {current.title}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 28, display: 'flex', gap: 10, alignItems: 'center' }}>
              {JOURNEY.map((step, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const el = stepRefs.current[i];
                    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
                  }}
                  title={step.title}
                  style={{
                    width: i === active ? 28 : 10, height: 10,
                    borderRadius: 999, padding: 0, border: 'none',
                    background: i <= active ? 'var(--accent)' : 'var(--rule-strong)',
                    transition: 'all 280ms cubic-bezier(.2,.7,.2,1)',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div ref={trackRef} style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 15, top: 12, bottom: 12, width: 2, background: 'var(--rule)' }} />
            <div style={{ position: 'absolute', left: 15, top: 12, width: 2, height: `calc((100% - 24px) * ${progress})`, background: 'var(--accent)', transition: 'height 80ms linear' }} />
            {JOURNEY.map((step, i) => {
              const isActive = i === active;
              const isPast = i < active;
              return (
                <div
                  key={i}
                  ref={el => { stepRefs.current[i] = el; }}
                  style={{
                    position: 'relative', paddingLeft: 64, paddingTop: 36, paddingBottom: 36,
                    opacity: isActive ? 1 : isPast ? 0.6 : 0.38,
                    transform: isActive ? 'translateY(0)' : 'translateY(2px)',
                    transition: 'opacity 360ms ease, transform 360ms ease',
                  }}
                >
                  <div style={{
                    position: 'absolute', left: 5, top: 52, width: 22, height: 22, borderRadius: '50%',
                    background: isActive || isPast ? 'var(--accent)' : 'var(--bone)',
                    border: `2px solid ${isActive || isPast ? 'var(--accent)' : 'var(--rule-strong)'}`,
                    boxShadow: isActive ? '0 0 0 7px rgba(225,59,20,0.16)' : 'none',
                    transition: 'all 280ms cubic-bezier(.2,.7,.2,1)',
                  }}>
                    {isActive && <span style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: 'var(--bone)' }} />}
                  </div>
                  <div className="mono upper" style={{ fontSize: 10, color: 'var(--sub)', letterSpacing: '0.12em' }}>
                    Phase 0{i + 1}
                    <span style={{ margin: '0 8px', color: 'var(--rule-strong)' }}>·</span>
                    <span style={{ color: isActive ? 'var(--accent)' : 'var(--sub)' }}>{step.range}</span>
                  </div>
                  <h3 className="tight" style={{ margin: '12px 0 0', fontSize: 'clamp(30px, 3.6vw, 52px)', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.02 }}>
                    {step.title}
                  </h3>
                  <p style={{ margin: '16px 0 0', fontSize: 17, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: '58ch' }}>
                    {step.body}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 20 }}>
                    {step.companies.map(co => (
                      <span key={co.name} className="chip" style={{
                        borderColor: isActive ? 'var(--accent)' : 'var(--rule-strong)',
                        color: isActive ? 'var(--accent)' : 'var(--sub)',
                        transition: 'color 280ms, border-color 280ms',
                      }}>{co.name}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- FAQ ----------
function HomeFAQ() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <section>
      <SectionHead title={<>What it's like<br />working with me<span className="accent">.</span></>} />
      <div className="container" style={{ padding: '0 32px 160px' }}>
        <div style={{ borderTop: '1px solid var(--ink)' }}>
          {FAQ.map((it, i) => {
            const isOpen = i === openIdx;
            return (
              <div key={i} style={{ borderBottom: '1px solid var(--rule)' }}>
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : i)}
                  style={{
                    width: '100%', display: 'grid', gridTemplateColumns: '60px 1fr 40px',
                    gap: 24, alignItems: 'center', padding: '28px 0',
                    background: 'transparent', border: 'none', textAlign: 'left',
                  }}
                >
                  <span className="mono" style={{ fontSize: 12, color: 'var(--sub)' }}>Q.0{i + 1}</span>
                  <span className="tight" style={{
                    fontSize: 'clamp(22px, 2.4vw, 32px)', fontWeight: 600, letterSpacing: '-0.025em',
                    color: isOpen ? 'var(--accent)' : 'var(--ink)',
                  }}>{it.q}</span>
                  <span className="mono" style={{
                    fontSize: 22, textAlign: 'right',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
                    transition: 'transform 220ms',
                    color: isOpen ? 'var(--accent)' : 'var(--ink)',
                    display: 'inline-block',
                  }}>+</span>
                </button>
                <div style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 360ms cubic-bezier(.2,.7,.2,1)',
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      padding: '0 0 32px 84px', fontSize: 17, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: '72ch',
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                      transition: 'opacity 280ms ease, transform 360ms cubic-bezier(.2,.7,.2,1)',
                      transitionDelay: isOpen ? '120ms' : '0ms',
                    }}>{it.a}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- COMPANIES ----------
function HomeCompanies() {
  return (
    <section style={{ background: 'var(--paper)', borderTop: '1px solid var(--ink)' }}>
      <div className="container" style={{ padding: '112px 32px 160px' }}>
        <div className="tight" style={{
          fontSize: 'clamp(36px, 5vw, 80px)', lineHeight: 0.96, letterSpacing: '-0.04em', fontWeight: 700,
          maxWidth: '16ch', marginBottom: 48,
        }}>
          A short list of places I've shipped from<span className="accent">.</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {COMPANIES.map((c, i) => (
            <CompanyCard key={c.name} c={c} i={i} />
          ))}
          <div style={{
            padding: '28px 24px', border: '1px dashed var(--rule-strong)',
            borderRadius: 'var(--radius)', minHeight: 160,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--sub)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            + a few NDAs
          </div>
        </div>
      </div>
    </section>
  );
}

function CompanyCard({ c, i }: { c: typeof COMPANIES[number]; i: number }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={c.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '28px 24px', border: '1px solid var(--rule)', borderRadius: 'var(--radius)',
        minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: hover ? 'var(--ink)' : 'var(--bone)',
        color: hover ? 'var(--bone)' : 'var(--ink)',
        borderColor: hover ? 'var(--ink)' : 'var(--rule)',
        transition: 'background 160ms, color 160ms, border-color 160ms',
        cursor: 'pointer',
        textDecoration: 'none',
      }}
    >
      <div className="mono upper" style={{ fontSize: 10, opacity: 0.55, letterSpacing: '0.1em' }}>
        {String(i + 1).padStart(2, '0')}
      </div>
      <div>
        <div className="tight" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>{c.name}</div>
        <div className="mono" style={{ fontSize: 11, marginTop: 8, opacity: 0.7, letterSpacing: '0.04em' }}>// {c.note}</div>
      </div>
    </a>
  );
}
