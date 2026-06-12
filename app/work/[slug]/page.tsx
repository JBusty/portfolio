'use client';

import { createPortal } from 'react-dom';
import { use, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDraftingCompass, faFlag } from '@fortawesome/free-solid-svg-icons';
import ScrollReveal from '@/components/ScrollReveal';
import SectionHead from '@/components/SectionHead';
import { getCaseStudy } from '@/lib/caseStudies';
import { PROJECTS } from '@/lib/data';
import heroStyles from '../../page.module.css';

type EnhancedStep = {
  n: string;
  h: string;
  body: string;
  isBookend?: boolean;
  images?: string[];
  captions?: Array<{ label: string; body: string }>;
};

export default function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const p = PROJECTS.find((project) => project.slug === slug);
  if (!p) notFound();

  const study = getCaseStudy(p);
  const idx = PROJECTS.indexOf(p);
  const next = PROJECTS[(idx + 1) % PROJECTS.length];
  const prev = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length];

  const hasWireframes = (study.images?.wireframes?.length ?? 0) > 0;
  const hasSolution = (study.images?.solution?.length ?? 0) > 0;

  const timelineSteps: EnhancedStep[] = [
    ...(hasWireframes ? [{
      n: '↗',
      h: 'Exploration',
      body: 'Low-fidelity wireframes mapped the core layout and key interactions before any visual decisions were locked in.',
      isBookend: true,
      images: study.images!.wireframes,
      captions: study.images!.wireframeCaptions,
    }] : []),
    ...study.processSteps,
    ...(hasSolution ? [{
      n: '✓',
      h: 'Shipped',
      body: 'The final experience, tested with customers and validated through iteration.',
      isBookend: true,
      images: study.images!.solution,
      captions: study.images!.solutionCaptions,
    }] : []),
  ];

  return (
    <main className="page-enter">
      <section style={{ borderBottom: '1px solid var(--ink)', background: 'var(--hero-case)' }}>
        <div className="container sp-hero" style={{ padding: '66px 32px 88px' }}>
          <div
            className="mono upper"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 24,
              justifyContent: 'space-between',
              fontSize: 12,
              letterSpacing: '0.08em',
              paddingBottom: 24,
              borderBottom: '1px solid var(--rule)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Link href="/work" className="link-u" style={{ color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--accent)', fontSize: 14 }}>←</span>
                Work
              </Link>
              <span style={{ color: 'var(--accent)', opacity: 0.5 }}>/</span>
              <span style={{ color: 'var(--ink-2)' }}>{p.title}</span>
            </span>
          </div>

          <div className="r-hero-meta" style={{ marginTop: 56 }}>
            <div>
              <h1
                className={`tight ${heroStyles.heroTitle}`}
                style={{
                  fontSize: 'clamp(40px, 7vw, 80px)',
                  lineHeight: 1.05,
                  maxWidth: '12ch',
                }}
              >
                {renderAnimatedHeroTitle(p.title)}
              </h1>
              <p
                style={{
                  margin: '32px 0 0',
                  fontSize: 'clamp(17px, 1.5vw, 22px)',
                  lineHeight: 1.5,
                  color: 'var(--ink-2)',
                  maxWidth: '56ch',
                }}
              >
                {p.blurb}
              </p>
            </div>

            <div
              style={{
                border: '1px solid var(--ink)',
                padding: 24,
                background: 'var(--paper)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                className="mono upper"
                style={{
                  fontSize: 11,
                  color: 'var(--sub)',
                  letterSpacing: '0.08em',
                  paddingBottom: 12,
                  marginBottom: 16,
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                Project metadata
              </div>
              <dl className="meta-col">
                <dt>Client</dt>
                <dd>
                  {study.images?.logo ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={study.images.logo} alt={p.company} style={{ height: 20, width: 'auto', display: 'block' }} />
                      {p.company}
                    </span>
                  ) : p.company}
                </dd>
                <dt>Role</dt>
                <dd>{p.role}</dd>
                <dt>Team</dt>
                <dd>{p.team}</dd>
                <dt>Shipped</dt>
                <dd>{p.quarter}</dd>
                <dt>Type</dt>
                <dd>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.tags.map((tag) => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </dd>
                <dt>Result</dt>
                <dd style={{ color: 'var(--accent)', fontWeight: 500 }}>{p.metric}</dd>
              </dl>
            </div>
          </div>
        </div>
      </section>

<section style={{ background: 'var(--ink)', color: 'var(--bone)' }}>
        <ScrollReveal as="div" className="container" style={{ padding: '40px' }}>
          <div className="r-outcome">
            <OutcomeColumn label="Friction" title="Pain points for the customer" items={study.outcomes.painPoints} />
            <OutcomeColumn label="My Role" title="What I owned during the process" items={study.outcomes.role} />
            <OutcomeColumn label="Outcome" title="What I shipped" items={study.outcomes.shipped} last />
          </div>
        </ScrollReveal>
      </section>

      <section>
        <div style={{ borderTop: '1px solid var(--ink)' }}>
          <ScrollReveal as="div" className="container r-problem-full" style={{ padding: '80px 32px 160px', gap: '96px' }}>
            <div>
              <div className="mono upper" style={{
                fontSize: 12,
                letterSpacing: '0.22em',
                color: 'var(--accent)',
                marginBottom: 24,
              }}>
                The TL;DR<span className="accent">.</span>
              </div>
              <h2 className="tight" style={{
                margin: 0,
                fontSize: 'clamp(36px, 5vw, 80px)',
                lineHeight: 0.96,
                letterSpacing: '-0.04em',
                fontWeight: 700,
                maxWidth: '16ch',
              }}>
                Summary
              </h2>
              <p style={{ ...cssCopy(), marginTop: 40 }}>
                {study.summary}
              </p>
            </div>
            {study.images?.problem && <ProblemImage src={study.images.problem} />}
          </ScrollReveal>
        </div>
      </section>

      <section>
        <div style={{ borderTop: '1px solid var(--ink)' }}>
          <ScrollReveal as="div" className="container" style={{ padding: '80px 32px 160px' }}>
            <div>
              <div className="mono upper" style={{
                fontSize: 12,
                letterSpacing: '0.22em',
                color: 'var(--accent)',
                marginBottom: 24,
              }}>
                {renderSubTitle(study.problemTitle)}
              </div>
              <h2 className="tight" style={{
                margin: 0,
                fontSize: 'clamp(36px, 5vw, 80px)',
                lineHeight: 0.96,
                letterSpacing: '-0.04em',
                fontWeight: 700,
                maxWidth: '16ch',
              }}>
                The Problem
              </h2>
              <div style={{ display: 'grid', gap: 20, marginTop: 40 }}>
                {study.problemBody.map((paragraph, index) => (
                  <p key={`${p.slug}-problem-${index}`} style={cssCopy()}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <KeyDecisionBlock
        question={study.decisionQuestion}
        context={study.decisionContext}
        answerTitle={study.decisionAnswerTitle}
        answerBody={study.decisionAnswerBody}
      />

      <CSection eyebrow={renderSubTitle(study.solutionTitle)} title="The Solution">
        {study.solutionIntro ? <p style={cssCopy()}>{study.solutionIntro}</p> : null}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
            marginTop: study.solutionIntro ? 32 : 8,
          }}
        >
          {study.solutionCards.map((card) => (
            <div
              key={card.n}
              style={{
                border: '1px solid var(--rule)',
                padding: 24,
                background: 'var(--paper)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div className="tight" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em' }}>
                {card.h}
              </div>
              <p style={{ margin: '12px 0 0', color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55 }}>{card.b}</p>
            </div>
          ))}
        </div>
      </CSection>

      <CSection eyebrow={renderSubTitle(study.processTitle)} title="The Process">
        <ProcessTimeline steps={timelineSteps} />
      </CSection>

      <CSection eyebrow={<>What worked. What got tricky<span className="accent">.</span></>} title="Reflection">
        <div className="r-reflect" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--ink)',
        }}>
          <ReflectionColumn title="Tough spots" items={study.reflection.challenges} isWins={false} />
          <ReflectionColumn title="What went right" items={study.reflection.wins} isWins />
        </div>
      </CSection>

      <section style={{ borderTop: '1px solid var(--ink)', background: 'var(--paper)' }}>
        <ScrollReveal as="div" className="container sp-case-nav" style={{ padding: '112px 32px 160px' }}>
          <div className="r-grid-2">
            <NavCard dir="prev" p={prev} />
            <NavCard dir="next" p={next} />
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}

function LockIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <g style={{
        transformOrigin: '7px 11px',
        transform: open ? 'rotate(-45deg)' : 'rotate(0deg)',
        transition: 'transform 500ms cubic-bezier(.2,.7,.2,1)',
      }}>
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </g>
    </svg>
  );
}

