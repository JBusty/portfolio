'use client';

import { useState, useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react';
import SectionHead from '@/components/SectionHead';
import FeaturedWork from '@/components/FeaturedWork';
import Mark from '@/components/Mark';
import { VALUES, JOURNEY, FAQ, COMPANIES } from '@/lib/data';
import MachineHero from '@/components/home/MachineHero';
import ProcessLine from '@/components/home/ProcessLine';
import Results from '@/components/home/Results';
import { useSeen } from '@/components/home/useSeen';

// ---------- HOME ----------
export default function Home() {
  return (
    <main id="main-content" tabIndex={-1} className="page-enter">
      <MachineHero />
      <FeaturedWork />
      <HomeValues />
      <ProcessLine />
      <HomeJourney />
      <HomeFAQ />
      <HomeCompanies />
    </main>
  );
}

// ---------- VALUES ----------
function HomeValues() {
  const [ref, seen] = useSeen<HTMLElement>(0.2);
  return (
    <section ref={ref} id="values" data-own-reveal className={`vals${seen ? ' seen' : ''}`} style={{ background: 'var(--bone)', overflow: 'hidden' }}>
      <div className="container sp-large" style={{ padding: '120px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 32, flexWrap: 'wrap', marginBottom: 64 }}>
          <div>
            <h2 className="tight vals-h" style={{
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
        <div className="r-grid-values">
          {VALUES.map((v, i) => <Rise key={v.title} i={i}><ValueCard v={v} /></Rise>)}
        </div>
      </div>
    </section>
  );
}

// Each card triggers on its own, so on phones (one column) they rise in as you reach them.
function Rise({ i, children }: { i: number; children: ReactNode }) {
  const [ref, seen] = useSeen<HTMLDivElement>(0.25);
  return (
    <div ref={ref} className={`deal${seen ? ' seen' : ''}`} style={{ '--i': i } as CSSProperties}>
      {children}
    </div>
  );
}

function ValueCard({ v }: { v: typeof VALUES[number] }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: 'var(--paper)',
        border: `1px solid ${hover ? 'var(--accent)' : 'var(--rule)'}`,
        borderRadius: 'var(--radius)',
        padding: '28px 28px 24px',
        minHeight: 360,
        display: 'flex',
        flexDirection: 'column',
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 340ms cubic-bezier(.2,.7,.2,1), border-color 220ms, box-shadow 240ms',
        boxShadow: hover
          ? '0 24px 56px -28px rgba(27, 34, 51, 0.38)'
          : '0 10px 22px -18px rgba(27, 34, 51, 0.24)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 36, minHeight: 28 }}>
        <ValueGlyph kind={v.kind} hover={hover} />
      </div>

      <h3 className="tight" style={{
        margin: 0,
        fontSize: 'clamp(28px, 2.6vw, 38px)',
        fontWeight: 700,
        letterSpacing: '-0.035em',
        lineHeight: 1,
        color: hover ? 'var(--accent)' : 'var(--ink)',
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

      <p style={{ margin: '20px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: '32ch' }}>
        {v.body}
      </p>

      <div className="mono upper" style={{
        marginTop: 'auto',
        paddingTop: 28,
        fontSize: 10,
        color: 'var(--sub)',
        letterSpacing: '0.14em',
      }}>
        // {v.tag}
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
  if (kind === 'ai') {
    // paired sparkles — the AI mark; they turn and brighten on hover
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', height: 28 }}>
        <svg width="34" height="28" viewBox="0 0 34 28" fill="none" aria-hidden>
          <path
            d="M13 3 C13 8.5 17.5 13 23 13 C17.5 13 13 17.5 13 23 C13 17.5 8.5 13 3 13 C8.5 13 13 8.5 13 3 Z"
            fill="var(--accent)"
            style={{
              transformOrigin: '13px 13px',
              transform: hover ? 'rotate(90deg) scale(1.08)' : 'rotate(0deg) scale(1)',
              transition: 'transform 440ms cubic-bezier(.2,.7,.2,1)',
            }}
          />
          <path
            d="M27 4 C27 6.8 29.2 9 32 9 C29.2 9 27 11.2 27 14 C27 11.2 24.8 9 22 9 C24.8 9 27 6.8 27 4 Z"
            fill="var(--accent)"
            style={{
              transformOrigin: '27px 9px',
              opacity: hover ? 1 : 0.38,
              transform: hover ? 'rotate(90deg) scale(1)' : 'rotate(0deg) scale(0.8)',
              transition: 'transform 440ms cubic-bezier(.2,.7,.2,1) 80ms, opacity 300ms ease 80ms',
            }}
          />
        </svg>
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
    <section id="journey">
      <SectionHead title={<>12 years,<br />one winding road<span className="accent">.</span></>} />
      <Results />
      <div className="container sp-bot-xl" style={{ padding: '0 32px 240px' }}>
        <div className="r-journey">
          {/* Sticky scrubber */}
          <div className="r-journey-sidebar" style={{ position: 'sticky', top: 100, alignSelf: 'start' }}>
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
                <div className="mono" style={{ fontSize: 12, color: 'var(--accent-ink)' }}>{current.range}</div>
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
                    boxShadow: isActive ? '0 0 0 7px rgba(61, 90, 128,0.16)' : 'none',
                    transition: 'all 280ms cubic-bezier(.2,.7,.2,1)',
                  }}>
                    {isActive && <span style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: 'var(--bone)' }} />}
                  </div>
                  <div className="mono upper" style={{ fontSize: 10, color: 'var(--sub)', letterSpacing: '0.12em' }}>
                    Phase 0{i + 1}
                    <span style={{ margin: '0 8px', color: 'var(--rule-strong)' }}>·</span>
                    <span style={{ color: isActive ? 'var(--accent-ink)' : 'var(--sub)' }}>{step.range}</span>
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
                        color: isActive ? 'var(--accent-ink)' : 'var(--sub)',
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
  const baseId = useId();
  return (
    <section id="faq" style={{ background: 'var(--bone-2)' }}>
      <SectionHead title={<>What it's like<br />working with me<span className="accent">.</span></>} />
      <div className="container sp-bot-sm" style={{ padding: '0 32px 160px' }}>
        <div style={{ borderTop: '1px solid var(--rule-strong)' }}>
          {FAQ.map((it, i) => {
            const isOpen = i === openIdx;
            const triggerId = `${baseId}-faq-${i}-trigger`;
            const panelId = `${baseId}-faq-${i}-panel`;
            return (
              <div key={i} style={{ borderBottom: '1px solid var(--rule)', background: isOpen ? 'var(--open-row)' : 'transparent', transition: 'background 220ms' }}>
                <button
                  type="button"
                  id={triggerId}
                  onClick={() => setOpenIdx(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  style={{
                    width: '100%', display: 'grid', gridTemplateColumns: '1fr 40px',
                    gap: 24, alignItems: 'center', padding: '28px 0 28px 20px',
                    background: 'transparent', border: 'none', textAlign: 'left',
                  }}
                >
                  <span className="tight" style={{
                    fontSize: 'clamp(24px, 2.4vw, 32px)', fontWeight: 600, letterSpacing: '-0.025em',
                    color: isOpen ? 'var(--accent)' : 'var(--ink)',
                  }}>{it.q}</span>
                  <span className="mono" aria-hidden="true" style={{
                    fontSize: 22, textAlign: 'right',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
                    transition: 'transform 220ms',
                    color: isOpen ? 'var(--accent)' : 'var(--ink)',
                    display: 'inline-block',
                  }}>+</span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  inert={!isOpen}
                  style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 360ms cubic-bezier(.2,.7,.2,1)',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div className="faq-answer" style={{
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
    <section style={{ background: 'var(--paper)', borderTop: '1px solid var(--edge)' }}>
      <div className="container sp-normal" style={{ padding: '112px 32px 160px' }}>
        <div className="tight" style={{
          fontSize: 'clamp(36px, 5vw, 80px)', lineHeight: 0.96, letterSpacing: '-0.04em', fontWeight: 700,
          maxWidth: '16ch', marginBottom: 48,
        }}>
          A short list of places I've shipped from<span className="accent">.</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {COMPANIES.map(c => (
            <CompanyCard key={c.name} c={c} />
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

function CompanyCard({ c }: { c: typeof COMPANIES[number] }) {
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
        minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        background: hover ? 'var(--ink)' : 'var(--bone)',
        color: hover ? 'var(--bone)' : 'var(--ink)',
        borderColor: hover ? 'var(--ink)' : 'var(--rule)',
        transition: 'background 160ms, color 160ms, border-color 160ms',
        cursor: 'pointer',
        textDecoration: 'none',
      }}
    >
      <div>
        <div className="tight" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' }}>{c.name}</div>
        <div className="mono" style={{ fontSize: 11, marginTop: 8, opacity: 0.7, letterSpacing: '0.04em' }}>// {c.note}</div>
      </div>
    </a>
  );
}
