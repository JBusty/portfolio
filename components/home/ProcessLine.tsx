'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { PROCESS_STEPS, PROCESS_POWER } from '@/lib/home';
import { STATS } from '@/lib/data';
import { drawJosh } from './drawJosh';
import ProcessMini from './ProcessMini';
import ResultCard from './ResultCard';
import { useSeen } from './useSeen';
import s from './processLine.module.css';

/*
 * "My process": a conveyor drawn on canvas, one station per step card below it,
 * driven by Josh running in a hamster wheel in the sixth column. Ideas ride the
 * belt and get stamped into their next form at each station.
 *
 * "Break process" knocks everything off the belt (and Josh round the wheel), and
 * the cards swap to Plan B while pieces take a dashed detour over the gap.
 * Cards only light up when pointed at; they never advance on their own.
 */

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// Pace. Deliberately unhurried.
const SPEED = 60;          // px/s along the belt
const PAUSE = 1.5;         // s at each station
const FEED_EVERY = 7500;   // ms between new ideas
const DETOUR_EVERY = 4200;
const DETOUR_SPEED = 0.11; // share of the arc per second
const JAM_MS = 1100;

const T = {
  rail: 'rgba(214,224,240,.2)', railDim: 'rgba(214,224,240,.1)', belt: 'rgba(214,224,240,.28)', tick: 'rgba(214,224,240,.16)',
  gFill: '#1F2839', gLine: 'rgba(214,224,240,.42)', gOn: '#A9C0E0', gDim: 'rgba(214,224,240,.16)', ink: 'rgba(226,232,242,.72)',
  alarm: '#F0766B', alarmSoft: 'rgba(240,118,107,.6)', label: 'rgba(214,222,236,.85)', wheel: 'rgba(214,224,240,.5)',
  wheelIn: 'rgba(169,192,224,.06)', stand: 'rgba(214,224,240,.3)',
};

type Mode = 'normal' | 'jam' | 'detour';
interface Item { x: number; stage: number; pause: number; at: number; hit?: number; hitDone?: boolean; sq?: number; done?: boolean }
interface Falling { x: number; y: number; stage: number; vx: number; vy: number; rot: number; vr: number }
interface Detour { t: number; stage: number }

