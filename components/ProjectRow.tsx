'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Project } from '@/lib/data';

interface ProjectRowProps {
  p: Project;
}

export default function ProjectRow({ p }: ProjectRowProps) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={`/work/${p.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 1.2fr 1.6fr 1fr 110px',
        alignItems: 'center',
        gap: 24,
        padding: '26px 0',
        borderTop: '1px solid var(--rule)',
        position: 'relative',
        background: hover ? 'rgba(225,59,20,0.04)' : 'transparent',
        transition: 'background 160ms',
      }}
    >
      {/* hover accent bar */}
      <span style={{
        position: 'absolute',
        left: -24,
        top: 0,
        bottom: 0,
        width: 4,
        background: hover ? 'var(--accent)' : 'transparent',
        transition: 'background 160ms',
      }} />

      <div className="mono" style={{ fontSize: 12, color: 'var(--sub)' }}>{p.num}</div>

      <div>
        <div className="mono upper" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em' }}>
          {p.company}
        </div>
        <div className="tight" style={{
          fontSize: 'clamp(20px, 2.2vw, 28px)',
          fontWeight: 600,
          marginTop: 4,
          letterSpacing: '-0.02em',
        }}>
          {p.title}
        </div>
      </div>

      <div style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.5, maxWidth: '52ch' }}>
        {p.blurb}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className="chip">{p.year}</span>
        {p.tags.slice(0, 2).map(t => <span key={t} className="chip">{t}</span>)}
      </div>

      <div style={{ textAlign: 'right' }}>
        <span className="mono upper" style={{
          fontSize: 11,
          letterSpacing: '0.08em',
          color: hover ? 'var(--accent)' : 'var(--ink)',
        }}>
          {hover ? 'Open →' : 'View'}
        </span>
      </div>
    </Link>
  );
}
