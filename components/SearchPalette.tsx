'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PROJECTS } from '@/lib/data';
import { EMAIL, LINKEDIN_URL, RESUME_URL } from '@/lib/home';
import { SKILL_AKA, SKILL_GROUPS } from '@/lib/skills';

/* ⌘K / Ctrl+K: jump to a case study, a homepage section, or an action. */

type Row =
  | { kind: 'work'; title: string; sub: string; meta: string; img: string; href: string; terms: string }
  | { kind: 'section' | 'action'; title: string; sub?: string; href: string; icon: string; terms: string; external?: boolean };

const WORK: Row[] = PROJECTS.map(p => ({
  kind: 'work', title: p.title, sub: p.company, meta: p.metric, img: p.thumb, href: `/work/${p.slug}`,
  terms: [p.title, p.company, p.metric, p.blurb, ...p.tags].join(' '),
}));
const ARROW = 'M5 12h14M13 6l6 6-6 6';
const SECTIONS: Row[] = [
  { kind: 'section', title: 'My process', href: '/#process', icon: ARROW, terms: 'how i work steps plan b' },
  { kind: 'section', title: 'How I show up', href: '/#values', icon: ARROW, terms: 'values collaborator craft ai' },
  { kind: 'section', title: 'Experience', href: '/#journey', icon: ARROW, terms: 'journey timeline career years' },
  { kind: 'section', title: 'FAQ', href: '/#faq', icon: ARROW, terms: 'questions working with me' },
];
// Every skill, linked to its group on /skills. Only listed once there's a query, so they don't crowd the empty palette.
const SKILLS: Row[] = SKILL_GROUPS.flatMap(g => g.skills.map(skill => ({
  kind: 'section' as const, title: skill, sub: g.name, href: `/skills#${g.id}`, icon: ARROW,
  terms: `skill ${SKILL_AKA[skill] ?? ''} ${g.proofs.filter(p => p.skills.includes(g.skills.indexOf(skill))).map(p => p.text).join(' ')}`,
})));
const ACTIONS: Row[] = [
  { kind: 'action', title: 'Skills', sub: 'Skills, results and experience', href: '/skills', icon: ARROW, terms: 'skills experience resume abilities tools history' },
  { kind: 'action', title: 'Email Josh', sub: EMAIL, href: `mailto:${EMAIL}`, icon: 'M3 5h18v14H3zM3 7l9 6 9-6', terms: 'contact mail hire', external: true },
  { kind: 'action', title: 'Résumé', sub: 'Opens in a new tab', href: RESUME_URL, icon: 'M14 3H6v18h12V8zM14 3v5h5M12 11v6M9 14l3 3 3-3', terms: 'resume cv pdf', external: true },
  { kind: 'action', title: 'LinkedIn', sub: 'Opens in a new tab', href: LINKEDIN_URL, icon: 'M4 9v11M4 4v1M9 20v-6a3 3 0 0 1 6 0v6M9 9v11', terms: 'social profile', external: true },
  { kind: 'action', title: 'Contact page', href: '/contact', icon: ARROW, terms: 'hire availability' },
];

export default function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ(''); setSel(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, [open]);

  const groups = useMemo(() => {
    const t = q.trim().toLowerCase();
    const hit = (r: Row) => !t || `${r.title} ${r.sub ?? ''} ${r.terms}`.toLowerCase().includes(t);
    return ([['Case studies', WORK.filter(hit)], ['Skills', t ? SKILLS.filter(hit) : []], ['On the homepage', SECTIONS.filter(hit)], ['Actions', ACTIONS.filter(hit)]] as const).filter(([, rows]) => rows.length);
  }, [q]);
  const flat = groups.flatMap(([, rows]) => rows);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  function go(r: Row) {
    onClose();
    if (r.kind !== 'work' && r.external) {
      if (r.href.startsWith('mailto:')) window.location.href = r.href;
      else window.open(r.href, '_blank', 'noopener,noreferrer');
    } else router.push(r.href);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(i => (i + 1) % Math.max(1, flat.length)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(i => (i - 1 + flat.length) % Math.max(1, flat.length)); }
    else if (e.key === 'Enter' && flat[sel]) { e.preventDefault(); go(flat[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  }

  let idx = -1;
  return (
    <>
      <div className={`pal-scrim${open ? ' open' : ''}`} onClick={onClose} aria-hidden="true" />
      <div className={`pal${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Search" hidden={!open}>
        <div className="pal-in">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={e => { setQ(e.target.value); setSel(0); }}
            onKeyDown={onKey}
            placeholder="Search case studies, sections, actions…"
            aria-label="Search"
            aria-controls="pal-list"
            aria-activedescendant={flat[sel] ? `pal-${sel}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd>esc</kbd>
        </div>
        <div className="pal-list" id="pal-list" role="listbox" ref={listRef}>
          {!flat.length && <div className="pal-empty">Nothing matches &ldquo;{q}&rdquo;. Try &ldquo;AI&rdquo;, &ldquo;security&rdquo; or &ldquo;Edenred&rdquo;.</div>}
          {groups.map(([label, rows]) => (
            <div key={label} role="group" aria-label={label}>
              <h6>{label}</h6>
              {rows.map(r => {
                idx += 1;
                const i = idx;
                return (
                  <div
                    key={`${r.href}|${r.title}`}   // skills share their group's href, so the title keeps keys unique
                    id={`pal-${i}`}
                    role="option"
                    aria-selected={i === sel}
                    className={`pal-row${i === sel ? ' sel' : ''}`}
                    onPointerMove={() => setSel(i)}
                    onClick={() => go(r)}
                  >
                    {r.kind === 'work'
                      ? <Image src={r.img} alt="" width={96} height={60} />
                      : <span className="ic"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={r.icon} /></svg></span>}
                    <span className="pal-txt"><b>{r.title}</b>{r.sub && <> · {r.sub}</>}</span>
                    {r.kind === 'work' && <em>{r.meta}</em>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
