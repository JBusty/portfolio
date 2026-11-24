import type { Metadata } from 'next';
import Link from 'next/link';
import Mark from '@/components/Mark';
import SkillCards from '@/components/skills/SkillCards';
import SkillsHeroArt from '@/components/skills/SkillsHeroArt';
import { RESUME_URL } from '@/lib/home';
import { SITE_URL } from '@/lib/site';
import { EDUCATION, ROLES, SIDE_PROJECTS, SKILLS_SUMMARY } from '@/lib/skills';
import s from '@/components/skills/skills.module.css';

const description =
  'Product, platform, AI-augmented design and engineering skills, each backed by shipped results, plus 12+ years of experience across cybersecurity, fintech and healthcare.';

export const metadata: Metadata = {
  title: 'Skills',
  description,
  alternates: { canonical: `${SITE_URL}/skills` },
  openGraph: { title: 'Skills — Joshua Bussey', description, url: `${SITE_URL}/skills` },
  twitter: { title: 'Skills — Joshua Bussey', description },
};

// Bold the figures in a highlight (~15%, 9 months, 100+, under a year) so they stand out on a skim. Words unchanged.
const FIGURE = /(~?\d+%|\d+\+|\d+ months|under a year)/g;
function Emph({ text }: { text: string }) {
  return <>{text.split(FIGURE).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}</>;
}

export default function SkillsPage() {
  return (
    <main id="main-content" tabIndex={-1} className="page-enter">
      <section className={`hero-wash ${s.hero}`}>
        <div className="container r-hero-split sp-ctct-hero" style={{ gap: 40 }}>
          <div>
            <h1 className="tight">Skills<span className="accent">.</span></h1>
            <p className={s.lede}>{SKILLS_SUMMARY}</p>
            <div className={s.facts}>
              <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className="btn">Download résumé <Mark dir="out" /></a>
            </div>
          </div>
          <div className={s.art}>
            <SkillsHeroArt />
          </div>
        </div>
      </section>

      <section className={s.bring} aria-labelledby="bring-h">
        <div className="container">
          <div className={s.secHead}>
            <h2 id="bring-h" className="tight">What I bring<span className="accent">.</span></h2>
          </div>
          <SkillCards />
        </div>
      </section>

      <section id="experience" className={s.exp} aria-labelledby="exp-h">
        <div className="container">
          <h2 id="exp-h" className="tight">Experience<span className="accent">.</span></h2>
          <ol className={s.roles}>
            {ROLES.map(r => (
              <li key={`${r.company}-${r.dates}`} className={r.current ? s.now : undefined}>
                <div className={s.when}>
                  <b>{r.dates}</b>
                  {r.where}
                  {r.note && <><br />{r.note}</>}
                </div>
                <div>
                  <h3>{r.title} <span>@ {r.company}</span></h3>
                  {r.intro && <p className={s.intro}>{r.intro}</p>}
                  {r.highlights.length > 0 && (
                    <details open={r.current} className={s.more}>
                      <summary>
                        <span className={s.show}>Show {r.highlights.length} highlights</span>
                        <span className={s.hide}>Hide highlights</span>
                      </summary>
                      <ul className={s.hl}>{r.highlights.map(h => <li key={h}><Emph text={h} /></li>)}</ul>
                    </details>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <h2 className={`tight ${s.h2sm}`}>Side projects<span className="accent">.</span></h2>
          <div className={s.side}>
            {SIDE_PROJECTS.map(p => (
              <Link key={p.name} href={`/work/${p.slug}`} className={s.sideCard}>
                <div className={s.when}>{p.when}</div>
                <h3>{p.name}</h3>
                <div className={s.meta}>{p.meta}</div>
                <p>{p.text}</p>
                <ul className={`${s.hl} ${s.hlCompact}`}>{p.highlights.map(h => <li key={h}><Emph text={h} /></li>)}</ul>
                <span className={s.read}>Read the case study <Mark /></span>
              </Link>
            ))}
          </div>
          <p className={s.edu}><b>Education</b> · {EDUCATION}</p>
        </div>
      </section>
    </main>
  );
}
