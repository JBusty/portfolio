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
        gridTemplateColumns: '1.2fr 1.6fr 1fr auto',
        alignItems: 'center',
        gap: 24,
        padding: '32px 24px',
        borderTop: '1px solid var(--rule)',
        borderRadius: hover ? 'var(--radius)' : 0,
        background: hover ? 'var(--ink)' : 'transparent',
        color: hover ? 'var(--bone)' : 'var(--ink)',
        transition: 'all 180ms ease',
      }}
    >
      <div>
        <div className="mono upper" style={{ fontSize: 11, color: hover ? 'var(--accent)' : 'var(--accent)', letterSpacing: '0.1em' }}>
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

      <div style={{ color: hover ? 'rgba(236,231,220,0.72)' : 'var(--ink-2)', fontSize: 14, lineHeight: 1.5, maxWidth: '52ch', transition: 'color 180ms' }}>
        {p.blurb}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className="chip" style={{ borderColor: hover ? 'rgba(236,231,220,0.3)' : 'var(--rule-strong)', color: hover ? 'var(--bone)' : 'var(--ink-2)' }}>{p.year}</span>
        {p.tags.slice(0, 2).map(t => (
          <span key={t} className="chip" style={{ borderColor: hover ? 'rgba(236,231,220,0.3)' : 'var(--rule-strong)', color: hover ? 'var(--bone)' : 'var(--ink-2)' }}>{t}</span>
        ))}
      </div>

      <span className="btn" style={{
        borderColor: hover ? 'rgba(236,231,220,0.4)' : 'var(--ink)',
        color: hover ? 'var(--bone)' : 'var(--ink)',
        background: 'transparent',
        transition: 'border-color 180ms, color 180ms',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        View <span className="arr">→</span>
      </span>
    </Link>
  );
}