function KeyDecisionBlock({ question, context, answerTitle, answerBody }: {
  question: string;
  context: string;
  answerTitle: string;
  answerBody: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999, on: false });
  const [revealed, setRevealed] = useState(false);

  return (
    <section
      ref={sectionRef}
      onMouseMove={e => {
        const r = sectionRef.current!.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top, on: true });
      }}
      onMouseLeave={() => setPos(p => ({ ...p, on: false }))}
      style={{ position: 'relative', overflow: 'hidden', background: 'var(--ink)', color: 'var(--bone)' }}
    >
      {/* Mouse spotlight */}
      <div style={{
        position: 'absolute',
        width: 700,
        height: 700,
        borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(225,59,20,0.22), transparent 70%)',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%,-50%)',
        opacity: pos.on ? 1 : 0,
        transition: 'opacity 300ms ease',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Animated grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(236,231,220,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(236,231,220,0.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <ScrollReveal as="div" className="container sp-case-key" style={{ position: 'relative', zIndex: 1, padding: '140px 32px 160px', textAlign: 'center' }}>
        <div style={{ marginBottom: 48, display: 'flex', alignItems: 'center', gap: 16, maxWidth: '800px', margin: '0 auto 48px' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(225,59,20,0.35)' }} />
          <span className="mono upper" style={{
            fontSize: 12,
            letterSpacing: '0.14em',
            color: 'var(--accent)',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(225,59,20,0.5)',
            background: 'rgba(225,59,20,0.1)',
            borderRadius: 999,
            padding: '6px 18px',
          }}>
            Key Decision
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(225,59,20,0.35)' }} />
        </div>

        <div
          className="serif"
          style={{
            fontStyle: 'italic',
            fontSize: 'clamp(26px, 3.5vw, 52px)',
            lineHeight: 1.2,
            maxWidth: '26ch',
            margin: '0 auto',
            color: 'var(--bone)',
            letterSpacing: '0.01em',
          }}
        >
          "{question}"
        </div>

        <div style={{ margin: '36px auto 0', maxWidth: '58ch', fontSize: 17, lineHeight: 1.65, color: 'rgba(236,231,220,0.72)' }}>
          {context}
        </div>

        {/* Decision card */}
        <div
          onClick={() => setRevealed(r => !r)}
          style={{
            marginTop: 64,
            width: '100%',
            maxWidth: '800px',
            margin: '64px auto 0',
            border: `1px solid ${revealed ? 'var(--accent)' : 'rgba(236,231,220,0.15)'}`,
            background: revealed ? 'rgba(225,59,20,0.08)' : 'rgba(236,231,220,0.03)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'border-color 300ms, background 300ms, box-shadow 300ms',
            boxShadow: revealed ? '0 0 60px -20px rgba(225,59,20,0.35)' : '0 0 0 0 transparent',
          }}
        >
          {/* Collapsed CTA */}
          <div style={{
            padding: '28px 36px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 24,
            borderBottom: `1px solid ${revealed ? 'rgba(225,59,20,0.2)' : 'transparent'}`,
            transition: 'border-color 300ms',
          }}>
            <div>
              <div className="mono upper" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--accent)', marginBottom: 8 }}>
                The Decision
              </div>
              <div className="tight" style={{
                fontSize: 'clamp(26px, 3vw, 42px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                color: revealed ? 'var(--bone)' : 'rgba(236,231,220,0.45)',
                filter: revealed ? 'none' : 'blur(6px)',
                transition: 'color 400ms, filter 400ms',
                userSelect: 'none',
              }}>
                {answerTitle}
              </div>
            </div>
            <div style={{
              flexShrink: 0,
              width: 52, height: 52,
              border: `1px solid ${revealed ? 'var(--accent)' : 'rgba(236,231,220,0.2)'}`,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: revealed ? 'var(--accent)' : 'rgba(236,231,220,0.5)',
              transition: 'all 280ms cubic-bezier(.2,.7,.2,1)',
            }}>
              <LockIcon open={revealed} />
            </div>
          </div>

          {/* Expanded body */}
          <div style={{
            display: 'grid',
            gridTemplateRows: revealed ? '1fr' : '0fr',
            transition: 'grid-template-rows 400ms cubic-bezier(.2,.7,.2,1)',
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ padding: '28px 36px 36px' }}>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 14, color: 'rgba(236,231,220,0.75)', letterSpacing: '0.02em', lineHeight: 1.7 }}>
                  {answerBody}
                </div>
              </div>
            </div>
          </div>

          {!revealed && (
            <div className="mono upper" style={{ padding: '0 36px 24px', fontSize: 10, color: 'rgba(236,231,220,0.3)', letterSpacing: '0.14em' }}>
              Click to unlock →
            </div>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}

function CSection({ title, eyebrow, children }: { title: ReactNode; eyebrow?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <SectionHead title={title} eyebrow={eyebrow} />
      <ScrollReveal as="div" className="container sp-bot-sm" style={{ padding: '0 32px 160px' }}>
        {children}
      </ScrollReveal>
    </section>
  );
}

function ProblemImage({ src }: { src: string }) {
  const [hover, setHover] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'block',
          width: '100%',
          padding: 0,
          border: 'none',
          position: 'relative',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          cursor: 'zoom-in',
          transform: hover ? 'scale(1.035) rotate(-1.2deg)' : 'scale(1) rotate(0deg)',
          boxShadow: hover
            ? '0 40px 80px -24px rgba(17,17,16,0.38), 0 0 0 1px rgba(225,59,20,0.18)'
            : '0 8px 24px -12px rgba(17,17,16,0.14)',
          transition: 'transform 440ms cubic-bezier(.2,.7,.2,1), box-shadow 440ms cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <img
          src={src}
          alt=""
          style={{
            width: '100%',
            display: 'block',
            filter: hover ? 'brightness(1.05) saturate(1.08)' : 'brightness(1) saturate(1)',
            transition: 'filter 440ms ease',
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 55%)',
          opacity: hover ? 1 : 0,
          transition: 'opacity 440ms ease',
          pointerEvents: 'none',
        }} />
      </button>
      {modalOpen && <ModalViewer src={src} onClose={() => setModalOpen(false)} />}
    </>
  );
}

function OutcomeColumn({
  label,
  title,
  items,
  last = false,
}: {
  label: string;
  title: string;
  items: string[];
  last?: boolean;
}) {
  return (
    <div
      className="outcome-col"
      style={{
        padding: '40px 28px',
        borderRight: last ? 'none' : '1px solid rgba(236,231,220,0.18)',
        paddingLeft: 28,
        paddingRight: last ? 0 : 28,
      }}
    >
      <h3 className="tight" style={{ margin: 0, fontSize: 'clamp(44px, 5vw, 72px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.95, color: 'var(--bone)' }}>
        {label}
      </h3>
      <div className="mono upper" style={{ marginTop: 18, fontSize: 10, color: 'rgba(236,231,220,0.45)', letterSpacing: '0.1em' }}>
        — {title}
      </div>
      <ul style={{ margin: '20px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, index) => (
          <li
            key={`${label}-${index}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '20px 1fr',
              gap: 8,
              padding: '10px 0',
              borderTop: '1px solid rgba(236,231,220,0.12)',
              fontSize: 14,
              lineHeight: 1.5,
              color: 'rgba(236,231,220,0.9)',
            }}
          >
            <span style={{ color: 'var(--accent)' }}>&#8599;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReflectionColumn({
  title,
  items,
  isWins,
}: {
  title: string;
  items: string[];
  isWins: boolean;
}) {
  return (
    <div style={{
      background: isWins ? 'var(--ink)' : 'var(--bone)',
      padding: '40px 36px 52px',
      borderRight: isWins ? '1px solid rgba(236,231,220,0.12)' : 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        paddingBottom: 28,
        marginBottom: 28,
        borderBottom: `1px solid ${isWins ? 'rgba(236,231,220,0.10)' : 'rgba(17,17,16,0.08)'}`,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: isWins ? 'rgba(225,59,20,0.18)' : 'rgba(17,17,16,0.07)',
          fontSize: 14, color: 'var(--accent)',
        }}>
          {isWins ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2,7 5.5,10.5 12,3.5" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="11" y2="11" />
              <line x1="11" y1="3" x2="3" y2="11" />
            </svg>
          )}
        </span>
        <span className="mono upper" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.12em' }}>
          {title}
        </span>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {items.map((item, i) => (
          <ReflectionItem key={i} item={item} isWins={isWins} last={i === items.length - 1} />
        ))}
      </ul>
    </div>
  );
}

function ReflectionItem({ item, isWins, last }: {
  item: string;
  isWins: boolean;
  last: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '20px 0',
        borderBottom: last ? 'none' : `1px solid ${isWins ? 'rgba(236,231,220,0.08)' : 'rgba(17,17,16,0.07)'}`,
        transform: hover ? 'translateX(8px)' : 'translateX(0)',
        transition: 'transform 260ms cubic-bezier(.2,.7,.2,1)',
        cursor: 'default',
      }}
    >
      <p style={{
        margin: 0, fontSize: 17, lineHeight: 1.6,
        color: isWins
          ? (hover ? 'var(--bone)' : 'rgba(236,231,220,0.72)')
          : (hover ? 'var(--ink)' : 'var(--ink-2)'),
        transition: 'color 220ms ease',
      }}>
        {item}
      </p>
    </li>
  );
}

function cssCopy(): CSSProperties {
  return {
    margin: 0,
    fontSize: 'clamp(17px, 1.5vw, 21px)',
    lineHeight: 1.55,
    color: 'var(--ink-2)',
    maxWidth: '62ch',
  };
}

function renderSubTitle(lines: string[]) {
  return <>{lines.join(' ')}<span className="accent">.</span></>;
}

function renderAnimatedHeroTitle(title: string) {
  const words = title.trim().split(/\s+/);
  const midpoint = words.length > 3 ? Math.ceil(words.length / 2) : words.length;
  const lines = words.length > 3
    ? [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')]
    : [title];

  return (
    <>
      {lines.map((line, index) => (
        <span
          key={`${line}-${index}`}
          className={heroStyles.heroLine}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {line}
          {index === lines.length - 1 ? <span className="accent">.</span> : null}
        </span>
      ))}
    </>
  );
}

function ProcessTimeline({ steps }: { steps: EnhancedStep[] }) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [modalSrc, setModalSrc] = useState<string | null>(null);
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

  const current = steps[active];

  return (
    <>
      <div className="r-journey">
        {/* Sticky scrubber */}
        <div className="r-journey-sidebar" style={{ position: 'sticky', top: 100, alignSelf: 'start' }}>
          {current.isBookend ? (
            <FontAwesomeIcon
              icon={current.n === '↗' ? faDraftingCompass : faFlag}
              style={{ width: 48, height: 48, color: 'var(--accent)' }}
            />
          ) : (
            <div className="tight" style={{
              fontSize: 88, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1,
              display: 'flex', alignItems: 'baseline', gap: 2,
            }}>
              <span style={{ color: 'var(--accent)' }}>{current.n}</span>
              <span className="mono" style={{ fontSize: 16, color: 'var(--sub)', letterSpacing: 0, fontWeight: 500 }}>
                / {String(steps.length).padStart(2, '0')}
              </span>
            </div>
          )}
          <div style={{ overflow: 'hidden', marginTop: 20, minHeight: 72 }}>
            <div key={active} style={{ animation: 'phaseSwap 380ms cubic-bezier(.2,.7,.2,1)' }}>
              <div className="tight" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {current.h}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
            {steps.map((step, i) => (
              <button
                key={`${step.n}-${i}`}
                onClick={() => {
                  const el = stepRefs.current[i];
                  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
                }}
                title={step.h}
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

        {/* Timeline track */}
        <div ref={trackRef} className="r-process-track" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 15, top: 12, bottom: 12, width: 2, background: 'var(--rule)' }} />
          <div style={{ position: 'absolute', left: 15, top: 12, width: 2, height: `calc((100% - 24px) * ${progress})`, background: 'var(--accent)', transition: 'height 80ms linear' }} />
          {steps.map((step, i) => {
            const isActive = i === active;
            const isPast = i < active;
            return (
              <div
                key={`${step.n}-${i}`}
                className="r-process-step"
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
                {!step.isBookend && (
                  <div className="mono upper" style={{ fontSize: 10, color: 'var(--sub)', letterSpacing: '0.12em' }}>
                    Step {step.n}
                  </div>
                )}
                <h4 className="tight" style={{ margin: step.isBookend ? '0' : '12px 0 0', fontSize: 'clamp(26px, 3vw, 44px)', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.02 }}>
                  {step.h}
                </h4>
                <p style={{ margin: '16px 0 0', fontSize: 17, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: '58ch' }}>
                  {step.body}
                </p>
                {step.images && step.images.length > 0 && (
                  <div className="r-process-gallery" style={{
                    marginTop: 28,
                    display: 'grid',
                    gridTemplateColumns: step.n === '↗'
                      ? 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))'
                      : step.n === '✓'
                        ? 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))'
                        : 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
                    gap: step.n === '↗' ? 16 : step.n === '✓' ? 36 : 28,
                    maxWidth: step.n === '↗'
                      ? 480
                      : step.n === '✓'
                        ? 822
                        : undefined,
                  }}>
                    {step.images.map((src, idx) => (
                      <TimelineGalleryItem
                        key={src}
                        src={src}
                        caption={step.captions?.[idx]}
                        onClick={() => setModalSrc(src)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {modalSrc && <ModalViewer src={modalSrc} onClose={() => setModalSrc(null)} />}
    </>
  );
}

function TimelineGalleryItem({
  src,
  caption,
  onClick,
}: {
  src: string;
  caption?: { label: string; body: string };
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: `1px solid ${hover ? 'rgba(225,59,20,0.32)' : 'var(--rule)'}`,
        borderRadius: 'var(--radius)',
        background: 'var(--paper)',
        overflow: 'hidden',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 24px 48px -24px rgba(17,17,16,0.28)'
          : '0 10px 24px -20px rgba(17,17,16,0.16)',
        transition: 'transform 240ms cubic-bezier(.2,.7,.2,1), box-shadow 240ms cubic-bezier(.2,.7,.2,1), border-color 180ms ease',
      }}
    >
      <button
        onClick={onClick}
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          border: 'none',
          borderRadius: 0,
          cursor: 'pointer',
          padding: 0,
          background: 'transparent',
        }}
      >
        <img
          src={src}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transform: hover ? 'scale(1.035)' : 'scale(1)',
            filter: hover ? 'brightness(1.02) saturate(1.04)' : 'brightness(1) saturate(1)',
            transition: 'transform 280ms cubic-bezier(.2,.7,.2,1), filter 200ms ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: hover
              ? 'linear-gradient(180deg, rgba(10,8,6,0) 28%, rgba(10,8,6,0.42) 100%)'
              : 'linear-gradient(180deg, rgba(10,8,6,0) 42%, rgba(10,8,6,0.12) 100%)',
            transition: 'background 200ms ease',
            pointerEvents: 'none',
          }}
        >
          <span
            className="mono upper"
            style={{
              fontSize: 10,
              letterSpacing: '0.12em',
              color: 'rgba(236,231,220,0.92)',
              opacity: hover ? 1 : 0.72,
              transform: hover ? 'translateY(0)' : 'translateY(2px)',
              transition: 'opacity 180ms ease, transform 180ms ease',
            }}
          >
            Open image
          </span>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '1px solid rgba(236,231,220,0.26)',
              background: hover ? 'rgba(236,231,220,0.18)' : 'rgba(236,231,220,0.08)',
              color: 'var(--bone)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              opacity: hover ? 1 : 0.82,
              transform: hover ? 'translateX(0)' : 'translateX(-2px)',
              transition: 'background 180ms ease, opacity 180ms ease, transform 180ms ease',
            }}
          >
            +
          </span>
        </div>
      </button>
      {caption && (
        <div style={{ padding: '14px 16px 18px' }}>
          <div className="mono upper" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 4 }}>
            {caption.label}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>
            {caption.body}
          </div>
        </div>
      )}
    </div>
  );
}

function NavCard({ dir, p }: { dir: 'prev' | 'next'; p: typeof PROJECTS[number] }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={`/work/${p.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: '1px solid var(--ink)',
        background: hover ? 'var(--ink)' : 'var(--bone)',
        color: hover ? 'var(--bone)' : 'var(--ink)',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        textAlign: dir === 'prev' ? 'left' : 'right',
        borderRadius: 'var(--radius-lg)',
        transition: 'background 160ms, color 160ms',
      }}
    >
      <div className="mono upper" style={{ fontSize: 11, color: hover ? 'var(--accent)' : 'var(--sub)', letterSpacing: '0.1em' }}>
        {dir === 'prev' ? '< Previous' : 'Next >'}
      </div>
      <div className="mono upper" style={{ fontSize: 11, letterSpacing: '0.08em', color: hover ? 'rgba(236,231,220,0.65)' : 'var(--sub)' }}>
        {p.company} - {p.year}
      </div>
      <div className="tight" style={{ fontSize: 'clamp(28px, 3.4vw, 44px)', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.02 }}>
        {p.title}
      </div>
    </Link>
  );
}

function ThumbnailGallery({ images, captions }: {
  images: string[];
  captions?: Array<{ label: string; body: string }>;
}) {
  const [modalSrc, setModalSrc] = useState<string | null>(null);

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(min(280px, 100%), 1fr))`,
        gap: 16,
      }}>
        {images.map((src, i) => (
          <ThumbnailItem
            key={src}
            src={src}
            index={i}
            label={captions?.[i]?.label}
            body={captions?.[i]?.body}
            onClick={() => setModalSrc(src)}
          />
        ))}
      </div>
      {modalSrc && <ModalViewer src={modalSrc} onClose={() => setModalSrc(null)} />}
    </div>
  );
}

function ThumbnailItem({ src, index, label, body, onClick }: {
  src: string;
  index: number;
  label?: string;
  body?: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div style={{
      border: '1px solid var(--rule)',
      borderRadius: 'var(--radius)',
      background: 'var(--paper)',
      overflow: 'hidden',
      transition: 'box-shadow 240ms, border-color 180ms',
      boxShadow: hover ? '0 24px 48px -24px rgba(17,17,16,0.28)' : '0 2px 8px -4px rgba(17,17,16,0.1)',
    }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          border: 'none',
          borderRadius: 0,
          cursor: 'zoom-in',
          padding: 0,
        }}
      >
        <img
          src={src}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 300ms ease',
            transform: hover ? 'scale(1.04)' : 'scale(1)',
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: hover ? 'rgba(10,8,6,0.28)' : 'rgba(10,8,6,0)',
          transition: 'background 200ms',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            opacity: hover ? 1 : 0,
            transition: 'opacity 200ms',
            fontSize: 11,
            fontFamily: 'var(--font-jetbrains-mono)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(236,231,220,0.9)',
          }}>
            Click to expand
          </div>
        </div>
      </button>
      {(label || body) && (
        <div style={{ padding: '14px 16px 16px' }}>
          {label && (
            <div className="mono upper" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 5 }}>
              {label}
            </div>
          )}
          {body && (
            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>
              {body}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModalViewer({ src, onClose }: { src: string; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: visible ? 'rgba(10,8,6,0.88)' : 'rgba(10,8,6,0)',
        backdropFilter: visible ? 'blur(14px)' : 'blur(0px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 320ms ease, backdrop-filter 320ms ease',
      }}
    >
      <img
        src={src}
        alt=""
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '88vh',
          objectFit: 'contain',
          borderRadius: 'var(--radius)',
          boxShadow: '0 48px 96px rgba(0,0,0,0.6)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.94)',
          transition: 'opacity 360ms ease, transform 420ms cubic-bezier(.2,.7,.2,1)',
        }}
      />
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 24,
          right: 28,
          background: 'rgba(236,231,220,0.08)',
          border: '1px solid rgba(236,231,220,0.2)',
          color: 'var(--bone)',
          width: 44,
          height: 44,
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: visible ? 1 : 0,
          transition: 'opacity 280ms ease 80ms, background 160ms',
        }}
      >
        ✕
      </button>
    </div>,
    document.body,
  );
}

