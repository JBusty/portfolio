'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Mark from '@/components/Mark';
import { CREW } from '@/lib/data';
import { RESUME_URL } from '@/lib/home';

/*
 * "Meet Josh", opened from the avatar in the nav. The avatar flies out and opens
 * into a taped polaroid; the dogs' polaroids get dealt in beside it, and a card
 * says who he is. Click a photo behind to bring it forward; click the front one
 * and it says hi. Closing sends the photo back into the avatar.
 */

const SLOTS = [
  { x: 0, y: -8, r: -2, w: 268, z: 3 },
  { x: -142, y: 28, r: -10, w: 206, z: 2 },
  { x: 146, y: 44, r: 9, w: 206, z: 1 },
];
const tf = (s: { x: number; y: number; r: number }) => `translate(-50%, -50%) translate(${s.x}px, ${s.y}px) rotate(${s.r}deg)`;

const [JOSH, SQUASH, NOODLES] = CREW;
const PHOTOS = [
  { who: 'squash', img: SQUASH.img, alt: 'Squash, a curly doodle, nose-first into the camera', caption: `${SQUASH.name} · ${SQUASH.role}`, boop: 'boop.', pos: 'center' },
  { who: 'noodles', img: NOODLES.img, alt: 'Noodles, a cream doodle in a birthday bandana', caption: `${NOODLES.name} · ${NOODLES.role}`, boop: 'woof.', pos: 'center 30%' },
  { who: 'josh', img: JOSH.img, alt: 'Josh on a winter hike, smiling', caption: 'That’s me', boop: 'hi!', pos: '40% 20%' },
];
const ME = 2;

