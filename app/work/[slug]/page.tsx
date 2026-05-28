'use client';

import { use, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ScrollReveal from '@/components/ScrollReveal';
import SectionHead from '@/components/SectionHead';
import { getCaseStudy } from '@/lib/caseStudies';
import { PROJECTS } from '@/lib/data';

export default function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const p = PROJECTS.find((project) => project.slug === slug);
  if (!p) notFound();

  const study = getCaseStudy(p);
  const idx = PROJECTS.indexOf(p);
  const next = PROJECTS[(idx + 1) % PROJECTS.length];
  const prev = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length];

  return (
    <main className="page-enter">
      <section style={{ borderBottom: '1px solid var(--ink)', background: 'var(--hero-case)' }}>
        <ScrollReveal as="div" className="container" style={{ padding: '96px 32px 48px' }}>
          <div
            className="mono upper"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 24,
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--sub)',
              letterSpacing: '0.08em',
              paddingBottom: 24,
              borderBottom: '1px solid var(--rule)',
            }}
          >
            <span>
              <Link href="/" className="link-u" style={{ color: 'var(--sub)' }}>
                Index
              </Link>
              {' / '}
              <Link href="/work" className="link-u" style={{ color: 'var(--sub)' }}>
                Work
              </Link>
              {' / '}
              <span style={{ color: 'var(--ink)' }}>{p.title}</span>
            </span>
          </div>

          <div
            style={{
              marginTop: 56,
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: 56,
              alignItems: 'start',
            }}
          >
            <div>
              <h1
                className="tight"
                style={{
                  margin: 0,
                  fontSize: 'clamp(40px, 7vw, 120px)',
                  lineHeight: 0.92,
                  letterSpacing: '-0.05em',
                  fontWeight: 700,
                }}
              >
                {p.title}
                <span className="accent">.</span>
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
                <dd>{p.company}</dd>
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
        </ScrollReveal>
      </section>

      <section style={{ background: 'var(--ink)', color: 'var(--bone)' }}>
        <ScrollReveal as="div" className="container" style={{ padding: '64px 32px 112px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            <OutcomeColumn kicker="01" label="Pain" title="What hurt" items={study.outcomes.painPoints} />
            <OutcomeColumn kicker="02" label="Role" title="What I owned" items={study.outcomes.role} />
            <OutcomeColumn kicker="03" label="Outcome" title="What shipped" items={study.outcomes.shipped} last />
          </div>
        </ScrollReveal>
      </section>

      <CSection title={<>The TL;DR<span className="accent">.</span></>}>
        <p style={cssCopy()}>{study.summary}</p>
      </CSection>

      <CSection title={renderTitleLines(study.problemTitle)}>
        <div style={{ display: 'grid', gap: 20 }}>
          {study.problemBody.map((paragraph, index) => (
            <p key={`${p.slug}-problem-${index}`} style={cssCopy()}>
              {paragraph}
            </p>
          ))}
        </div>
      </CSection>

      <section className="focus-block" style={{ position: 'relative', overflow: 'hidden' }}>
        <ScrollReveal as="div" className="container" style={{ padding: '160px 32px', textAlign: 'center' }}>
          <div
            className="serif"
            style={{
              fontStyle: 'italic',
              fontSize: 'clamp(28px, 3vw, 44px)',
              lineHeight: 1.2,
              maxWidth: '30ch',
              margin: '0 auto',
              color: 'var(--bone)',
              letterSpacing: '-0.01em',
            }}
          >
            "{study.decisionQuestion}"
          </div>
          <div
            style={{
              margin: '32px auto 0',
              maxWidth: '60ch',
              fontSize: 17,
              lineHeight: 1.6,
              color: 'rgba(236,231,220,0.8)',
            }}
          >
            {study.decisionContext}
          </div>
          <div
            style={{
              marginTop: 48,
              display: 'inline-flex',
              alignItems: 'stretch',
              border: '1px solid var(--accent)',
              background: 'rgba(225,59,20,0.08)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              maxWidth: '720px',
            }}
          >
            <div
              style={{
                padding: '20px 28px',
                borderRight: '1px solid var(--accent)',
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Decision
            </div>
            <div style={{ padding: '20px 28px', textAlign: 'left' }}>
              <div className="tight" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
                {study.decisionAnswerTitle}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-jetbrains-mono)',
                  fontSize: 12,
                  color: 'rgba(236,231,220,0.7)',
                  marginTop: 4,
                  letterSpacing: '0.02em',
                  lineHeight: 1.5,
                }}
              >
                {study.decisionAnswerBody}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <CSection title={renderTitleLines(study.solutionTitle)}>
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
              <div className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>
                {card.n}
              </div>
              <div className="tight" style={{ fontSize: 22, fontWeight: 600, marginTop: 12, letterSpacing: '-0.025em' }}>
                {card.h}
              </div>
              <p style={{ margin: '12px 0 0', color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55 }}>{card.b}</p>
            </div>
          ))}
        </div>
      </CSection>

      <CSection title={renderTitleLines(study.processTitle)}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${study.processStats.length}, 1fr)`,
            gap: 0,
            border: '1px solid var(--rule)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            marginBottom: 32,
          }}
        >
          {study.processStats.map((stat, index) => (
            <div
              key={`${stat.n}-${stat.label}`}
              style={{
                padding: '28px 28px',
                borderRight: index < study.processStats.length - 1 ? '1px solid var(--rule)' : 'none',
              }}
            >
              <div
                className="tight"
                style={{
                  fontSize: 'clamp(36px, 4vw, 64px)',
                  fontWeight: 700,
                  letterSpacing: '-0.045em',
                  lineHeight: 1,
                }}
              >
                {stat.n}
              </div>
              <div className="mono upper" style={{ marginTop: 12, fontSize: 11, color: 'var(--sub)', letterSpacing: '0.08em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {study.processSteps.map((step, index) => (
          <ProcessStep
            key={`${p.slug}-${step.n}`}
            n={step.n}
            h={step.h}
            body={step.body}
            last={index === study.processSteps.length - 1}
          />
        ))}
      </CSection>

      <CSection title={<>What worked.<br />What got tricky<span className="accent">.</span></>}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 0,
            border: '1px solid var(--rule)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          <ReflectionColumn title="What went right" items={study.reflection.wins} borderRight />
          <ReflectionColumn title="Tough spots" items={study.reflection.challenges} />
        </div>
      </CSection>

      <section style={{ borderTop: '1px solid var(--ink)', background: 'var(--paper)' }}>
        <ScrollReveal as="div" className="container" style={{ padding: '112px 32px 160px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <NavCard dir="prev" p={prev} />
            <NavCard dir="next" p={next} />
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}

function CSection({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section>
      <SectionHead title={title} />
      <ScrollReveal as="div" className="container" style={{ padding: '0 32px 160px' }}>
        {children}
      </ScrollReveal>
    </section>
  );
}

function OutcomeColumn({
  kicker,
  label,
  title,
  items,
  last = false,
}: {
  kicker: string;
  label: string;
  title: string;
  items: string[];
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: '32px 24px',
        borderRight: last ? 'none' : '1px solid rgba(236,231,220,0.18)',
        paddingLeft: kicker === '01' ? 0 : 24,
        paddingRight: last ? 0 : 24,
      }}
    >
      <div
        className="mono upper"
        style={{
          fontSize: 10,
          color: 'rgba(236,231,220,0.5)',
          letterSpacing: '0.1em',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{kicker}</span>
        <span>{label}</span>
      </div>
      <h3 className="tight" style={{ margin: '16px 0 0', fontSize: 'clamp(26px, 2.6vw, 36px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
        {title}
      </h3>
      <ul style={{ margin: '20px 0 0', padding: 0, listStyle: 'none' }}>
        {items.map((item, index) => (
          <li
            key={`${kicker}-${index}`}
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
  borderRight = false,
}: {
  title: string;
  items: string[];
  borderRight?: boolean;
}) {
  return (
    <div style={{ padding: 28, borderRight: borderRight ? '1px solid var(--rule)' : 'none' }}>
      <div className="mono upper" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em' }}>
        {title}
      </div>
      <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            style={{
              fontSize: 15,
              lineHeight: 1.55,
              color: 'var(--ink-2)',
              paddingTop: index > 0 ? 12 : 0,
              borderTop: index > 0 ? '1px solid var(--rule)' : 'none',
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
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

function renderTitleLines(lines: string[]) {
  return (
    <>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
      <span className="accent">.</span>
    </>
  );
}

function ProcessStep({ n, h, body, last }: { n: string; h: string; body: string; last?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '100px 1fr',
        gap: 32,
        padding: '28px 0',
        borderTop: '1px solid var(--rule)',
        borderBottom: last ? '1px solid var(--rule)' : 'none',
      }}
    >
      <div className="mono" style={{ fontSize: 13, color: 'var(--accent)' }}>
        {n}
      </div>
      <div>
        <h4 className="tight" style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em' }}>
          {h}
        </h4>
        <p style={{ margin: '10px 0 0', color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.55, maxWidth: '62ch' }}>{body}</p>
      </div>
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
