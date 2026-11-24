'use client';

import { Fragment, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import Mark from '@/components/Mark';
import { MACHINE_FEATURES, MACHINE_STAGES, HERO_COMPANIES, type MachineFeature } from '@/lib/home';
import s from './machineHero.module.css';

/*
 * The homepage hero: copy on the left, the Bussey-Matic 3000 on the right.
 *
 * Nothing runs until someone pulls the lever (Dr. Noodles gives it a nudge now
 * and then so it reads as touchable). A pull drops an idea in the top, walks the
 * status screen through Discover → Ship for a real project, then slides that
 * project's card down the out-chute onto the tray, linked to its case study.
 *
 * Everything is drawn in one 600×540 "machine" coordinate space and scaled as a
 * unit; the dog, smoke and lever sit above it (negative y) and the chute, tray and
 * Dr. Squash to its right (x > 600), which is why the wrapper reserves more room
 * than 600×540.
 */

const VERB = ['Discovering', 'Designing', 'Building', 'Validating', 'Shipping'];
const STEP = 1500;
const LEAD = 900;
// Bounds of everything that's drawn, in machine coordinates.
const BOUNDS = { x: 46, y: -135, w: 638, h: 640 };
// Never draw it bigger than this: at full size it outweighs the copy beside it.
const MAX_K = 0.84;

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/* ---------- static drawing helpers (deterministic, so server and client agree) ---------- */
function gearPath(r: number, teeth: number) {
  const tIn = r * 0.8, st = (Math.PI * 2) / teeth;
  const p = (a: number, rr: number) => `${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const t = i * st;
    d += `${i ? 'L' : 'M'}${p(t - st * 0.32, tIn)} L${p(t - st * 0.18, r)} L${p(t + st * 0.18, r)} L${p(t + st * 0.32, tIn)} `;
  }
  return d + 'Z';
}
const GEARS = [
  { x: 132, y: 364, r: 34, t: 12, c: 'g1' },
  { x: 190, y: 382, r: 22, t: 9, c: 'g2' },
  { x: 232, y: 352, r: 16, t: 8, c: 'g3' },
].map(g => ({ ...g, d: gearPath(g.r, g.t) }));

/** A scalloped ellipse: curly doodle fur. */
function fluff(cx0: number, cy0: number, rx: number, ry: number, n: number, puff = 1.16, rot = 0) {
  const pt = (a: number, k: number) => [cx0 + Math.cos(a + rot) * rx * k, cy0 + Math.sin(a + rot) * ry * k];
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, [x, y] = pt(a, 1);
    if (!i) { d += `M${x.toFixed(1)} ${y.toFixed(1)}`; continue; }
    const [qx, qy] = pt(a - Math.PI / n, puff);
    d += ` Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + 'Z';
}
const CREAM = '#ECDDC4', CREAM_D = '#DCC6A4', CREAM_L = '#F6EEE2';
const OL = { stroke: 'rgba(27,34,51,.5)', strokeWidth: 1.4, strokeLinejoin: 'round' as const };
const DOG_FEET = [91, 76] as const;
const DOG_SCALE = 1.22;
const LEVER_PIVOT = [195, 74] as const;
const LEVER_LEN = 95;
// Where the dog's own svg box sits, and where the exhaust stack stands. Every roof-top position is set
// from these constants (not the stylesheet), so the drawing and the paw maths can never disagree.
const DOG_BOX_X = DOG_FEET[0] - 76;
const STACK = { x: 474, w: 22, top: 50 } as const;

type Coat = { fur: string; furD: string; furL: string; curl: string; nose: string };
const CREAM_COAT: Coat = { fur: CREAM, furD: CREAM_D, furL: CREAM_L, curl: 'rgba(150,118,80,.38)', nose: '#1B2233' };
const BLACK_COAT: Coat = { fur: '#30333C', furD: '#23262D', furL: '#454A55', curl: 'rgba(255,255,255,.2)', nose: '#0D0F14' };

/**
 * A lab-coated poodle from the feet up (origin at the feet, facing right). `eyewear` is drawn over
 * the eyes; `front` is anything held in front of the coat.
 */
function Poodle({ c, eyewear, front }: { c: Coat; eyewear: ReactNode; front?: ReactNode }) {
  return (
    <>
      <g className={s.tail}><path d={fluff(-24, -34, 8, 6.5, 9, 1.22)} fill={c.fur} {...OL} /></g>
      <rect x="-13" y="-26" width="10" height="26" rx="5" fill={c.furD} {...OL} />
      <rect x="2" y="-26" width="10" height="26" rx="5" fill={c.fur} {...OL} />
      <ellipse cx="-5" cy="-1.5" rx="9" ry="4.4" fill={c.furD} {...OL} />
      <ellipse cx="10" cy="-1.5" rx="9" ry="4.4" fill={c.fur} {...OL} />
      <path d="M-19 -70 Q1 -77 21 -70 L26 -19 Q2 -13 -24 -19 Z" fill="#fff" {...OL} />
      <path d="M-6 -71 L2 -53 L10 -71 M2 -53 L3 -18" fill="none" {...OL} />
      <circle cx="3" cy="-44" r="1.5" fill="rgba(27,34,51,.55)" /><circle cx="3" cy="-33" r="1.5" fill="rgba(27,34,51,.55)" />
      <rect x="9" y="-43" width="11" height="8" rx="1.5" fill="#fff" {...OL} />
      <path d="M12 -47 V-41" stroke="#3D5A80" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="-15" y="-63" width="10" height="6.5" rx="1.2" fill="#3D5A80" />
      <path d={fluff(3, -74, 10, 6, 8)} fill={c.fur} {...OL} />
      <path d={fluff(22, -86, 7.5, 14, 9, 1.2)} fill={c.furD} {...OL} />
      <path d={fluff(4, -95, 21, 20, 15, 1.12)} fill={c.fur} {...OL} />
      <path d={fluff(1, -115, 11, 7, 9, 1.22)} fill={c.fur} {...OL} />
      <path d={fluff(17, -88, 11.5, 8.5, 10, 1.12)} fill={c.furL} {...OL} />
      <path d="M14 -82 Q18 -69 23 -81 Z" fill="#E98D9C" {...OL} />
      <path d="M12 -83 Q17 -79 22 -83" fill="none" stroke="rgba(27,34,51,.55)" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="22" cy="-92" rx="5" ry="3.8" fill={c.nose} /><ellipse cx="20.5" cy="-93.4" rx="1.6" ry="1" fill="rgba(255,255,255,.6)" />
      <g className={s.eyes}>
        <circle cx="5" cy="-99" r="2.5" fill={c.nose} /><circle cx="15.5" cy="-98.5" r="2.3" fill={c.nose} />
        <circle cx="5.8" cy="-99.8" r=".8" fill="#fff" /><circle cx="16.2" cy="-99.3" r=".8" fill="#fff" />
      </g>
      {eyewear}
      <path d={fluff(-15, -88, 8, 16, 10, 1.2, 0.15)} fill={c.fur} {...OL} />
      <path d="M-6 -101 q2 -3 4 0 M9 -114 q2 -3 4 0 M-3 -88 q2 -3 4 0 M-17 -80 q2 -3 4 0 M-14 -95 q2 -3 4 0" fill="none" stroke={c.curl} strokeWidth="1.1" strokeLinecap="round" />
      {front}
    </>
  );
}

/** Dr. Noodles: cream doodle with lab goggles pushed up on her forehead. Her arms are drawn by the hero: one on the lever, one on her hip. */
function Noodles() {
  return (
    <Poodle
      c={CREAM_COAT}
      eyewear={<>
        <path d="M-15 -106 Q4 -112 25 -107" fill="none" stroke="#2C3446" strokeWidth="2" />
        <circle cx="5" cy="-108.5" r="5" fill="#D6E4F3" stroke="#3D5A80" strokeWidth="1.8" />
        <circle cx="16.5" cy="-108" r="4.7" fill="#D6E4F3" stroke="#3D5A80" strokeWidth="1.8" />
      </>}
    />
  );
}

/** Dr. Squash: black poodle, reading glasses, clipboard. He signs off each feature that lands. */
function Squash() {
  return (
    <Poodle
      c={BLACK_COAT}
      eyewear={<>
        <circle cx="5" cy="-98.5" r="4.6" fill="rgba(214,228,243,.25)" stroke="#C9D3E0" strokeWidth="1.2" />
        <circle cx="16" cy="-98" r="4.3" fill="rgba(214,228,243,.25)" stroke="#C9D3E0" strokeWidth="1.2" />
        <path d="M9.6 -98.8 Q10.6 -100.4 11.7 -98.6" fill="none" stroke="#C9D3E0" strokeWidth="1.2" />
      </>}
      front={<>
        <path className={s.sleeve} d="M14 -64 Q24 -56 21 -40" fill="none" />
        <g className={s.clip}><g transform="rotate(-6 26 -50)">
          <rect x="13" y="-67" width="26" height="33" rx="2.5" fill="#C08A55" {...OL} />
          <rect x="15.5" y="-62" width="21" height="25.5" rx="1" fill="#fff" />
          <rect x="21.5" y="-69.5" width="9" height="5" rx="1.5" fill="#AEB6C3" {...OL} />
          <path d="M18.5 -57 h4 M24.5 -57 h9 M18.5 -51.5 h4 M24.5 -51.5 h7 M18.5 -46 h4 M24.5 -46 h8" stroke="rgba(27,34,51,.32)" strokeWidth="1.1" strokeLinecap="round" />
          <path className={s.tick} d="M24 -41.5 l2.6 2.6 l5.6 -6.6" pathLength={1} fill="none" stroke="#2F7D5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g></g>
        <circle cx="20.5" cy="-38.5" r="6.2" fill={BLACK_COAT.fur} {...OL} />
      </>}
    />
  );
}
/**
 * Josh: stands on the roof beside the intake, an idea held up over it and a coffee in the other hand
 * (shaved head, beard, grey pullover, after his photo) in a lab coat like the dogs'. Origin at his feet, facing the viewer.
 */
const SKIN = '#E7B793', SKIN_D = '#D19D77', HAIR = '#2A2220', PLACKET = '#5A6172';
const SWEATER = '#B3B9C4', JEANS = '#3D4F6E', JEANS_D = '#33435F';
function Josh() {
  return (
    <>
      {/* legs + shoes */}
      <rect x="-13" y="-42" width="11" height="40" rx="5" fill={JEANS_D} {...OL} />
      <rect x="2" y="-42" width="11" height="40" rx="5" fill={JEANS} {...OL} />
      <ellipse cx="-9" cy="-2" rx="9.5" ry="4.2" fill="#1B2233" {...OL} />
      <ellipse cx="9" cy="-2" rx="9.5" ry="4.2" fill="#1B2233" {...OL} />
      {/* raised arm (behind the body): holds the idea up over the intake, and tosses it in on a pull.
          The toss rotates about the shoulder (-15, -78): each arm part sits in a group with its origin there. */}
      <g transform="translate(-15 -78)"><g className={s.toss}><g transform="translate(15 78)">
        <path className={s.sleeve} style={{ stroke: '#EEF1F5' }} d="M-15 -78 Q-34 -76 -42 -92" fill="none" />
      </g></g></g>
      {/* lab coat, open over a heather pullover (charcoal stand collar and snap placket showing) */}
      <path d="M-20 -82 Q0 -88 20 -82 L25 -26 Q0 -20 -25 -26 Z" fill="#fff" {...OL} />
      <path d="M-8.5 -85 L0 -58 L8.5 -85 Z" fill={SWEATER} />
      <rect x="-2.4" y="-79" width="4.8" height="17" rx="1" fill={PLACKET} />
      <path d="M-8.5 -85 Q-7 -79 -2.4 -77.5 L2.4 -77.5 Q7 -79 8.5 -85 Q0 -81 -8.5 -85 Z" fill={PLACKET} {...OL} />
      <path d="M-8.5 -85 L-12 -74 L-4 -68 M8.5 -85 L12 -74 L4 -68 M-8.5 -85 L0 -58 L8.5 -85 M0 -58 V-22" fill="none" {...OL} />
      <circle cx="2.6" cy="-47" r="1.4" fill="rgba(27,34,51,.55)" /><circle cx="2.6" cy="-36" r="1.4" fill="rgba(27,34,51,.55)" />
      <rect x="8" y="-72" width="10" height="7.5" rx="1.4" fill="#fff" {...OL} />
      <path d="M11 -75.5 V-69.5" stroke="#3D5A80" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="-18" y="-70" width="10" height="6.5" rx="1.2" fill="#3D5A80" />
      <path d="M-20 -40 h9 M11 -40 h9" stroke="rgba(27,34,51,.4)" strokeWidth="1.2" strokeLinecap="round" />
      {/* other arm: coffee (raised a little on hover, like a cheers) */}
      <path className={s.sleeve} d="M16 -78 Q26 -66 22 -54" fill="none" />
      <g className={s.jMug}>
        <rect x="18" y="-63" width="12" height="13" rx="2.5" fill="#3D5A80" {...OL} />
        <path d="M30 -60 q5 0 5 4 q0 4 -5 4" fill="none" {...OL} />
        <circle cx="21" cy="-53" r="5.6" fill={SKIN} {...OL} />
      </g>
      {/* head: shaved, trimmed full beard, big grin */}
      <rect x="-5" y="-89" width="10" height="9" fill={SKIN_D} {...OL} />
      <circle cx="-16" cy="-103" r="4.2" fill={SKIN_D} {...OL} />
      <circle cx="16" cy="-103" r="4.2" fill={SKIN_D} {...OL} />
      <ellipse cx="0" cy="-106" rx="16" ry="20" fill={SKIN} {...OL} />
      <path d="M-9.5 -121 Q-4 -125.5 2 -125" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M-15.6 -106 C-16.5 -90 -9 -82 0 -82 C9 -82 16.5 -90 15.6 -106 L13.6 -106 C13 -99 8 -97.5 0 -97.5 C-8 -97.5 -13 -99 -13.6 -106 Z" fill={HAIR} {...OL} />
      <path d="M-6.5 -94 Q0 -86.5 6.5 -94 Z" fill="#fff" stroke="rgba(27,34,51,.5)" strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx="0" cy="-101" rx="3" ry="2.3" fill={SKIN_D} />
      <g className={s.eyes}>
        <circle cx="-6.5" cy="-107.5" r="2.2" fill="#1B2233" /><circle cx="6" cy="-107.5" r="2.2" fill="#1B2233" />
        <circle cx="-5.8" cy="-108.3" r=".75" fill="#fff" /><circle cx="6.7" cy="-108.3" r=".75" fill="#fff" />
      </g>
      <path className={s.jBrows} d="M-11.5 -112.5 q4.5 -3 9 -.6 M2 -113 q4.5 -2.6 9 .6" fill="none" stroke={HAIR} strokeWidth="2.8" strokeLinecap="round" />
      {/* the hand up top, and the idea in it (released mid-toss: the hero's flying token takes over) */}
      <g transform="translate(-15 -78)"><g className={s.toss}><g transform="translate(15 78)">
        <circle cx="-43" cy="-94" r="5.8" fill={SKIN} {...OL} />
        <g className={s.jIdea}>
          <circle cx="-45" cy="-109" r="10.5" fill="#fff" stroke="rgba(61,90,128,.55)" strokeWidth="1.5" />
          <g transform="translate(-52.2 -116.2) scale(.6)">
            <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" fill="none" stroke="#3D5A80" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      </g></g></g>
    </>
  );
}
const JOSH_FEET = [404, 76] as const;
const JOSH_SCALE = 1.04;

// Dr. Squash stands on the floor just past the tray, facing it (drawn mirrored).
const SQUASH_FEET = [650, 468] as const;
const SQUASH_SCALE = 1;
/** What Dr. Squash says when you pet him, in turn. */
const SQUASH_SAYS = ['LGTM.', 'Ship it', 'Woof', 'Approved ✓', 'Needs more treats', 'Woof woof.'];
/** What Josh says when you click him, in turn. */
const JOSH_SAYS = ['Hi, I’m Josh.', 'Let’s do this!', 'Got a gnarly problem?', 'Let’s build something.'];

/** What the status screen shows before the first pull. */
const REST = MACHINE_FEATURES[0];

export default function MachineHero() {
  const heroRef = useRef<HTMLElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const armRef = useRef<SVGGElement>(null);
  const leanRef = useRef<SVGGElement>(null);
  const sleeveRefs = useRef<(SVGPathElement | null)[]>([]);
  const pawRefs = useRef<(SVGCircleElement | null)[]>([]);
  const timers = useRef<number[]>([]);
  const runningRef = useRef(false);
  const nextRef = useRef(1);   // the first pull builds the second feature: the first is already on screen at rest
  const cardId = useRef(0);

  // Pet Dr. Squash: he hops, squints happily, wags hard and gives his review.
  const [pet, setPet] = useState(0);
  const [petting, setPetting] = useState(false);
  const petT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const petSquash = useCallback(() => {
    setPet(n => n + 1);
    setPetting(true);
    clearTimeout(petT.current);
    petT.current = setTimeout(() => setPetting(false), 1600);
  }, []);
  // Poke Josh: he hops and says something.
  const [poke, setPoke] = useState(0);
  const [talking, setTalking] = useState(false);
  const talkT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pokeJosh = useCallback(() => {
    setPoke(n => n + 1);
    setTalking(true);
    clearTimeout(talkT.current);
    talkT.current = setTimeout(() => setTalking(false), 1600);
  }, []);
  useEffect(() => () => { clearTimeout(petT.current); clearTimeout(talkT.current); }, []);

  const [k, setK] = useState(1);
  const [running, setRunning] = useState(false);
  const [used, setUsed] = useState(false);
  const [hot, setHot] = useState(false);
  // The dog and the lever are separate hover targets with a little air between them. Leaving one
  // waits a beat, so crossing that gap to the other doesn't snap the lever back to rest.
  const coolT = useRef(0);
  const heat = useCallback(() => {
    clearTimeout(coolT.current);
    if (runningRef.current) return;
    // Hovering drops the idle nudge animation, and dropping an animation never transitions, so
    // the lever would jump to its hover angle. Pin it where it is for one style pass first, so
    // the hover transition starts from there.
    const arm = armRef.current;
    if (arm) {
      const now = getComputedStyle(arm).transform;
      arm.style.animation = 'none';
      arm.style.transform = now;
      void getComputedStyle(arm).transform; // flush the pinned style
      flushSync(() => setHot(true));
      arm.style.animation = '';
      arm.style.transform = '';
    } else setHot(true);
  }, []);
  const cool = useCallback(() => { clearTimeout(coolT.current); coolT.current = window.setTimeout(() => setHot(false), 180); }, []);
  const [stage, setStage] = useState(-1);
  const [feat, setFeat] = useState<MachineFeature | null>(null);
  // At rest the screen shows a real result (the last build) instead of an empty machine.
  // The lever and the first pull are untouched.
  const [logs, setLogs] = useState<string[]>(REST.log.slice(-1)); // the last build's final step, as the screen reads after a run
  const [tray, setTray] = useState<{ id: number; f: MachineFeature }[]>([]);
  const [drops, setDrops] = useState(0);

  const run = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    clearTimeout(coolT.current);
    setRunning(true); setUsed(true); setHot(false);
    const f = MACHINE_FEATURES[nextRef.current++ % MACHINE_FEATURES.length];
    setFeat(f); setStage(-1); setLogs([]); setDrops(d => d + 1);
    const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    for (let i = 0; i < 5; i++) later(LEAD + i * STEP, () => { setStage(i); setLogs([f.log[i]]); });
    later(LEAD + 5 * STEP, () => {
      setStage(5);
      setTray(t => [...t, { id: ++cardId.current, f }].slice(-4));
      // machine off: lights, chips, bar and gauge all go back to idle
      later(1400, () => { runningRef.current = false; setRunning(false); setStage(-1); });
    });
  }, []);

  useEffect(() => () => { timers.current.forEach(clearTimeout); clearTimeout(coolT.current); }, []);

  // Fixed size: full size on wide screens, one smaller step on small laptops/tablets.
  // Only once it's stacked (≤1000px) does it shrink to fit, because a phone can't hold it.
  useLayoutEffect(() => {
    const col = colRef.current;
    if (!col) return;
    const fit = () => {
      const vw = window.innerWidth;
      // Side by side (≥1200px; below that the hero is copy only): shrink the machine just enough that the copy column still fits the
      // headline on two lines. Measured: that takes 8.25em of its clamp(46px, 5.2vw, 76px) size; a
      // few px spare on top. Page width without the scrollbar, since that's what the grid gets.
      const pw = document.documentElement.clientWidth;
      const need = 8.25 * Math.min(76, Math.max(46, vw * 0.052)) + 8;
      const gap = parseFloat(getComputedStyle(col.parentElement!).columnGap) || 0;
      setK(Math.min(MAX_K, Math.max(0.72, (Math.min(pw, 1440) - 64 - gap - need) / BOUNDS.w)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(col);
    window.addEventListener('resize', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, []);

  // Keep the dog's sleeves on the lever knob, whatever the lever is doing (hover, nudge, pull).
  useEffect(() => {
    const hero = heroRef.current;
    let raf = 0, visible = true;
    const aim = () => {
      const arm = armRef.current, lean = leanRef.current;
      if (arm && lean) {
        const m = getComputedStyle(arm).transform;
        const mm = m && m !== 'none' ? (m.match(/-?[\d.e]+/g) || []).map(Number) : [1, 0];
        const th = Math.atan2(mm[1], mm[0]), deg = (th * 180) / Math.PI;
        const knob = [LEVER_PIVOT[0] + LEVER_LEN * Math.sin(th), LEVER_PIVOT[1] - LEVER_LEN * Math.cos(th)];
        const t = Math.min(1, Math.max(0, (-4 - deg) / 46)), phi = ((7 - 17 * t) * Math.PI) / 180;   // leans in at rest, hauls back when pulling
        lean.setAttribute('transform', `translate(${DOG_FEET[0]} ${DOG_FEET[1]}) rotate(${((phi * 180) / Math.PI).toFixed(2)}) scale(${DOG_SCALE})`);
        const sh = (lx: number, ly: number) => {
          lx *= DOG_SCALE; ly *= DOG_SCALE;
          return [DOG_FEET[0] + lx * Math.cos(phi) - ly * Math.sin(phi), DOG_FEET[1] + lx * Math.sin(phi) + ly * Math.cos(phi)];
        };
        const f1 = (n: number) => n.toFixed(1);
        // far arm: hand on hip, elbow out behind her (drawn behind the coat, so the elbow and paw peek out)
        const hs = sh(-10, -67), he = sh(-38, -60), hp = sh(-23, -50);
        sleeveRefs.current[0]?.setAttribute('d', `M${f1(hs[0])} ${f1(hs[1])} L${f1(he[0])} ${f1(he[1])} L${f1(hp[0])} ${f1(hp[1])}`);
        pawRefs.current[0]?.setAttribute('cx', f1(hp[0]));
        pawRefs.current[0]?.setAttribute('cy', f1(hp[1]));
        // near arm: on the knob
        const p0 = sh(15, -64), p = [knob[0] + 3, knob[1] - 2], mid = [(p0[0] + p[0]) / 2, (p0[1] + p[1]) / 2 + 6];
        sleeveRefs.current[1]?.setAttribute('d', `M${f1(p0[0])} ${f1(p0[1])} Q${f1(mid[0])} ${f1(mid[1])} ${f1(p[0])} ${f1(p[1])}`);
        pawRefs.current[1]?.setAttribute('cx', f1(p[0]));
        pawRefs.current[1]?.setAttribute('cy', f1(p[1]));
      }
      if (visible) raf = requestAnimationFrame(aim);
    };
    const io = new IntersectionObserver(([e]) => {
      const was = visible; visible = e.isIntersecting;
      if (visible && !was) raf = requestAnimationFrame(aim);
    });
    if (hero) io.observe(hero);
    raf = requestAnimationFrame(aim);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  // A new card slides out of the chute's mouth, down the slide and onto the tray.
  const slideIn = useCallback((el: HTMLAnchorElement | null) => {
    if (!el || el.dataset.landed) return;
    el.dataset.landed = '1';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.animate([
      { transform: 'translate(-80px, -20px) scale(.3)', opacity: 0 },
      { transform: 'translate(-68px, -12px) scale(.45) rotate(14deg)', opacity: 1, offset: 0.2 },
      { transform: 'translate(-30px, 8px) scale(.8) rotate(10deg)', offset: 0.55 },
      { transform: 'translate(3px, 1px) scale(1) rotate(-2deg)', offset: 0.85 },
      { transform: 'translate(0, 0)' },
    ], { duration: 950, easing: 'cubic-bezier(.45,0,.3,1)' });
  }, []);

  const shipped = stage === 5;
  const p = running ? (stage < 0 ? 0 : shipped ? 1 : (stage + 0.5) / 5) : 0;
  const status = !running ? (used ? 'Ready' : 'Last build') : stage < 0 ? 'Starting…' : shipped ? 'Shipped ✓' : `${VERB[stage]}…`;
  const name = running && feat ? feat.name : used ? 'Pull the lever for another' : `${REST.name} · ${REST.company}`;
  const dogProps = {
    onPointerEnter: heat,
    onPointerLeave: cool,
    onClick: run,
  };

  return (
    <section ref={heroRef} className={s.hero} aria-label="Introduction">
      {/* dots over a linear wash in the upper-left corner; pure CSS so it is there on first paint */}
      <div className={s.bg} aria-hidden="true" />
      <div className={s.inner}>
        <div className={s.copy}>
          <h1 className={`tight ${s.title}`}>
            {['I', 'design', 'complex', 'systems', 'that', 'ship'].map((w, i, all) => {
              const last = i === all.length - 1;
              return (
                // the space sits between the word boxes, so the headline can wrap there
                <Fragment key={w}>
                  <span className={s.word} style={{ animationDelay: `${120 + i * 70}ms` }}>
                    {last ? (
                      // the payoff word: accent colour, underlined by a stroke that draws in once the line has landed
                      <span className={s.ship}>
                        {w}
                        <svg className={s.shipLine} viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
                          <path d="M2 8.5 C 22 3.5, 48 3, 98 6" pathLength="1" />
                        </svg>
                      </span>
                    ) : w}
                    {last && <span className="accent">.</span>}
                  </span>
                  {!last && ' '}
                </Fragment>
              );
            })}
          </h1>
          <p className={s.lede}>
            Hi, I&apos;m Josh, a front-end developer turned product design lead with 12+ years of
            experience untangling enterprise software. I lead 0→1 work, design systems, and the kind
            of quiet refactors no one notices but everyone benefits from.
          </p>
          <div className={s.acts}>
            <Link href="/work" className="btn">View case studies <Mark /></Link>
            <Link href="/work/identity-profiles" className="btn ghost">Read the AI case study <Mark /></Link>
          </div>
          <p className={s.cos}>
            <span>Shipped at</span>
            {HERO_COMPANIES.map((c, i) => <Fragment key={c}>{i > 0 && <i aria-hidden="true">·</i>}<b>{c}</b></Fragment>)}
          </p>
        </div>

        <div ref={colRef} className={s.col}>
          <div className={s.box} style={{ width: BOUNDS.w * k, height: BOUNDS.h * k }}>
            <div
              className={cx(s.bm, running && s.run, used && s.used, hot && !running && s.hot, shipped && s.shipped)}
              style={{ transform: `scale(${k})`, left: -BOUNDS.x * k, top: -BOUNDS.y * k }}
            >
              <div className={s.floor} aria-hidden="true" />
              <svg className={s.body} viewBox="0 0 600 540" aria-hidden="true">
                <defs>
                  <linearGradient id="bmShell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#ECEFF5" /></linearGradient>
                  <linearGradient id="bmFoot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DDE2EA" /><stop offset="1" stopColor="#C9D0DB" /></linearGradient>
                  <linearGradient id="bmWell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E7EBF1" /><stop offset="1" stopColor="#F3F5F8" /></linearGradient>
                </defs>
                <g stroke="rgba(27,34,51,.3)" strokeWidth="1.4">
                  <rect x="88" y="436" width="46" height="32" rx="7" fill="url(#bmFoot)" />
                  <rect x="366" y="436" width="46" height="32" rx="7" fill="url(#bmFoot)" />
                </g>
                {/* exhaust stack on the case's upper-right side: a short stub out of the wall (its left end
                    tucks under the shell), then a straight stack with a collar and a cap */}
                <rect x="446" y="108" width={STACK.x - 446 + 4} height="18" fill="url(#bmShell)" stroke="rgba(27,34,51,.32)" strokeWidth="1.4" />
                <rect x={STACK.x} y={STACK.top} width={STACK.w} height={130 - STACK.top} rx="4" fill="url(#bmShell)" stroke="rgba(27,34,51,.32)" strokeWidth="1.4" />
                <rect x={STACK.x - 2} y="84" width={STACK.w + 4} height="6" rx="2" fill="#fff" stroke="rgba(27,34,51,.3)" strokeWidth="1.2" />
                <rect x={STACK.x - 5} y={STACK.top - 8} width={STACK.w + 10} height="10" rx="5" fill="#fff" stroke="rgba(27,34,51,.32)" strokeWidth="1.4" />
                {/* out tray: a steep ramp from the slot into a tray with a lip at the far end, on two short
                    legs that stand on the same floor line as the machine's feet (y 468). The ramp's top end
                    tucks under the port hood. */}
                <g stroke="rgba(27,34,51,.3)" strokeWidth="1.4">
                  <rect x="502" y="448" width="8" height="20" rx="2" fill="url(#bmFoot)" />
                  <rect x="590" y="448" width="8" height="20" rx="2" fill="url(#bmFoot)" />
                </g>
                <path d="M466 402 L490 440 H602 V434 Q602 431 605 431 H609 Q612 431 612 434 V447 Q612 451 608 451 H488 Q484 451 482 448 L460 414 Z" fill="url(#bmShell)" stroke="rgba(27,34,51,.32)" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M493 443.5 H600" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity=".9" />
                <text x="546" y="486" textAnchor="middle" fontSize="11" fontWeight="500" fill="#5A6172">Features out</text>
                {/* intake chute */}
                <path d="M290 14 H370 L352 78 H308 Z" fill="url(#bmShell)" stroke="rgba(27,34,51,.32)" strokeWidth="1.4" strokeLinejoin="round" />
                <rect x="280" y="6" width="100" height="12" rx="6" fill="#fff" stroke="rgba(27,34,51,.32)" strokeWidth="1.4" />
                <text x="330" y="-6" textAnchor="middle" fontSize="11" fontWeight="500" fill="#5A6172">Ideas in</text>
                {/* shell */}
                <rect x="40" y="76" width="420" height="372" rx="26" fill="url(#bmShell)" stroke="rgba(27,34,51,.32)" strokeWidth="1.4" />
                <rect x="47" y="83" width="406" height="358" rx="20" fill="none" stroke="#fff" strokeWidth="1.5" opacity=".9" />
                <g fill="#fff" stroke="rgba(27,34,51,.3)" strokeWidth="1.2">
                  <circle cx="62" cy="98" r="4.5" /><circle cx="438" cy="98" r="4.5" /><circle cx="62" cy="426" r="4.5" /><circle cx="438" cy="426" r="4.5" />
                </g>
                <path d="M60.3 99.7l3.4-3.4M436.3 99.7l3.4-3.4M60.3 427.7l3.4-3.4M436.3 427.7l3.4-3.4" stroke="rgba(27,34,51,.35)" strokeWidth="1.1" strokeLinecap="round" />
                {/* gear window */}
                <rect x="74" y="312" width="198" height="104" rx="12" fill="url(#bmWell)" stroke="rgba(27,34,51,.3)" strokeWidth="1.4" />
                <rect x="75.5" y="313.5" width="195" height="101" rx="11" fill="none" stroke="rgba(27,34,51,.06)" strokeWidth="3" />
                {GEARS.map(g => (
                  <g key={g.c} transform={`translate(${g.x} ${g.y})`}>
                    <g className={`${s.gear} ${s[g.c]}`}>
                      <path d={g.d} fill="#fff" stroke="rgba(27,34,51,.32)" strokeWidth="1.4" strokeLinejoin="round" />
                      <circle r={g.r * 0.28} fill="none" stroke="rgba(27,34,51,.32)" strokeWidth="1.4" />
                    </g>
                  </g>
                ))}
                {/* gauge */}
                <rect x="302" y="312" width="124" height="104" rx="12" fill="url(#bmWell)" stroke="rgba(27,34,51,.3)" strokeWidth="1.4" />
                <path d="M324 386 A40 40 0 0 1 404 386" fill="none" stroke="#DCE2EA" strokeWidth="7" strokeLinecap="round" />
                <path className={s.arc} d="M324 386 A40 40 0 0 1 404 386" fill="none" stroke="#3D5A80" strokeWidth="7" strokeLinecap="round" pathLength={100} strokeDasharray="100" style={{ strokeDashoffset: 100 - p * 100 }} />
                <path d="M316 386h-4M364 338v-4M412 386h4M330 352l-3-3M398 352l3-3" stroke="rgba(27,34,51,.35)" strokeWidth="1.2" strokeLinecap="round" />
                <line className={s.needle} x1="364" y1="386" x2="364" y2="354" stroke="#1B2233" strokeWidth="2.4" strokeLinecap="round" style={{ transform: `rotate(${-90 + p * 180}deg)` }} />
                <circle cx="364" cy="386" r="5" fill="#1B2233" />
                <text x="364" y="407" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="1.2" fill="#5A6172">PROGRESS</text>
                {/* out port: a slim hood on the case's side, with the slot the cards come out of */}
                <path d="M452 340 H468 Q478 340 478 350 V410 Q478 418 470 418 H452 Z" fill="url(#bmShell)" stroke="rgba(27,34,51,.32)" strokeWidth="1.4" />
                <rect x="468" y="350" width="6" height="56" rx="3" fill="#2C3446" />
                {/* maker's mark: small and quiet, stamped on the case, right-aligned to the screen edge */}
                <text x="426" y="297" textAnchor="end" fontSize="8.5" fontWeight="700" letterSpacing="1.4" fill="#9AA1AE">
                  BUSSEY-MATIC 3000
                </text>
              </svg>

              <div className={s.screen} aria-live="polite">
                <div className={s.hd}><span>Status</span><b>{status}</b></div>
                <div className={s.name}>{name}</div>
                <div className={s.chips}>
                  {MACHINE_STAGES.map((c, j) => (
                    <span key={c} className={cx(((running && (j < stage || shipped)) || !used) && s.done, running && j === stage && s.now)}>{c}</span>
                  ))}
                </div>
                <div className={s.log}>{logs.map((l, i) => <div key={`${l}-${i}`}>{l}</div>)}</div>
                <div className={s.bar}><i style={{ width: `${(used ? p : 1) * 100}%` }} /></div>
              </div>
              <div className={s.lights} aria-hidden="true">
                {MACHINE_STAGES.map((c, j) => <i key={c} className={cx(running && j === stage && s.on, running && (j < stage || shipped) && s.ok)} />)}
              </div>

              <button
                type="button"
                className={s.lever}
                style={{ left: LEVER_PIVOT[0] - 48, top: LEVER_PIVOT[1] - 150 }}
                onClick={run}
                onPointerEnter={heat}
                onPointerLeave={cool}
                aria-label="Pull the lever to build a feature"
                aria-disabled={running}
              >
                <svg viewBox="0 0 96 170" aria-hidden="true">
                  <rect x="26" y="138" width="44" height="24" rx="8" fill="#fff" stroke="rgba(27,34,51,.32)" strokeWidth="1.4" />
                  <g className={s.arm} ref={armRef}>
                    <line x1="48" y1="150" x2="48" y2="62" stroke="rgba(27,34,51,.5)" strokeWidth="7" strokeLinecap="round" />
                    <circle className={s.ring} cx="48" cy="55" r="17" fill="none" stroke="#D64035" strokeWidth="2" />
                    <circle className={s.knob} cx="48" cy="55" r="17" />
                    <circle cx="42" cy="49" r="5" fill="rgba(255,255,255,.35)" />
                  </g>
                  <circle cx="48" cy="150" r="10" fill="#fff" stroke="rgba(27,34,51,.4)" strokeWidth="1.6" />
                  <circle cx="48" cy="150" r="3.5" fill="rgba(27,34,51,.4)" />
                </svg>
              </button>
              {/* Dr. Noodles says it: a comic speech bubble, tail curling down to his head */}
              <div className={s.say} style={{ left: DOG_FEET[0] + 30 }} aria-hidden="true">
                Pull to build a feature
                <svg className={s.sayTail} viewBox="0 0 22 20" width="22" height="20"><path d="M5 0 Q7 10 0 19 Q13 13 18 0" /></svg>
              </div>

              {/* Dr. Noodles: cream doodle, lab coat, goggles, one paw on the lever and one on her hip */}
              <svg className={s.dog} style={{ left: DOG_BOX_X }} viewBox={`${DOG_BOX_X} -130 240 220`} aria-hidden="true">
                <g className={s.pop} {...dogProps}>
                  <path ref={el => { sleeveRefs.current[0] = el; }} className={s.sleeve} fill="none" />
                  <circle ref={el => { pawRefs.current[0] = el; }} r="6.6" fill={CREAM_D} {...OL} />
                  <g ref={leanRef} transform={`translate(${DOG_FEET[0]} ${DOG_FEET[1]}) rotate(7) scale(${DOG_SCALE})`}>
                    <Noodles />
                  </g>
                  <path ref={el => { sleeveRefs.current[1] = el; }} className={s.sleeve} fill="none" />
                  <circle ref={el => { pawRefs.current[1] = el; }} r="7" fill={CREAM} {...OL} />
                </g>
              </svg>

              {/* Josh, on the roof by the intake */}
              <svg className={cx(s.josh, talking && s.jTalking)} style={{ left: JOSH_FEET[0] - 80, top: JOSH_FEET[1] - 160 }} viewBox={`${JOSH_FEET[0] - 80} ${JOSH_FEET[1] - 160} 120 168`} aria-hidden="true">
                <g key={poke} className={cx(s.pet, poke > 0 && s.hop)} onClick={pokeJosh}>
                  <g transform={`translate(${JOSH_FEET[0]} ${JOSH_FEET[1]}) scale(${JOSH_SCALE})`}>
                    <Josh />
                  </g>
                </g>
              </svg>
              {talking && (
                <div className={s.sqSay} style={{ left: JOSH_FEET[0] - 6, top: JOSH_FEET[1] - 150 }} aria-hidden="true">
                  <div key={poke} className={cx(s.sqBubble, s.jsBubble)}>
                    {JOSH_SAYS[(poke - 1) % JOSH_SAYS.length]}
                    <svg className={cx(s.sqTail, s.jsTail)} viewBox="0 0 22 20" width="22" height="20"><path d="M5 0 Q7 10 0 19 Q13 13 18 0" /></svg>
                  </div>
                </div>
              )}

              <div className={s.steam} style={{ left: STACK.x + STACK.w / 2, top: STACK.top - 6 }} aria-hidden="true"><i /><i /><i /><i /><i /></div>
              {drops > 0 && (
                <div key={drops} className={s.token} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#3D5A80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></svg>
                </div>
              )}
              <div className={s.tray}>
                {tray.map((c, i) => {
                  const back = tray.length - 1 - i;
                  return (
                    <Link
                      key={c.id}
                      ref={back === 0 ? slideIn : undefined}
                      href={`/work/${c.f.slug}`}
                      className={s.card}
                      tabIndex={back === 0 ? 0 : -1}
                      aria-hidden={back === 0 ? undefined : true}
                      style={back ? { transform: `translate(${back * 4}px, ${-back * 7}px)`, opacity: back < 3 ? 0.6 - (back - 1) * 0.25 : 0, zIndex: -back } : undefined}
                    >
                      <b>{c.f.name}</b>
                      <span>{c.f.outcome}</span>
                      <small>{c.f.company} · Read the case study →</small>
                    </Link>
                  );
                })}
              </div>

              {/* Dr. Squash: black poodle with a clipboard, checking each feature off as it lands */}
              {/* his review, when you pet him: anchored by its tail just above his head */}
              {petting && (
                <div className={s.sqSay} style={{ left: SQUASH_FEET[0] + 14, top: SQUASH_FEET[1] - 132 }} aria-hidden="true">
                  <div key={pet} className={s.sqBubble}>
                    {SQUASH_SAYS[(pet - 1) % SQUASH_SAYS.length]}
                    <svg className={s.sqTail} viewBox="0 0 22 20" width="22" height="20"><path d="M5 0 Q7 10 0 19 Q13 13 18 0" /></svg>
                  </div>
                </div>
              )}
              <svg className={cx(s.squash, petting && s.petting)} viewBox="608 318 120 160" aria-hidden="true">
                <g className={s.nod}>
                  <g key={pet} className={cx(s.pet, pet > 0 && s.hop)} onClick={petSquash}>
                    <g transform={`translate(${SQUASH_FEET[0]} ${SQUASH_FEET[1]}) scale(${-SQUASH_SCALE} ${SQUASH_SCALE})`}>
                      <Squash />
                    </g>
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