export default function ProcessLine() {
  const [broken, setBroken] = useState(false);
  const [shake, setShake] = useState(false);
  const [smash, setSmash] = useState(false);
  const [cur, setCur] = useState(-1);   // phones: the step card in the middle of the screen
  const [secRef, seen] = useSeen<HTMLElement>(0.15);
  const panelRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const powerRef = useRef<HTMLElement>(null);
  const api = useRef<{ breakIt: () => void; restore: () => void } | null>(null);

  useEffect(() => {
    const cv = cvRef.current, panel = panelRef.current, power = powerRef.current;
    const c = cv?.getContext('2d');
    if (!cv || !panel || !power || !c) return;
    const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let PW = 0, PH = 0, xs: number[] = [], beltY = 0, cogY = 0, beltEnd = 0, wx = 0, wy = 0, WR = 0;
    let items: Item[] = [], falling: Falling[] = [], detour: Detour[] = [];
    let angle = 0, beltPos = 0, wheelA = 0, wheelV = 0, runPh = 0, jamA = 0, hover = -1, last = 0, nextAuto = 0, raf = 0;
    const stamp = [0, 0, 0, 0, 0];
    let mode: Mode = 'normal', modeT = 0;
    const mouse = { x: -1, in: false };

    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1), r = cv!.getBoundingClientRect();
      PW = r.width; PH = r.height;
      cv!.width = PW * dpr; cv!.height = PH * dpr; c!.setTransform(dpr, 0, 0, dpr, 0, 0);
      xs = cards.map(k => { const q = k.getBoundingClientRect(); return q.left - r.left + q.width / 2; });
      beltEnd = cards[4].getBoundingClientRect().right - r.left - 10;
      const pw = power!.getBoundingClientRect();
      wx = pw.left - r.left + pw.width / 2;
      beltY = PH - 56; cogY = beltY - 96;
      // the wheel keeps clear of the column edges and the Break process box above it
      WR = Math.max(40, Math.min(68, pw.width / 2 - 26, (PH - 50) / 2)); wy = PH - 26 - WR;
    }

    function gear(x: number, y: number, r: number, teeth: number, a: number, on: boolean, dim: boolean) {
      c!.save(); c!.translate(x, y); c!.rotate(a); c!.beginPath();
      const tIn = r * 0.82, st = (Math.PI * 2) / teeth;
      for (let i = 0; i < teeth; i++) {
        const q = i * st;
        c!.lineTo(Math.cos(q - st * 0.32) * tIn, Math.sin(q - st * 0.32) * tIn);
        c!.lineTo(Math.cos(q - st * 0.18) * r, Math.sin(q - st * 0.18) * r);
        c!.lineTo(Math.cos(q + st * 0.18) * r, Math.sin(q + st * 0.18) * r);
        c!.lineTo(Math.cos(q + st * 0.32) * tIn, Math.sin(q + st * 0.32) * tIn);
      }
      c!.closePath(); c!.fillStyle = T.gFill; c!.fill();
      c!.strokeStyle = dim ? T.gDim : on ? T.gOn : T.gLine; c!.lineWidth = 1.4; c!.stroke();
      c!.beginPath(); c!.arc(0, 0, r * 0.3, 0, 7); c!.stroke();
      c!.beginPath();
      for (let i = 0; i < 4; i++) { const q = (i * Math.PI) / 2; c!.moveTo(Math.cos(q) * r * 0.3, Math.sin(q) * r * 0.3); c!.lineTo(Math.cos(q) * r * 0.62, Math.sin(q) * r * 0.62); }
      c!.stroke(); c!.restore();
    }

    // The idea in each of its forms: ? → sticky note → wireframe → built → tested → shipped.
    function piece(x: number, y: number, stage: number, a: number, rot = 0, sx = 1, sy = 1) {
      const g = c!, ink = T.ink, navy = '#3D5A80';
      g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot); g.scale(1.3 * sx, 1.3 * sy);
      if (stage === 0) {
        g.strokeStyle = ink; g.setLineDash([3, 3]); g.beginPath(); g.arc(0, -12, 11, 0, 7); g.stroke(); g.setLineDash([]);
        g.fillStyle = ink; g.font = '600 12px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('?', 0, -7.5);
      } else if (stage === 1) {
        g.fillStyle = '#E6EDF7'; g.strokeStyle = 'rgba(61,90,128,.5)'; g.beginPath(); g.rect(-14, -28, 28, 28); g.fill(); g.stroke();
        g.fillStyle = 'rgba(61,90,128,.5)'; g.fillRect(-9, -21, 16, 2); g.fillRect(-9, -16, 12, 2); g.fillRect(-9, -11, 14, 2);
      } else if (stage === 2) {
        g.strokeStyle = ink; g.setLineDash([3, 2]); g.beginPath(); g.roundRect(-22, -30, 44, 30, 3); g.stroke(); g.setLineDash([]);
        g.strokeRect(-17, -25, 14, 3); g.strokeRect(-17, -18, 30, 2); g.strokeRect(-17, -13, 24, 2); g.strokeRect(4, -8, 13, 5);
      } else {
        g.fillStyle = '#fff'; g.strokeStyle = stage >= 4 ? 'rgba(61,90,128,.7)' : 'rgba(27,34,51,.45)'; g.lineWidth = 1;
        g.beginPath(); g.roundRect(-22, -30, 44, 30, 4); g.fill(); g.stroke();
        g.fillStyle = stage >= 5 ? navy : 'rgba(27,34,51,.18)'; g.fillRect(-22, -30, 44, 6);
        g.fillStyle = 'rgba(27,34,51,.3)'; g.fillRect(-17, -19, 18, 3); g.fillStyle = 'rgba(27,34,51,.15)'; g.fillRect(-17, -13, 28, 2);
        g.fillStyle = stage >= 4 ? navy : 'rgba(27,34,51,.35)'; g.beginPath(); g.roundRect(4, -9, 13, 5, 2.5); g.fill();
        if (stage === 4) { g.strokeStyle = '#2F7D5B'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(13, -27); g.lineTo(15.5, -24.5); g.lineTo(20, -29); g.stroke(); }
      }
      g.restore();
    }

    // The detour: a quick arc over the broken line, with a Plan B stop per step.
    const arcPt = (t: number): [number, number] => {
      const x0 = 40, x1 = beltEnd, y0 = beltY - 6, u = 1 - t;
      return [u * u * x0 + 2 * u * t * ((x0 + x1) / 2) + t * t * x1, u * u * y0 + 2 * u * t * -110 + t * t * y0];
    };
    function feed() {
      if (mode === 'normal') { if (items.length < 3 && !items.some(i => i.x < 120)) items.push({ x: 0, stage: 0, pause: 0, at: -1 }); }
      else if (mode === 'detour') { if (detour.length < 3 && !detour.some(d => d.t < 0.15)) detour.push({ t: 0, stage: 0 }); }
    }
    function light(i: number) { cards.forEach((k, j) => k.classList.toggle(s.on, j === i)); }

    api.current = {
      breakIt() {
        mode = 'jam'; modeT = performance.now(); jamA = wheelA;
        items.forEach(it => falling.push({ x: it.x, y: beltY, stage: it.stage, vx: (Math.random() - 0.5) * 80, vy: -120 - Math.random() * 80, rot: 0, vr: (Math.random() - 0.5) * 6 }));
        items = [];
      },
      restore() { mode = 'normal'; detour = []; falling = []; nextAuto = 0; },
    };

    function wheel(now: number, isBroken: boolean, jam: number) {
      const g = c!;
      g.strokeStyle = T.stand; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(wx - WR * 0.62, PH - 12); g.lineTo(wx, wy); g.lineTo(wx + WR * 0.62, PH - 12);
      g.moveTo(wx - WR * 0.78, PH - 12); g.lineTo(wx + WR * 0.78, PH - 12);
      g.stroke();
      // drive belt from the wheel's pulley to the conveyor's end roller
      const rx = beltEnd - 7;
      g.save(); g.setLineDash([5, 4]); g.lineDashOffset = -beltPos * 0.5; g.strokeStyle = T.belt; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(wx, wy - 11); g.lineTo(rx, beltY); g.moveTo(wx, wy + 11); g.lineTo(rx, beltY + 14); g.stroke(); g.restore();
      g.fillStyle = T.wheelIn; g.beginPath(); g.arc(wx, wy, WR, 0, 7); g.fill();
      g.strokeStyle = T.wheel; g.lineWidth = 1.2; g.beginPath();
      for (let i = 0; i < 8; i++) { const a = wheelA + (i * Math.PI) / 4; g.moveTo(wx + Math.cos(a) * 11, wy + Math.sin(a) * 11); g.lineTo(wx + Math.cos(a) * (WR - 6), wy + Math.sin(a) * (WR - 6)); }
      g.stroke();
      g.fillStyle = T.gFill; g.beginPath(); g.arc(wx, wy, 11, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.arc(wx, wy, 3.5, 0, 7); g.stroke();
      // Josh, running (or catching his breath)
      const pose = isBroken ? 'tired' : wheelV > 0.4 ? 'run' : 'stand';
      g.save();
      if (jam > 0) { const loop = -(1 - jam) * Math.PI * 2 * 1.05; g.translate(wx, wy); g.rotate(loop); g.translate(-wx, -wy); }
      drawJosh(g, wx, wy + WR - 6, WR / 92, { face: -1, phase: runPh, pose, t: now / 1000, sweat: isBroken || wheelV > 2.2, shadow: false, pants: '#55658A' });
      g.restore();
      g.strokeStyle = T.wheel; g.lineWidth = 2; g.beginPath(); g.arc(wx, wy, WR, 0, 7); g.stroke();
      g.lineWidth = 1.2; g.beginPath(); g.arc(wx, wy, WR - 5, 0, 7); g.stroke();
      g.beginPath();
      for (let i = 0; i < 30; i++) { const a = wheelA + (i * Math.PI) / 15; g.moveTo(wx + Math.cos(a) * (WR - 5), wy + Math.sin(a) * (WR - 5)); g.lineTo(wx + Math.cos(a) * WR, wy + Math.sin(a) * WR); }
      g.stroke();
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const r = panel!.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight || !PW) { last = now; return; }
      const dt = Math.min(0.05, Math.max(0, (now - (last || now)) / 1000)); last = now;
      const g = c!;
      if (mode === 'jam' && now - modeT > JAM_MS) { mode = 'detour'; nextAuto = 0; }
      if (now > nextAuto && (!reduce || mode === 'detour')) { feed(); nextAuto = now + (mode === 'detour' ? DETOUR_EVERY : FEED_EVERY); }
      g.clearRect(0, 0, PW, PH);
      const isBroken = mode !== 'normal', jam = mode === 'jam' ? 1 - Math.min(1, (now - modeT) / JAM_MS) : 0;
      const busy = items.some(i => i.pause > 0), on = !isBroken && items.length > 0;
      // only "on" while there's work on the belt: gears, belt and wheel all stop otherwise
      wheelV += ((on ? (busy ? 1.7 : 2.4) : 0) - wheelV) * Math.min(1, dt * (on ? 2.5 : 4));
      if (jam > 0) wheelA = jamA - (1 - jam) * Math.PI * 2 * 1.05; else wheelA -= wheelV * dt;
      runPh += wheelV * dt * 4.2;
      const spin = wheelV / 2.4;
      angle += 2 * spin * dt; beltPos += SPEED * dt * spin;
      hover = -1;
      if (mouse.in) xs.forEach((x, i) => { if (Math.abs(mouse.x - x) < 70) hover = i; });
      const shakeX = () => (jam ? (Math.random() - 0.5) * 5 * jam : 0);

      g.strokeStyle = isBroken ? T.railDim : T.rail; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(xs[0] - 60, cogY); g.lineTo(xs[4] + 60, cogY); g.stroke();
      const mid = (24 + beltEnd) / 2, gapL = mid - 18, gapR = mid + 18;
      g.strokeStyle = T.belt;
      if (isBroken) {
        g.beginPath(); g.roundRect(24, beltY, gapL - 24, 14, [7, 0, 0, 7]); g.stroke();
        g.beginPath(); g.roundRect(gapR, beltY, beltEnd - gapR, 14, [0, 7, 7, 0]); g.stroke();
        g.strokeStyle = T.alarm; g.lineWidth = 1.4; g.beginPath();
        g.moveTo(gapL, beltY - 3); g.lineTo(gapL + 7, beltY + 5); g.lineTo(gapL + 2, beltY + 10); g.lineTo(gapL + 9, beltY + 17);
        g.moveTo(gapR, beltY - 3); g.lineTo(gapR - 6, beltY + 4); g.lineTo(gapR - 1, beltY + 10); g.lineTo(gapR - 8, beltY + 17);
        g.stroke();
        g.save(); g.beginPath(); g.rect(24, beltY, beltEnd - 24, 14); g.clip(); g.strokeStyle = T.alarmSoft; g.globalAlpha = 0.35; g.lineWidth = 5;
        for (let x = 20; x < beltEnd; x += 16) { if (x > gapL - 6 && x < gapR + 6) continue; g.beginPath(); g.moveTo(x, beltY + 16); g.lineTo(x + 14, beltY - 2); g.stroke(); }
        g.restore();
      } else {
        g.beginPath(); g.roundRect(24, beltY, beltEnd - 24, 14, 7); g.stroke();
        const off = beltPos % 18; g.strokeStyle = T.tick; g.beginPath();
        for (let x = 34 + off; x < beltEnd - 10; x += 18) { g.moveTo(x, beltY + 4); g.lineTo(x - 4, beltY + 11); }
        g.stroke();
      }
      g.lineWidth = 1.2;
      [31, beltEnd - 7].forEach(x => { g.beginPath(); g.arc(x, beltY + 7, 7, 0, 7); g.fillStyle = T.gFill; g.fill(); g.strokeStyle = T.gLine; g.stroke(); });
      xs.forEach((x, i) => { if (i < 4) gear((x + xs[i + 1]) / 2 + shakeX(), cogY, 15, 8, -angle * 2.4, false, isBroken); });
      xs.forEach((x, i) => {
        const lit = !isBroken && (stamp[i] > 0 || hover === i);
        gear(x + shakeX(), cogY + shakeX(), 36, 12, angle + i * 0.3 + (jam ? Math.sin(now * 0.09 + i) * 0.08 * jam : 0), lit, isBroken);
        stamp[i] = Math.max(0, stamp[i] - dt * 1.2);
        const p = 1 - Math.min(1, stamp[i]);
        const down = p <= 0 || p >= 1 ? 0 : p < 0.45 ? Math.pow(p / 0.45, 2) : Math.exp((-5 * (p - 0.45)) / 0.55) * Math.cos((9 * (p - 0.45)) / 0.55);
        const press = isBroken ? 0 : down * 20;
        g.strokeStyle = isBroken ? T.gDim : lit ? T.gOn : T.gLine; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(x, cogY + 36); g.lineTo(x, beltY - 56 + press); g.stroke();
        g.beginPath(); g.roundRect(x - 22, beltY - 56 + press, 44, 8, 3); g.fillStyle = T.gFill; g.fill(); g.stroke();
      });

      if (!isBroken) {
        items.forEach(it => {
          if (it.pause > 0) {
            it.pause -= dt;
            if (!it.hitDone && now - (it.hit ?? 0) > 350) { it.hitDone = true; it.sq = now; it.stage = Math.min(5, it.stage + 1); }
          } else {
            it.x += SPEED * dt;
            const k = xs.findIndex((sx, i) => i > it.at && it.x >= sx);
            if (k > -1) { it.at = k; it.x = xs[k]; it.pause = PAUSE; stamp[k] = 1; it.hit = now; it.hitDone = false; }
            if (it.x > beltEnd - 12) it.done = true;
          }
          const q = it.sq ? (now - it.sq) / 1000 : 9, w = q < 1.2 ? Math.exp(-7 * q) * Math.cos(20 * q) : 0;
          piece(it.x, beltY, it.stage, Math.max(0, Math.min(1, it.x / 50, (beltEnd - 12 - it.x) / 60)), 0, 1 + 0.22 * w, 1 - 0.3 * w);
        });
        items = items.filter(it => !it.done);
      }
      falling.forEach(p => { p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; piece(p.x, p.y, p.stage, Math.max(0, 1 - (p.y - beltY) / 120), p.rot); });
      falling = falling.filter(p => p.y < PH + 60);

      if (mode === 'detour') {
        g.save(); g.setLineDash([6, 6]); g.lineDashOffset = -now * 0.02; g.strokeStyle = T.alarmSoft; g.lineWidth = 2; g.beginPath();
        for (let q = 0; q <= 1.001; q += 0.02) { const [x, y] = arcPt(q); if (q) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke(); g.restore();
        PROCESS_STEPS.forEach((step, i) => {
          const q = 0.1 + i * 0.2, [x, y] = arcPt(q), near = detour.some(d => Math.abs(d.t - q) < 0.05);
          g.fillStyle = T.gFill; g.strokeStyle = near ? T.alarm : T.alarmSoft; g.lineWidth = 1.4;
          g.beginPath(); g.arc(x, y, near ? 6 : 4.5, 0, 7); g.fill(); g.stroke();
          g.font = '600 11px Inter, sans-serif'; g.textAlign = 'center'; g.fillStyle = near ? T.alarm : T.label;
          g.fillText(step.planBStop, x, y - 12);
        });
        detour.forEach(d => {
          d.t += dt * DETOUR_SPEED;
          const k = Math.min(4, Math.floor((d.t - 0.1) / 0.2 + 1));
          d.stage = d.t < 0.1 ? 0 : [1, 2, 3, 4, 5][Math.max(0, k - 1)] ?? 5;
          const [x, y] = arcPt(Math.min(1, d.t));
          piece(x, y + 6, d.stage, Math.max(0, Math.min(1, d.t / 0.06, (1 - d.t) / 0.08)));
        });
        detour = detour.filter(d => d.t < 1);
      }
      wheel(now, isBroken, jam);
      light(hover);
    }

    const onMove = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.in = true; };
    const onLeave = () => { mouse.in = false; };
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerleave', onLeave);
    cv.addEventListener('click', feed);
    const enters = cards.map((k, i) => { const fn = () => { mouse.in = true; mouse.x = xs[i]; }; k.addEventListener('pointerenter', fn); k.addEventListener('pointerleave', onLeave); return fn; });
    const ro = new ResizeObserver(size);
    ro.observe(panel);
    document.fonts?.ready.then(size);
    size();
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      cv.removeEventListener('pointermove', onMove); cv.removeEventListener('pointerleave', onLeave); cv.removeEventListener('click', feed);
      cards.forEach((k, i) => { k.removeEventListener('pointerenter', enters[i]); k.removeEventListener('pointerleave', onLeave); });
      api.current = null;
    };
  }, []);

  // Phones: track which card is mid-screen, for the pinned mini line and the card highlight.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)');   // same breakpoint as the stylesheet's compact layout
    let raf = 0;
    const read = () => {
      raf = 0;
      if (!mq.matches) return;
      const mid = window.innerHeight * 0.55;
      let on = -1;
      cardRefs.current.forEach((k, i) => { if (k && k.getBoundingClientRect().top < mid) on = i; });
      setCur(on);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    mq.addEventListener('change', read);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); mq.removeEventListener('change', read); };
  }, []);

  function onIce() {
    if (broken) { api.current?.restore(); setBroken(false); return; }
    setSmash(true);   // the hammer swings first…
    window.setTimeout(() => {   // …then the glass and the line go
      setSmash(false); setBroken(true); setShake(true);
      api.current?.breakIt();
      window.setTimeout(() => setShake(false), 500);
    }, 300);
  }

  return (
    <section ref={secRef} id="process" data-own-reveal className={cx(s.process, seen && s.seen, broken && s.broken, shake && s.shake, smash && s.smash)} aria-labelledby="process-title">
      <div className={s.in}>
        <div className={s.head}>
          <h2 id="process-title" className="tight">My process<i>.</i></h2>
          <p aria-live="polite">
            {broken
              ? 'Real projects don’t always get the whole line. Deadlines move, teams shrink, pilots get cut. Here’s how I keep the quality when the process breaks.'
              : <>Five steps, every project, whether it’s a security product or my own side builds. <span className={s.desk}>The line below runs on real work. Click it to send another idea through, or hover a step.</span></>}
          </p>
        </div>
        <div ref={panelRef} className={s.panel}>
          <button type="button" className={s.ice} onClick={onIce} aria-pressed={broken}>
            <small>{broken ? 'Plan B is running' : 'In case of emergency'}</small>
            <b>
              {broken ? (
                <svg className={s.tool} viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
              ) : (
                <svg className={`${s.tool} ${s.hammer}`} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9" /><path d="m18 15 4-4" /><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" /></svg>
              )}
              {broken ? 'Restore process' : 'Break process'}
            </b>
            <svg className={s.crack} viewBox="0 0 176 58" preserveAspectRatio="none" aria-hidden="true"><path d="M120 8 L112 22 L126 30 L118 46 L124 58 M112 22 L96 18 L84 26 M126 30 L146 34 L160 28 M118 46 L104 50" /></svg>
          </button>
          <ProcessMini active={cur} broken={broken} titles={PROCESS_STEPS.map(st => st.title)} />
          <div className={s.rig}><canvas ref={cvRef} aria-hidden="true" /></div>
          <div className={s.cards}>
            {PROCESS_STEPS.map((step, i) => (
              <article key={step.title} ref={el => { cardRefs.current[i] = el; }} className={cx(s.card, cur === i && s.cur)} style={{ '--i': i } as CSSProperties}>
                <div className={s.k}>{String(i + 1).padStart(2, '0')}{broken && <em>Plan B</em>}</div>
                <h3>{step.title}</h3>
                {broken ? (
                  <div className={s.planb}><strong>{step.planBQ}</strong><p>{step.planBA}</p></div>
                ) : (
                  <p className={s.line}>{step.line}</p>
                )}
              </article>
            ))}
            <article ref={powerRef} className={cx(s.card, s.power)} style={{ '--i': 5 } as CSSProperties}>
              <div className={s.k}>{PROCESS_POWER.label}</div>
              <h3>{PROCESS_POWER.title}</h3>
              {broken ? (
                <div className={s.planb}><strong>{PROCESS_POWER.planBQ}</strong><p>{PROCESS_POWER.planBA}</p></div>
              ) : (
                <p className={s.line}>{PROCESS_POWER.line}</p>
              )}
            </article>
          </div>
        </div>
        <div className={s.results} aria-label="Results">
          {STATS.map((st, i) => <ResultCard key={st.label} stat={st} i={i} seen={seen} />)}
        </div>
      </div>
    </section>
  );
}
