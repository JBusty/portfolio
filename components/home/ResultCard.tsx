'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { Stat } from '@/lib/data';
import { RESULT_PRODUCTS, RESULT_INDUSTRIES } from '@/lib/home';
import s from './processLine.module.css';

/*
 * One of the four Results cards under the process line: a small picture of the
 * number, then the number itself, which counts up the first time the section is seen.
 * Entrance animations are keyed off the section's `.seen`; hover effects use
 * separate properties (translate/scale/opacity), so leaving a card never replays them.
 */

const ENTER_MS = 1050;   // when the cards' visuals start, after the panel has come in
const STAGGER_MS = 90;

export default function ResultCard({ stat, i, seen }: { stat: Stat; i: number; seen: boolean }) {
  const shown = useCountUp(stat.n, seen, ENTER_MS + i * STAGGER_MS);
  return (
    <article className={s.rc} style={{ '--i': i, '--d': `${ENTER_MS + i * STAGGER_MS}ms` } as CSSProperties}>
      <span className={s.srOnly}>{stat.n} {stat.label}</span>
      <div className={s.vis} aria-hidden="true"><Visual kind={i} /></div>
      <div className={`tight ${s.num}`} aria-hidden="true">{shown}</div>
      <div className={s.lbl} aria-hidden="true">{stat.label}</div>
    </article>
  );
}

function Visual({ kind }: { kind: number }) {
  if (kind === 0) {
    // a bar per year, getting taller, with a marker for today
    return (
      <div className={s.ticks}>
        {Array.from({ length: 12 }, (_, j) => (
          <i key={j} style={{ '--j': j, '--h': `${16 + j * 3}px`, '--o': 0.3 + j * 0.055 } as CSSProperties} />
        ))}
        <i className={s.today} style={{ '--j': 12 } as CSSProperties} />
      </div>
    );
  }
  if (kind === 1) {
    // a crowd: dots that light up in a scattered order
    return (
      <div className={s.dots}>
        {Array.from({ length: 64 }, (_, j) => {
          const r = ((j * 37) % 23) / 22;
          return <i key={j} style={{ '--r': r, '--o': 0.22 + ((j * 53) % 11) / 16 } as CSSProperties} />;
        })}
      </div>
    );
  }
  if (kind === 2) {
    // the four products, drawn as the shipped piece from the belt
    return (
      <div className={s.pieces}>
        {RESULT_PRODUCTS.map((p, j) => (
          <div key={p.name} title={p.name} style={{ '--j': j } as CSSProperties}>
            <svg width="34" height="24" viewBox="-23 -31 46 32">
              <rect x="-22" y="-30" width="44" height="30" rx="4" fill="#fff" stroke="rgba(61,90,128,.7)" />
              <rect x="-22" y="-30" width="44" height="6" fill="#3D5A80" />
              <rect x="-17" y="-19" width="18" height="3" fill="rgba(27,34,51,.3)" />
              <rect x="-17" y="-13" width="28" height="2" fill="rgba(27,34,51,.15)" />
              <rect x="4" y="-9" width="13" height="5" rx="2.5" fill="#3D5A80" />
            </svg>
            <span>{p.short}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={s.chips}>
      {RESULT_INDUSTRIES.map((n, j) => <i key={n} style={{ '--j': j } as CSSProperties}>{n}</i>)}
    </div>
  );
}

/** "12+" counts 0→12, "1M+" counts through thousands to 1M; the suffix lands with the final value. */
function useCountUp(target: string, run: boolean, delay: number) {
  const [shown, setShown] = useState(target);
  useEffect(() => {
    const m = /^(\d+)(M?)(.*)$/.exec(target);
    if (!run || !m || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const total = Number(m[1]) * (m[2] ? 1_000_000 : 1);
    const fmt = (v: number) => (v >= 1_000_000 ? `${Math.floor(v / 1_000_000)}M` : v >= 1000 ? `${Math.round(v / 1000)}K` : `${Math.round(v)}`);
    const DUR = 1100;
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - start) / DUR));
      if (p >= 1) { setShown(target); return; }
      setShown(fmt(total * (1 - Math.pow(1 - p, 3))));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, delay]);
  return shown;
}
