'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Project } from '@/lib/data';

interface ProjectRowProps {
  p: Project;
  first?: boolean;
}

export default function ProjectRow({ p, first }: ProjectRowProps) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={`/work/${p.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="proj-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.6fr 1fr auto',
        alignItems: 'center',
        gap: 24,
        paddingTop: 32,
        paddingRight: 24,
        paddingBottom: 32,
        paddingLeft: hover ? 32 : 24,
        borderTop: first ? 'none' : '1px solid var(--rule)',
        color: 'var(--ink)',
        background: hover ? 'var(--bone-2)' : 'transparent',
        transition: 'padding-left 260ms cubic-bezier(0.2, 0.8, 0.2, 1), background 180ms ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* accent bar — slides down from top on hover */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: 'var(--accent)',
          transformOrigin: 'top center',
          transform: hover ? 'scaleY(1)' : 'scaleY(0)',
          transition: 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          borderRadius: '0 2px 2px 0',
        }}
      />

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

      <div className="proj-row-blurb" style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.5, maxWidth: '52ch' }}>
        {p.blurb}
      </div>

      <div className="proj-row-tags" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className="chip">{p.year}</span>
        {p.tags.slice(0, 2).map(t => (
          <span key={t} className="chip">{t}</span>
        ))}
      </div>

      <span className="btn proj-row-btn" style={{
        borderColor: 'var(--ink)',
        color: 'var(--ink)',
        background: 'transparent',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        View{' '}
        <span
          className="arr"
          style={{
            display: 'inline-block',
            transform: hover ? 'translateX(4px)' : 'translateX(0)',
            transition: 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >→</span>
      </span>
    </Link>
  );
}
