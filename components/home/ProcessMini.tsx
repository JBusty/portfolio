'use client';

import { useEffect, useRef, useState } from 'react';
import s from './processLine.module.css';

/*
 * Phones and tablets: a short conveyor pinned to the top of "My process" while the
 * step cards scroll under it. The card in the middle of the screen is `active`; the
 * idea slides to that station and gets stamped into its next form.
 * Broken: the belt splits and the idea takes the dashed Plan B detour instead.
 */

const INK = 'rgba(226,232,242,.72)', NAVY = '#3D5A80', GFILL = '#1F2839', GLINE = 'rgba(214,224,240,.42)', GON = '#A9C0E0', ALARM = '#F0766B';
// The drawing is 108 units tall and as wide as it needs to be to span the column: on a phone
// that's 335 units; wider screens scale it up (to 1.4×, so it stays a slim strip) and spread the
// five stations across the extra width.
const BASE_W = 335, MAX_SCALE = 1.4;
const stations = (w: number) => [0, 1, 2, 3, 4].map(i => 32 + (i * (w - 64)) / 4);

function gearPath(r: number, teeth: number) {
  const tIn = r * 0.82, st = (Math.PI * 2) / teeth;
  const p = (a: number, rr: number) => `${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const q = i * st;
    d += `${i ? 'L' : 'M'}${p(q - st * 0.32, tIn)} L${p(q - st * 0.18, r)} L${p(q + st * 0.18, r)} L${p(q + st * 0.32, tIn)} `;
  }
  return d + 'Z';
}
const GEAR = gearPath(16, 10);

/** The idea in each of its forms (same as the desktop canvas), bottom-centre at 0,0. */
function Piece({ stage }: { stage: number }) {
  if (stage === 0) return (
    <>
      <circle cy="-12" r="11" fill="none" stroke={INK} strokeDasharray="3 3" />
      <text y="-7.5" textAnchor="middle" fontSize="12" fontWeight="600" fill={INK}>?</text>
    </>
  );
  if (stage === 1) return (
    <>
      <rect x="-14" y="-28" width="28" height="28" fill="#E6EDF7" stroke="rgba(61,90,128,.5)" />
      <g fill="rgba(61,90,128,.5)"><rect x="-9" y="-21" width="16" height="2" /><rect x="-9" y="-16" width="12" height="2" /><rect x="-9" y="-11" width="14" height="2" /></g>
    </>
  );
  if (stage === 2) return (
    <>
      <rect x="-22" y="-30" width="44" height="30" rx="3" fill="none" stroke={INK} strokeDasharray="3 2" />
      <g fill="none" stroke={INK}><rect x="-17" y="-25" width="14" height="3" /><rect x="-17" y="-18" width="30" height="2" /><rect x="-17" y="-13" width="24" height="2" /><rect x="4" y="-8" width="13" height="5" /></g>
    </>
  );
  return (
    <>
      <rect x="-22" y="-30" width="44" height="30" rx="4" fill="#fff" stroke={stage >= 4 ? 'rgba(61,90,128,.7)' : 'rgba(27,34,51,.45)'} />
      <rect x="-22" y="-30" width="44" height="6" fill={stage >= 5 ? NAVY : 'rgba(27,34,51,.18)'} />
      <rect x="-17" y="-19" width="18" height="3" fill="rgba(27,34,51,.3)" />
      <rect x="-17" y="-13" width="28" height="2" fill="rgba(27,34,51,.15)" />
      <rect x="4" y="-9" width="13" height="5" rx="2.5" fill={stage >= 4 ? NAVY : 'rgba(27,34,51,.35)'} />
      {stage === 4 && <path d="M13 -27 l2.5 2.5 4.5 -4.5" fill="none" stroke="#2F7D5B" strokeWidth="1.6" />}
    </>
  );
}

export default function ProcessMini({ active, broken, titles }: { active: number; broken: boolean; titles: string[] }) {
  // The piece travels first, then changes form once it's under the press.
  const [stage, setStage] = useState(0);
  const [hit, setHit] = useState(0);
  useEffect(() => {
    const next = active < 0 ? 0 : active + 1;
    if (next === stage) return;
    const t = window.setTimeout(() => { setStage(next); setHit(h => h + 1); }, active < 0 ? 0 : 600);
    return () => clearTimeout(t);
  }, [active, stage]);

  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(BASE_W);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const fit = () => {
      const cw = el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft) - parseFloat(getComputedStyle(el).paddingRight);
      if (cw > 0) setW(Math.max(BASE_W, cw / Math.min(MAX_SCALE, cw / BASE_W)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const XS = stations(W), mid = W / 2;
  const x = active < 0 ? 8 : XS[active];
  // the detour: a quadratic arc over the broken belt
  const arc = (t: number) => { const u = 1 - t; return [u * u * 8 + 2 * u * t * mid + t * t * (W - 8), u * u * 74 + 2 * u * t * -8 + t * t * 74]; };

  return (
    <div ref={boxRef} className={s.mini} aria-hidden="true">
      <svg viewBox={`0 0 ${W} 108`}>
        <line x1="10" y1="22" x2={W - 10} y2="22" stroke="rgba(214,224,240,.2)" strokeWidth="1.2" />
        {XS.map((sx, i) => {
          const on = !broken && i === active, c = broken ? 'rgba(214,224,240,.16)' : on ? GON : GLINE;
          return (
            <g key={sx}>
              <g className={on && hit ? s.mPress : undefined} key={on ? hit : 0}>
                <line x1={sx} y1="38" x2={sx} y2="58" stroke={c} strokeWidth="1.4" />
                <rect x={sx - 15} y="58" width="30" height="6" rx="2.5" fill={GFILL} stroke={c} strokeWidth="1.4" />
              </g>
              <g transform={`translate(${sx} 22)`}>
                <g className={on ? s.mSpin : undefined}>
                  <path d={GEAR} fill={GFILL} stroke={c} strokeWidth="1.4" />
                  <circle r="4.8" fill="none" stroke={c} strokeWidth="1.4" />
                </g>
              </g>
              <text x={sx} y="104" textAnchor="middle" fontSize="9.5" fontWeight="600" fill={broken ? (i === active ? ALARM : 'rgba(214,222,236,.4)') : on ? GON : 'rgba(214,222,236,.5)'}>{titles[i]}</text>
            </g>
          );
        })}
        {broken ? (
          <>
            <rect x="6" y="80" width={mid - 17.5} height="10" rx="5" fill="none" stroke="rgba(214,224,240,.28)" strokeWidth="1.2" />
            <rect x={mid + 10.5} y="80" width={mid - 16.5} height="10" rx="5" fill="none" stroke="rgba(214,224,240,.28)" strokeWidth="1.2" />
            <path d={`M${mid - 11.5} 77 l6 6 -4 5 6 6 M${mid + 10.5} 77 l-5 5 4 5 -6 6`} fill="none" stroke={ALARM} strokeWidth="1.4" />
            <path className={s.mDetour} d={`M8 74 Q${mid} -8 ${W - 8} 74`} fill="none" stroke="rgba(240,118,107,.6)" strokeWidth="2" strokeDasharray="6 6" />
            {XS.map((_, i) => { const [ax, ay] = arc(0.1 + i * 0.2); return <circle key={i} cx={ax} cy={ay} r={i === active ? 5.5 : 4} fill={GFILL} stroke={i === active ? ALARM : 'rgba(240,118,107,.6)'} strokeWidth="1.4" />; })}
            {(() => { const [ax, ay] = arc(active < 0 ? 0.02 : 0.1 + active * 0.2); return <g className={s.mRide} style={{ transform: `translate(${ax}px, ${ay - 4}px)` }}><g transform="scale(.8)"><g key={hit} className={s.mSquash}><Piece stage={stage} /></g></g></g>; })()}
          </>
        ) : (
          <>
            <rect x="6" y="80" width={W - 12} height="10" rx="5" fill="none" stroke="rgba(214,224,240,.28)" strokeWidth="1.2" />
            <g className={s.mRide} style={{ transform: `translate(${x}px, 80px)` }}>
              <g transform="scale(.95)"><g key={hit} className={s.mSquash}><Piece stage={stage} /></g></g>
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
