'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProjectRow from '@/components/ProjectRow';
import ScrollReveal from '@/components/ScrollReveal';
import { PROJECTS } from '@/lib/data';

export default function WorkPage() {
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    PROJECTS.forEach((project) => project.tags.forEach((tag) => tags.add(tag)));
    return ['All', ...Array.from(tags)];
  }, []);

  const [activeTag, setActiveTag] = useState('All');
  const [view, setView] = useState<'rows' | 'grid'>('rows');

  const list = useMemo(() => {
    if (activeTag === 'All') return PROJECTS;
    return PROJECTS.filter((project) => project.tags.includes(activeTag));
  }, [activeTag]);

  return (
    <main className="page-enter">
      <section style={{ borderBottom: '1px solid var(--ink)', background: 'var(--hero-work)' }}>
        <ScrollReveal as="div" className="container" style={{ padding: '96px 32px 48px' }}>
          <h1
            className="tight"
            style={{
              margin: 0,
              fontSize: 'clamp(48px, 9vw, 98px)',
              lineHeight: 0.9,
              letterSpacing: '-0.055em',
              fontWeight: 700,
            }}
          >
            Work that makes an impact
            <span className="accent">.</span>
          </h1>

          <p
              style={{
                margin: '32px 0 0',
                fontSize: 'clamp(17px, 1.4vw, 20px)',
                lineHeight: 1.5,
                color: 'var(--ink-2)',
                maxWidth: '60ch',
              }}
            >
              From idea to implementation, these are projects where the work
              actually shipped, not just a Figma file with rounded corners.
              A mix of 0→1, platform-level refactors, and the kind of design
              work that lives in production for years.
            </p>
        </ScrollReveal>
      </section>

      <section>
        <div className="container" style={{ padding: '0 32px 160px' }}>
          <ScrollReveal
            as="div"
            style={{
              padding: '20px 0 24px',
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span className="mono upper" style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: '0.08em', marginRight: 4 }}>
              Filter
            </span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className="chip"
                style={{
                  background: activeTag === tag ? 'var(--ink)' : 'transparent',
                  color: activeTag === tag ? 'var(--bone)' : 'var(--ink-2)',
                  borderColor: activeTag === tag ? 'var(--ink)' : 'var(--rule-strong)',
                  cursor: 'pointer',
                }}
              >
                {tag}
              </button>
            ))}
            <span className="grow" />
            <div style={{ display: 'flex', border: '1px solid var(--rule-strong)', borderRadius: 999, overflow: 'hidden' }}>
              {(['rows', 'grid'] as const).map((nextView) => (
                <button
                  key={nextView}
                  onClick={() => setView(nextView)}
                  className="mono upper"
                  style={{
                    padding: '6px 14px',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    background: view === nextView ? 'var(--ink)' : 'transparent',
                    color: view === nextView ? 'var(--bone)' : 'var(--ink)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {nextView}
                </button>
              ))}
            </div>
          </ScrollReveal>
          {view === 'rows' ? (
            <div style={{ borderBottom: '1px solid var(--rule)' }}>
              {list.map((project, index) => (
                <ScrollReveal key={project.slug} delayMs={Math.min(index * 36, 180)}>
                  <ProjectRow p={project} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: 24,
              }}
            >
              {list.map((project, index) => (
                <ScrollReveal key={project.slug} delayMs={Math.min(index * 40, 200)}>
                  <WorkGridCard p={project} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: 'var(--paper)', borderTop: '1px solid var(--ink)' }}>
        <ScrollReveal
          as="div"
          className="container"
          style={{
            padding: '128px 32px',
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 48,
            alignItems: 'center',
          }}
        >
          <div>
            <h3
              className="tight"
              style={{
                margin: 0,
                fontSize: 'clamp(28px, 3.6vw, 48px)',
                fontWeight: 600,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
              }}
            >
              The work I can&apos;t show on a public website
              <span className="accent">.</span>
            </h3>
            <p
              style={{
                margin: '20px 0 0',
                fontSize: 17,
                lineHeight: 1.55,
                color: 'var(--ink-2)',
                maxWidth: '60ch',
              }}
            >
              Most of my recent work is under NDA: internal admin tools,
              security workflows, financial primitives. I&apos;ll happily walk
              through it on a call.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="/contact" className="btn">
              Book a walk-through <span className="arr">&#8599;</span>
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}

function WorkGridCard({ p }: { p: typeof PROJECTS[number] }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={`/work/${p.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: '1px solid var(--ink)',
        background: hover ? 'var(--ink)' : 'var(--paper)',
        color: hover ? 'var(--bone)' : 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 360,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'background 160ms, color 160ms',
      }}
    >
      <div
        className="mono upper"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid',
          borderColor: hover ? 'rgba(236,231,220,0.2)' : 'var(--rule)',
          fontSize: 11,
          color: hover ? 'rgba(236,231,220,0.65)' : 'var(--sub)',
          letterSpacing: '0.08em',
        }}
      >
        <span>
          {p.num} - {p.company}
        </span>
        <span>{p.year}</span>
      </div>
      <div style={{ padding: '22px 22px 26px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div
          className="tight"
          style={{
            fontSize: 'clamp(22px, 2vw, 28px)',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
          }}
        >
          {p.title}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: hover ? 'rgba(236,231,220,0.78)' : 'var(--ink-2)' }}>
          {p.blurb}
        </div>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.tags.map((tag) => (
              <span
                key={tag}
                className="chip"
                style={{
                  borderColor: hover ? 'rgba(236,231,220,0.45)' : 'var(--rule-strong)',
                  color: hover ? 'var(--bone)' : 'var(--ink-2)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <span
            className="mono upper"
            style={{ fontSize: 11, letterSpacing: '0.1em', color: hover ? 'var(--accent)' : 'var(--ink)' }}
          >
            {hover ? 'Open ->' : 'View ->'}
          </span>
        </div>
      </div>
    </Link>
  );
}
