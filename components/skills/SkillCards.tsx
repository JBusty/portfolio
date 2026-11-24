'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PROJECTS } from '@/lib/data';
import { SKILL_GROUPS, type SkillGroup } from '@/lib/skills';
import s from './skills.module.css';

/*
 * One card per skill group: the skills on the left, the results that back them
 * on the right. Pointing at (or focusing, or tapping) a skill keeps its results
 * lit and fades the rest, so each skill visibly has proof behind it.
 */

const byslug = new Map(PROJECTS.map(p => [p.slug, p]));
// Case-study titles are sentences; the thumbnail link needs a short name.
const SHORT: Record<string, string> = {
  'identity-profiles': 'Identity Profiles',
  'status-checks': 'Status checks',
  'unified-onboarding': 'Unified onboarding',
};
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

function Check() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Card({ g, n }: { g: SkillGroup; n: number }) {
  const [focus, setFocus] = useState(-1);     // skill being pointed at
  const [pinned, setPinned] = useState(-1);   // skill tapped/clicked, so touch screens get it too
  const on = focus >= 0 ? focus : pinned;

  return (
    <article id={g.id} className={cx(s.card, on >= 0 && s.focus)} aria-labelledby={`${g.id}-h`}>
      <div className={s.cardL}>
        <div className={s.num}>{String(n + 1).padStart(2, '0')} / {String(SKILL_GROUPS.length).padStart(2, '0')}</div>
        <h3 id={`${g.id}-h`}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={g.icon} /></svg>
          {g.name}
        </h3>
        <ul className={s.skills} onMouseLeave={() => setFocus(-1)}>
          {g.skills.map((name, i) => {
            const count = g.proofs.filter(p => p.skills.includes(i)).length;
            return (
              <li key={name}>
                <button
                  type="button"
                  className={cx(s.skill, on === i && s.hot)}
                  aria-pressed={pinned === i}
                  onMouseEnter={() => setFocus(i)}
                  onFocus={() => setFocus(i)}
                  onBlur={() => setFocus(-1)}
                  onClick={() => setPinned(p => (p === i ? -1 : i))}
                >
                  {name}
                  <small aria-label={`${count} ${count === 1 ? 'result' : 'results'}`}>{count}×</small>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className={s.cardR}>
        {g.proofs.map(p => {
          const cs = p.slug ? byslug.get(p.slug) : undefined;
          return (
            <div key={p.text} className={cx(s.proof, on >= 0 && p.skills.includes(on) && s.lit)}>
              {p.metric ? <div className={s.m}>{p.metric}</div> : <div className={cx(s.m, s.q)}><Check /></div>}
              <div>
                <p>{p.text}</p>
                <span className={s.src}>{p.source}</span>
              </div>
              {cs ? (
                <Link href={`/work/${cs.slug}`} className={s.cs}>
                  <Image src={cs.thumb} alt="" width={264} height={165} sizes="132px" style={{ objectPosition: cs.thumbPosition ?? 'left top' }} />
                  <span>{SHORT[cs.slug] ?? cs.title} →</span>
                </Link>
              ) : (
                <span className={cx(s.cs, s.none)}>No case study yet</span>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default function SkillCards() {
  return (
    <div className={s.cards}>
      {SKILL_GROUPS.map((g, n) => <Card key={g.id} g={g} n={n} />)}
    </div>
  );
}