export default function MeetJosh({ open, onClose, avatarRef }: { open: boolean; onClose: () => void; avatarRef: RefObject<HTMLImageElement | null> }) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [order, setOrder] = useState([ME, 0, 1]);
  const [boop, setBoop] = useState(-1);
  const polRefs = useRef<(HTMLElement | null)[]>([]);
  const photosRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The transform + circular clip that puts the polaroid's photo exactly over the little avatar.
  const fromAvatar = useCallback((slotW: number) => {
    const a = avatarRef.current?.getBoundingClientRect(), box = photosRef.current?.getBoundingClientRect(), me = polRefs.current[ME];
    if (!a || !box || !me) return null;
    const imgW = slotW - 24, polH = me.offsetHeight, imgCy = 12 + (imgW * 1.25) / 2, s = a.width / imgW;
    const tx = a.left + a.width / 2 - (box.left + box.width / 2);
    const ty = a.top + a.height / 2 - (box.top + box.height / 2) - (imgCy - polH / 2) * s;
    return { t: `translate(-50%, -50%) translate(${tx}px, ${ty}px) rotate(-25deg) scale(${s})`, clip: `circle(${imgW / 2}px at 50% ${imgCy}px)` };
  }, [avatarRef]);

  // open: mount first, then animate once the photos exist
  useEffect(() => {
    if (!open) return;
    setOrder([ME, 0, 1]); setMounted(true);
    document.documentElement.style.overflow = 'hidden';
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => {
      setShown(true);
      closeRef.current?.focus({ preventScroll: true });
      if (reduce()) return;
      const f = fromAvatar(SLOTS[0].w), me = polRefs.current[ME];
      if (f && me && avatarRef.current) {
        avatarRef.current.style.opacity = '0';
        me.animate(
          [{ transform: f.t, clipPath: f.clip }, { clipPath: 'circle(150% at 50% 50%)', offset: 0.55 }, { transform: tf(SLOTS[0]), clipPath: 'circle(150% at 50% 50%)' }],
          { duration: 760, easing: 'cubic-bezier(.3,1.2,.5,1)' },
        ).finished.then(() => { if (avatarRef.current) avatarRef.current.style.opacity = ''; }).catch(() => {});
      }
      [1, 2].forEach((si, k) => {
        const s = SLOTS[si], p = polRefs.current[[ME, 0, 1][si]];
        p?.animate([{ transform: `translate(-50%, -50%) translate(${s.x * 2.2}px, ${s.y + 620}px) rotate(${s.r * 4}deg)` }, { transform: tf(s) }],
          { duration: 700, delay: 330 + k * 130, easing: 'cubic-bezier(.3,1.25,.5,1)', fill: 'backwards' });
      });
    });
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  const finish = useCallback(() => {
    setShown(false); setMounted(false); closing.current = false;
    document.documentElement.style.overflow = '';
    if (avatarRef.current) avatarRef.current.style.opacity = '';
    onClose();
  }, [avatarRef, onClose]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (reduce()) return finish();
    setShown(false);
    cardRef.current?.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(30px)' }], { duration: 250, fill: 'forwards' });
    const me = polRefs.current[ME], f = fromAvatar(SLOTS[order.indexOf(ME)].w);
    if (me && f && avatarRef.current) {
      avatarRef.current.style.opacity = '0';
      me.animate([{ transform: getComputedStyle(me).transform, clipPath: 'circle(150% at 50% 50%)' }, { transform: f.t, clipPath: f.clip }], { duration: 520, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'forwards' });
    }
    polRefs.current.forEach((p, i) => {
      if (!p || i === ME) return;
      const dir = i === 0 ? -1 : 1;
      p.animate([{ transform: getComputedStyle(p).transform }, { transform: `translate(-50%, -50%) translate(${dir * 300}px, 640px) rotate(${dir * 40}deg)` }], { duration: 480, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    });
    window.setTimeout(finish, 540);
  }, [avatarRef, finish, fromAvatar, order]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && cardRef.current) {   // keep focus inside the dialog
        const f = [...(cardRef.current.parentElement?.querySelectorAll<HTMLElement>('button, a[href]') ?? [])];
        if (!f.length) return;
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mounted, close]);

  function front(i: number) {
    if (order[0] === i) { setBoop(-1); requestAnimationFrame(() => setBoop(i)); return; }
    setOrder(o => { const n = [...o]; n[n.indexOf(i)] = n[0]; n[0] = i; return n; });
  }
  useEffect(() => { if (boop < 0) return; const t = window.setTimeout(() => setBoop(-1), 1100); return () => clearTimeout(t); }, [boop]);

  if (!mounted) return null;
  const frontWho = PHOTOS[order[0]].who;

  return (
    <div className={`meet${shown ? ' open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="meet-title">
      <div className="meet-scrim" onClick={close} />
      {/* clicking anywhere that isn't a photo or the card closes it, same as the scrim */}
      <div className="meet-in" onClick={e => { if (e.target === e.currentTarget || e.target === photosRef.current) close(); }}>
        <div className="meet-photos" ref={photosRef}>
          {PHOTOS.map((ph, i) => {
            const s = SLOTS[order.indexOf(i)];
            return (
              <figure
                key={ph.who}
                ref={el => { polRefs.current[i] = el; }}
                className={`pol${i === ME ? '' : ' dog'}${boop === i ? ' boop-on' : ''}`}
                style={{ '--x': `${s.x}px`, '--y': `${s.y}px`, '--r': `${s.r}deg`, '--w': `${s.w}px`, zIndex: s.z } as CSSProperties}
                onClick={() => front(i)}
              >
                <span className="tape" />
                <Image src={ph.img} alt={ph.alt} width={520} height={650} sizes="268px" style={{ objectPosition: ph.pos }} />
                <figcaption>{ph.caption}</figcaption>
                <span className="boop" aria-hidden="true">{ph.boop}</span>
              </figure>
            );
          })}
          <span className="sticker s1">ex front-end dev</span>
          <span className="sticker s2">12+ years</span>
          <span className="sticker s3">systems nerd</span>
        </div>
        <div className="meet-card" ref={cardRef}>
          <button ref={closeRef} className="meet-x" type="button" onClick={close} aria-label="Close">&times;</button>
          <div className="eyebrow" style={{ '--d': 0 } as CSSProperties}>Hi, I&apos;m</div>
          <h2 id="meet-title" style={{ '--d': 1 } as CSSProperties}>Josh Bussey.</h2>
          <p style={{ '--d': 2 } as CSSProperties}>
            I&apos;m a product designer who started as a front-end developer. For 12+ years I&apos;ve worked on
            complicated enterprise software in security, finance and healthcare, making it simpler to use
            without dumbing it down.
          </p>
          <p style={{ '--d': 3 } as CSSProperties}>
            I&apos;m the person teammates come to when something&apos;s stuck. {JOSH.note}
          </p>
          <dl className="facts" style={{ '--d': 4 } as CSSProperties}>
            <dt>Started as</dt><dd>Front-end developer</dd>
            <dt>Superpower</dt><dd>Systems thinking</dd>
            <dt>Off the clock</dt><dd>Furniture, badly. Dogs, constantly.</dd>
          </dl>
          <div className="crew" style={{ '--d': 5 } as CSSProperties}>
            {[SQUASH, NOODLES].map((d, k) => (
              <button key={d.name} type="button" className={frontWho === PHOTOS[k].who ? 'lit' : undefined} onClick={() => front(k)}>
                <Image src={d.img} alt="" width={80} height={80} />
                <span><b>{d.name}</b><span>{d.note.replace(/^Goldendoodle\.\s*/, '')}</span></span>
              </button>
            ))}
          </div>
          <div className="acts" style={{ '--d': 6 } as CSSProperties}>
            <Link href="/contact" className="btn" onClick={close}>Say hi <Mark /></Link>
            <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className="btn ghost">Résumé <Mark dir="out" /></a>
          </div>
        </div>
      </div>
    </div>
  );
}
