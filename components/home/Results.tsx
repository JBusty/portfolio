'use client';

import { STATS } from '@/lib/data';
import ResultCard from './ResultCard';
import { useSeen } from './useSeen';
import s from './results.module.css';

/** The four career numbers that open "12 years, one winding road": the road at a glance, before the timeline. */
export default function Results() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.25);
  return (
    // not a direct .container of the section, so the generic section fade leaves it to its own entrance
    <div className={s.wrap}>
      <div ref={ref} className={`${s.results}${seen ? ` ${s.seen}` : ''}`} aria-label="At a glance">
        {STATS.map((st, i) => <ResultCard key={st.label} stat={st} i={i} seen={seen} />)}
      </div>
    </div>
  );
}
