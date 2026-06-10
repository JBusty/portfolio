'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ProjectRow from '@/components/ProjectRow';
import ScrollReveal from '@/components/ScrollReveal';
import { PROJECTS } from '@/lib/data';
import heroStyles from '../page.module.css';

export default function WorkPage() {
  const allTags = useMemo(() => {
    const seen = new Set<string>();
    PROJECTS.forEach((p) => p.tags.forEach((t) => seen.add(t)));
    return ['All', ...Array.from(seen)];
  }, []);

  const [activeTag, setActiveTag] = useState('All');
  const [topbarVisible, setTopbarVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (y < 60) setTopbarVisible(true);
      else if (y > lastY.current) setTopbarVisible(false);
      else setTopbarVisible(true);
      lastY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const list = useMemo(() => {
    if (activeTag === 'All') return PROJECTS;
    return PROJECTS.filter((p) => p.tags.includes(activeTag));
  }, [activeTag]);

  return (
    <main className="page-enter">
      <section style={{ borderBottom: '1px solid var(--ink)', background: 'var(--hero-work)' }}>
        <div className="container r-hero-split sp-hero" style={{ padding: '126px 32px 88px', gap: 56 }}>
          <div>
          <h1
            className={`tight ${heroStyles.heroTitle}`}
            style={{
              fontSize: 'clamp(48px, 9vw, 98px)',
              lineHeight: 0.9,
              maxWidth: '11ch',
            }}
          >
            <span className={heroStyles.heroLine} style={{ animationDelay: '0ms' }}>
              Work that makes
            </span>
            <span className={heroStyles.heroLine} style={{ animationDelay: '100ms' }}>
              an impact<span className="accent">.</span>
            </span>
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
          </div>
          <div style={{ width: '100%', maxWidth: 560, justifySelf: 'end' }}>
            <WorkHeroArt />
          </div>
        </div>
      </section>

      <section>
        <div className="container sp-bot-sm" style={{ padding: '24px 32px 160px' }}>
          <div className="work-filter-bar" style={{
            position: 'sticky',
            top: topbarVisible ? 73 : 16,
            zIndex: 40,
            display: 'flex',
            justifyContent: 'flex-start',
            paddingBottom: 18,
            transition: 'top 280ms ease',
          }}>
            <div style={{
              display: 'flex',
              width: '100%',
              gap: 6,
              flexWrap: 'wrap',
              alignItems: 'center',
              padding: '14px 16px',
              border: '1px solid rgba(17,17,16,0.12)',
              borderRadius: 18,
              background: 'rgba(245,241,230,0.92)',
              backdropFilter: 'saturate(160%) blur(12px)',
            }}>
              <span className="mono upper" style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: '0.1em', marginRight: 6 }}>
                Filter
              </span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className="chip"
                  style={{
                    background: activeTag === tag ? 'var(--ink)' : 'rgba(17,17,16,0.03)',
                    color: activeTag === tag ? 'var(--bone)' : 'var(--ink-2)',
                    borderColor: activeTag === tag ? 'var(--ink)' : 'rgba(17,17,16,0.12)',
                    cursor: 'pointer',
                    transition: 'background 160ms, color 160ms, border-color 160ms',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderBottom: '1px solid var(--rule)' }}>
            {list.map((project, index) => (
              <ScrollReveal key={project.slug} delayMs={Math.min(index * 36, 180)}>
                <ProjectRow p={project} first={index === 0} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}

function WorkHeroArt() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);

    sync();
    const frame = window.requestAnimationFrame(() => setAnimateIn(true));
    media.addEventListener('change', sync);

    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener('change', sync);
    };
  }, []);

  const fade = (step: string) => (reduceMotion || !animateIn ? undefined : `hero-draw-fade ${step}`);
  const draw = (step: string) => (reduceMotion || !animateIn ? undefined : `hero-draw-stroke ${step}`);

  return (
    <svg className="hero-line-art" viewBox="72 108 296 174" aria-hidden="true">
      <g transform="rotate(-8 140 184)">
        <rect
          x="84"
          y="138"
          width="126"
          height="92"
          rx="14"
          fill="rgba(245,241,230,0.72)"
          className={fade('hero-draw-1')}
        />
        <rect
          x="84"
          y="138"
          width="126"
          height="92"
          rx="14"
          pathLength="100"
          fill="none"
          stroke="rgba(17,17,16,0.26)"
          strokeWidth="1.25"
          className={draw('hero-draw-1')}
        />
        <line
          x1="84"
          y1="160"
          x2="210"
          y2="160"
          pathLength="100"
          stroke="rgba(17,17,16,0.16)"
          strokeWidth="1.25"
          className={draw('hero-draw-2')}
        />
        <rect x="102" y="176" width="40" height="12" rx="6" fill="rgba(17,17,16,0.08)" className={fade('hero-draw-2')} />
        <rect x="102" y="196" width="66" height="10" rx="5" fill="rgba(17,17,16,0.06)" className={fade('hero-draw-3')} />
      </g>

      <g transform="rotate(9 292 180)">
        <rect
          x="232"
          y="132"
          width="122"
          height="94"
          rx="14"
          fill="rgba(245,241,230,0.72)"
          className={fade('hero-draw-1')}
        />
        <rect
          x="232"
          y="132"
          width="122"
          height="94"
          rx="14"
          pathLength="100"
          fill="none"
          stroke="rgba(17,17,16,0.26)"
          strokeWidth="1.25"
          className={draw('hero-draw-2')}
        />
        <line
          x1="232"
          y1="154"
          x2="354"
          y2="154"
          pathLength="100"
          stroke="rgba(17,17,16,0.16)"
          strokeWidth="1.25"
          className={draw('hero-draw-3')}
        />
        <rect x="252" y="170" width="54" height="12" rx="6" fill="rgba(225,59,20,0.10)" className={fade('hero-draw-3')} />
        <rect x="252" y="190" width="74" height="10" rx="5" fill="rgba(17,17,16,0.06)" className={fade('hero-draw-4')} />
      </g>

      <g>
        <rect
          x="118"
          y="116"
          width="206"
          height="160"
          rx="18"
          fill="#F5F1E6"
          className={fade('hero-draw-2')}
        />
        <rect
          x="118"
          y="116"
          width="206"
          height="160"
          rx="18"
          pathLength="100"
          fill="none"
          stroke="#111110"
          strokeWidth="1.5"
          className={draw('hero-draw-1')}
        />
        <line
          x1="118"
          y1="146"
          x2="324"
          y2="146"
          pathLength="100"
          stroke="rgba(17,17,16,0.22)"
          strokeWidth="1.5"
          className={draw('hero-draw-2')}
        />
        <circle cx="136" cy="131" r="4" fill="#111110" className={fade('hero-draw-2')} />
        <circle cx="150" cy="131" r="4" fill="rgba(17,17,16,0.28)" className={fade('hero-draw-2')} />
        <circle cx="164" cy="131" r="4" fill="rgba(17,17,16,0.16)" className={fade('hero-draw-2')} />
      </g>

      <path
        d="M 126 114 C 106 158, 104 212, 142 244 C 176 272, 222 270, 250 240 C 276 212, 298 208, 320 220"
        pathLength="100"
        fill="none"
        stroke="rgba(17,17,16,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={draw('hero-draw-3')}
      />

      <path
        d="M 315 214 L 329 221 L 317 230"
        pathLength="100"
        fill="none"
        stroke="rgba(17,17,16,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={draw('hero-draw-4')}
      />

      <g className={fade('hero-draw-3')}>
        <circle cx="144" cy="244" r="10" fill="#F5F1E6" />
        <circle cx="144" cy="244" r="10" pathLength="100" fill="none" stroke="#111110" strokeWidth="1.5" className={draw('hero-draw-3')} />
      </g>
      <g className={fade('hero-draw-4')}>
        <circle cx="226" cy="256" r="10" fill="#F5F1E6" />
        <circle cx="226" cy="256" r="10" pathLength="100" fill="none" stroke="#111110" strokeWidth="1.5" className={draw('hero-draw-4')} />
      </g>
      <g className={fade('hero-draw-5')}>
        <circle cx="302" cy="216" r="10" fill="#E13B14" />
        <circle cx="302" cy="216" r="10" pathLength="100" fill="none" stroke="#111110" strokeWidth="1.5" className={draw('hero-draw-5')} />
      </g>

      <path
        d="M 142 244 l 4 4 l 7 -9"
        pathLength="100"
        fill="none"
        stroke="#111110"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={draw('hero-draw-4')}
      />

      <path
        d="M 223 256 l 4 4 l 8 -10"
        pathLength="100"
        fill="none"
        stroke="#111110"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={draw('hero-draw-5')}
      />

      <g>
        <rect x="144" y="174" width="56" height="38" rx="10" fill="rgba(17,17,16,0.05)" className={fade('hero-draw-3')} />
        <rect x="212" y="174" width="56" height="38" rx="10" fill="rgba(17,17,16,0.05)" className={fade('hero-draw-4')} />
        <rect x="168" y="224" width="56" height="26" rx="10" fill="rgba(225,59,20,0.1)" className={fade('hero-draw-5')} />
        <rect x="144" y="174" width="56" height="38" rx="10" pathLength="100" fill="none" stroke="rgba(17,17,16,0.18)" strokeWidth="1.25" className={draw('hero-draw-3')} />
        <rect x="212" y="174" width="56" height="38" rx="10" pathLength="100" fill="none" stroke="rgba(17,17,16,0.18)" strokeWidth="1.25" className={draw('hero-draw-4')} />
        <rect x="168" y="224" width="56" height="26" rx="10" pathLength="100" fill="none" stroke="rgba(225,59,20,0.32)" strokeWidth="1.25" className={draw('hero-draw-5')} />
      </g>

      <g transform="translate(286 154) rotate(7)">
        <rect width="48" height="48" rx="16" fill="rgba(225,59,20,0.12)" className={fade('hero-draw-5')} />
        <rect width="48" height="48" rx="16" pathLength="100" fill="none" stroke="#E13B14" strokeWidth="1.5" className={draw('hero-draw-5')} />
        <path
          d="M 14 24 l 7 7 l 13 -16"
          pathLength="100"
          fill="none"
          stroke="#B12C0C"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={draw('hero-draw-5')}
        />
      </g>
    </svg>
  );
}


