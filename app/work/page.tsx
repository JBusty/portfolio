'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import ProjectRow from '@/components/ProjectRow';
import { PROJECTS } from '@/lib/data';

export default function WorkPage() {
  const allTags = useMemo(() => {
    const t = new Set<string>();
    PROJECTS.forEach(p => p.tags.forEach(x => t.add(x)));
    return ['All', ...Array.from(t)];
  }, []);

  const [activeTag, setActiveTag] = useState('All');
  const [view, setView] = useState<'rows' | 'grid'>('rows');

  const list = useMemo(() => {
    if (activeTag === 'All') return PROJECTS;
    return PROJECTS.filter(p => p.tags.includes(activeTag));
  }, [activeTag]);

  return (
    <main className="page-enter">
      {/* HERO */}
      <section style={{ borderBottom: '1px solid var(--ink)', background: 'var(--hero-work)' }}>
        <div className="container" style={{ padding: '48px 32px 24px' }}>
          <h1 className="tight" style={{
            margin: 0,
            fontSize: 'clamp(48px, 9vw, 168px)',
            lineHeight: 0.9,
            letterSpacing: '-0.055em',
            fontWeight: 700,
          }}>
            Selected work,<br />
            <span className="serif" style={{ fontStyle: 'italic', fontWeight: 400, letterSpacing: '-0.04em' }}>
              not the highlights reel
            </span>
            <span className="accent">.</span>
          </h1>

          <div style={{ marginTop: 48, marginBottom: 24, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'end' }}>
            <p style={{ margin: 0, fontSize: 'clamp(17px, 1.4vw, 20px)', lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: '60ch' }}>
              From idea to implementation, these are projects where the work
              actually shipped — not just a Figma file with rounded corners.
              A mix of 0→1, platform-level refactors, and the kind of design
              work that lives in production for years.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Link href="/" className="btn ghost">← Back to index</Link>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="container" style={{
          padding: '16px 32px',
          borderTop: '1px solid var(--rule)',
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span className="mono upper" style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: '0.08em' }}>Filter ▼</span>
          {allTags.map(t => (
            <button
              key={t}
              onClick={() => setActiveTag(t)}
              className="chip"
              style={{
                background: activeTag === t ? 'var(--ink)' : 'transparent',
                color: activeTag === t ? 'var(--bone)' : 'var(--ink-2)',
                borderColor: activeTag === t ? 'var(--ink)' : 'var(--rule-strong)',
                cursor: 'pointer',
              }}
            >{t}</button>
          ))}
          <span className="grow" />
          <span className="mono upper" style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: '0.08em' }}>View</span>
          <div style={{ display: 'flex', border: '1px solid var(--rule-strong)', borderRadius: 999, overflow: 'hidden' }}>
            {(['rows', 'grid'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className="mono upper" style={{
                padding: '6px 14px', fontSize: 11, letterSpacing: '0.08em',
                background: view === v ? 'var(--ink)' : 'transparent',
                color: view === v ? 'var(--bone)' : 'var(--ink)',
                border: 'none', cursor: 'pointer',
              }}>{v}</button>
            ))}
          </div>
        </div>
      </section>

      {/* LIST */}
      <section>
        <div className="container" style={{ padding: '8px 32px 80px' }}>
          <div className="mono upper" style={{
            fontSize: 11, color: 'var(--sub)', padding: '16px 0', letterSpacing: '0.08em',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>Showing {list.length} of {PROJECTS.length}{activeTag !== 'All' ? ` · tagged "${activeTag}"` : ''}</span>
            <span>Press → on a row to open</span>
          </div>

          {view === 'rows' ? (
            <div style={{ borderBottom: '1px solid var(--rule)' }}>
              {list.map(p => <ProjectRow key={p.slug} p={p} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
              {list.map(p => <WorkGridCard key={p.slug} p={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* NDA callout */}
      <section style={{ background: 'var(--paper)', borderTop: '1px solid var(--ink)' }}>
        <div className="container" style={{ padding: '64px 32px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div className="mono upper" style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 12, letterSpacing: '0.1em' }}>▍ Not pictured</div>
            <h3 className="tight" style={{ margin: 0, fontSize: 'clamp(28px, 3.6vw, 48px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              The work I can&#x2019;t show on a public website<span className="accent">.</span>
            </h3>
            <p style={{ margin: '20px 0 0', fontSize: 17, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: '60ch' }}>
              Most of my recent work is under NDA — internal admin tools,
              security workflows, financial primitives. I&#x2019;ll happily walk
              through it on a call.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="/contact" className="btn">
              Book a walk-through <span className="arr">↗</span>
            </Link>
          </div>
        </div>
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
        display: 'flex', flexDirection: 'column', minHeight: 360,
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        transition: 'background 160ms, color 160ms',
      }}
    >
      <div className="mono upper" style={{
        display: 'flex', justifyContent: 'space-between', padding: '14px 18px',
        borderBottom: '1px solid', borderColor: hover ? 'rgba(236,231,220,0.2)' : 'var(--rule)',
        fontSize: 11, color: hover ? 'rgba(236,231,220,0.65)' : 'var(--sub)', letterSpacing: '0.08em',
      }}>
        <span>{p.num} · {p.company}</span>
        <span>{p.year}</span>
      </div>
      <div style={{ padding: '22px 22px 26px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div className="tight" style={{ fontSize: 'clamp(22px, 2vw, 28px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          {p.title}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: hover ? 'rgba(236,231,220,0.78)' : 'var(--ink-2)' }}>
          {p.blurb}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.tags.map(t => (
              <span key={t} className="chip" style={{ borderColor: hover ? 'rgba(236,231,220,0.45)' : 'var(--rule-strong)', color: hover ? 'var(--bone)' : 'var(--ink-2)' }}>{t}</span>
            ))}
          </div>
          <span className="mono upper" style={{ fontSize: 11, letterSpacing: '0.1em', color: hover ? 'var(--accent)' : 'var(--ink)' }}>
            {hover ? 'Open ↗' : 'View →'}
          </span>
        </div>
      </div>
    </Link>
  );
}
