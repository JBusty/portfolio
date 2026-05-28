'use client';

import { useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SectionHead from '@/components/SectionHead';
import { PROJECTS } from '@/lib/data';

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const p = PROJECTS.find(x => x.slug === params.slug);
  if (!p) notFound();

  const idx = PROJECTS.indexOf(p);
  const next = PROJECTS[(idx + 1) % PROJECTS.length];
  const prev = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length];

  return (
    <main className="page-enter">
      {/* HERO */}
      <section style={{ borderBottom: '1px solid var(--ink)', background: 'var(--hero-case)' }}>
        <div className="container" style={{ padding: '48px 32px 24px' }}>
          {/* Breadcrumb */}
          <div className="mono upper" style={{
            display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between',
            fontSize: 11, color: 'var(--sub)', letterSpacing: '0.08em',
            paddingBottom: 24, borderBottom: '1px solid var(--rule)',
          }}>
            <span>
              <Link href="/" className="link-u" style={{ color: 'var(--sub)' }}>Index</Link>
              {' / '}
              <Link href="/work" className="link-u" style={{ color: 'var(--sub)' }}>Work</Link>
              {' / '}
              <span style={{ color: 'var(--ink)' }}>{p.title}</span>
            </span>
            <span>Case study {p.num} of {String(PROJECTS.length).padStart(2, '0')}</span>
          </div>

          {/* Title + meta */}
          <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56, alignItems: 'start' }}>
            <div>
              <div className="mono upper" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em' }}>
                ▍ {p.company} / {p.quarter}
              </div>
              <h1 className="tight" style={{
                margin: '20px 0 0',
                fontSize: 'clamp(40px, 7vw, 120px)',
                lineHeight: 0.92, letterSpacing: '-0.05em', fontWeight: 700,
              }}>
                {p.title}<span className="accent">.</span>
              </h1>
              <p style={{ margin: '32px 0 0', fontSize: 'clamp(17px, 1.5vw, 22px)', lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: '56ch' }}>
                {p.blurb}
              </p>
            </div>

            {/* Meta card */}
            <div style={{ border: '1px solid var(--ink)', padding: 24, background: 'var(--paper)', borderRadius: 'var(--radius-lg)' }}>
              <div className="mono upper" style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: '0.08em', paddingBottom: 12, marginBottom: 16, borderBottom: '1px solid var(--rule)' }}>
                Project metadata
              </div>
              <dl className="meta-col">
                <dt>Client</dt><dd>{p.company}</dd>
                <dt>Role</dt><dd>{p.role}</dd>
                <dt>Team</dt><dd>{p.team}</dd>
                <dt>Shipped</dt><dd>{p.quarter}</dd>
                <dt>Type</dt>
                <dd>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.tags.map(t => <span key={t} className="chip">{t}</span>)}
                  </div>
                </dd>
                <dt>Result</dt><dd style={{ color: 'var(--accent)', fontWeight: 500 }}>{p.metric}</dd>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* KEY OUTCOMES */}
      <section style={{ background: 'var(--ink)', color: 'var(--bone)' }}>
        <div className="container" style={{ padding: '32px 32px 56px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            {[
              {
                label: 'Pain', kicker: '01', title: 'What hurt',
                items: ['Profiles fragmented across 100+ integrations', 'Analyst churn during active investigations', 'Competitor parity gap on AI features'],
              },
              {
                label: 'Role', kicker: '02', title: 'What I owned',
                items: ['End-to-end research + design', 'Cross-functional alignment (PM, Eng, GTM)', 'Pilot rollout + customer validation loop'],
              },
              {
                label: 'Outcome', kicker: '03', title: 'What shipped',
                items: ['Unified profile w/ AI summary inline', '−15% time-to-decision in pilot cohorts', 'Pattern reused on two adjacent surfaces'],
              },
            ].map((col, i) => (
              <div key={col.label} style={{
                padding: '32px 24px',
                borderRight: i < 2 ? '1px solid rgba(236,231,220,0.18)' : 'none',
                paddingLeft: i === 0 ? 0 : 24,
                paddingRight: i === 2 ? 0 : 24,
              }}>
                <div className="mono upper" style={{ fontSize: 10, color: 'rgba(236,231,220,0.5)', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{col.kicker}</span><span>{col.label}</span>
                </div>
                <h3 className="tight" style={{ margin: '16px 0 0', fontSize: 'clamp(26px, 2.6vw, 36px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                  {col.title}
                </h3>
                <ul style={{ margin: '20px 0 0', padding: 0, listStyle: 'none' }}>
                  {col.items.map((it, j) => (
                    <li key={j} style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 8, padding: '10px 0', borderTop: '1px solid rgba(236,231,220,0.12)', fontSize: 14, lineHeight: 1.5, color: 'rgba(236,231,220,0.9)' }}>
                      <span style={{ color: 'var(--accent)' }}>↳</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUMMARY */}
      <CSection kicker="▍ The short version" title={<>The TL;DR<span className="accent">.</span></>}>
        <p style={cssCopy()}>
          I led the redesign of {p.company}&#x2019;s Identity Profiles, folding in
          actionable insights powered by an in-house Gen-AI model and a
          rebuilt information architecture. The update closed a competitive
          gap, sped up investigations, and gave us a pattern we&#x2019;re now
          reusing across the platform.
        </p>
      </CSection>

      {/* PROBLEM */}
      <CSection kicker="▍ The problem" title={<>Flat. Boring.<br />Behind the curve<span className="accent">.</span></>}>
        <p style={cssCopy()}>
          Our original Identity Profiles were flat — basically a long table
          of every log line for a user. Analysts found them unhelpful when
          they actually needed answers fast. We were also behind on
          AI-powered insights, and customers had started saying it out loud
          in renewal conversations.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 32 }}>
          <Quote quote="Honestly, I just CTRL-F this page." attribution="Senior analyst · Fortune 500 customer" />
          <Quote quote="We saw your competitor's demo. Where's yours?" attribution="CISO · large pilot customer" />
        </div>
      </CSection>

      {/* KEY DECISION */}
      <section className="focus-block" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ padding: '80px 32px', textAlign: 'center' }}>
          <div className="serif" style={{ fontStyle: 'italic', fontSize: 'clamp(28px, 3vw, 44px)', lineHeight: 1.2, maxWidth: '30ch', margin: '0 auto', color: 'var(--bone)', letterSpacing: '-0.01em' }}>
            &#x201C;How much Gen-AI content is too much?&#x201D;
          </div>
          <div style={{ margin: '32px auto 0', maxWidth: '60ch', fontSize: 17, lineHeight: 1.6, color: 'rgba(236,231,220,0.8)' }}>
            We had an in-house Gen-AI engine that could write a small novel
            about every user. We could leverage it to write paragraphs of
            context — but the people reading this surface are mid-incident
            and don&#x2019;t have time to read.
          </div>
          <div style={{
            marginTop: 48, display: 'inline-flex', alignItems: 'stretch',
            border: '1px solid var(--accent)', background: 'rgba(225,59,20,0.08)',
            borderRadius: 'var(--radius)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 28px', borderRight: '1px solid var(--accent)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
              Decision
            </div>
            <div style={{ padding: '20px 28px', textAlign: 'left' }}>
              <div className="tight" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Don&#x2019;t make people read.</div>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'rgba(236,231,220,0.7)', marginTop: 4, letterSpacing: '0.02em' }}>
                Use Gen-AI to create short, high-value summaries only.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <CSection kicker="▍ What I shipped" title={<>Less reading.<br />More answers<span className="accent">.</span></>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 8 }}>
          {[
            { n: '01', h: 'Insight-first IA', b: 'Reorganized the page around 3–5 actionable insights surfaced at the top — the long log table moved beneath.' },
            { n: '02', h: 'Embedded summaries', b: 'Gen-AI summaries appear inline, citing the underlying events. Always optional, never a wall of text.' },
            { n: '03', h: 'Clarity over completeness', b: 'We resisted the urge to show every signal. Hidden until requested, but one click away.' },
          ].map(c => (
            <div key={c.n} style={{ border: '1px solid var(--rule)', padding: 24, background: 'var(--paper)', borderRadius: 'var(--radius)' }}>
              <div className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>{c.n}</div>
              <div className="tight" style={{ fontSize: 22, fontWeight: 600, marginTop: 12, letterSpacing: '-0.025em' }}>{c.h}</div>
              <p style={{ margin: '12px 0 0', color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55 }}>{c.b}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 48, display: 'grid', gap: 24 }}>
          <Screenshot title="frodo.baggins@redcanary.com — before" caption="The original profile: useful, but a wall of log data." variant="before" />
          <Screenshot title="frodo.baggins@redcanary.com — after" caption="Insights surface first. Summary cites the events. Long table still available below." variant="after" annotation="AI summary cites underlying events" />
        </div>
      </CSection>

      {/* PROCESS */}
      <CSection kicker="▍ How I solved it" title={<>Five months,<br />six iterations<span className="accent">.</span></>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '1px solid var(--rule)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 32 }}>
          {[{ n: '5 mo', l: 'Design phase' }, { n: '6', l: 'Major iterations' }, { n: '1', l: 'Designer (me)' }].map((c, i) => (
            <div key={i} style={{ padding: '28px 28px', borderRight: i < 2 ? '1px solid var(--rule)' : 'none' }}>
              <div className="tight" style={{ fontSize: 'clamp(36px, 4vw, 64px)', fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1 }}>{c.n}</div>
              <div className="mono upper" style={{ marginTop: 12, fontSize: 11, color: 'var(--sub)', letterSpacing: '0.08em' }}>{c.l}</div>
            </div>
          ))}
        </div>
        <ProcessStep n="01" h="Competitive benchmarking" body={'Tore down every adjacent product I could get a login to. Mapped patterns to adopt vs. consciously avoid. Came out with a one-page "what we should and shouldn\'t copy" doc.'} />
        <ProcessStep n="02" h="Designing & prototyping" body={"Lo-fi prototypes to validate direction before pixel-pushing. Pulled stakeholders in early — the cheapest feedback you'll ever get is on a sketch."} />
        <ProcessStep n="03" h="Customer-driven validation" body="Ran the prototype past four pilot customers. Two pieces of feedback rewrote the IA. One of them rewrote a section of the spec entirely. All of it shipped before the public release." last />
      </CSection>

      {/* REFLECTION */}
      <CSection kicker="▍ Lessons" title={<>What worked.<br />What didn&#x2019;t<span className="accent">.</span></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid var(--rule)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ padding: 28, borderRight: '1px solid var(--rule)' }}>
            <div className="mono upper" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em' }}>✓ What went right</div>
            <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['The "wrap-up summary" became the model for two other surfaces in the product.', 'Phased rollout meant pilot customers found the rough edges before the wider release did.', 'Engineering had clear scope from day one. Estimates held.'].map((it, i) => (
                <li key={i} style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', paddingTop: i > 0 ? 12 : 0, borderTop: i > 0 ? '1px solid var(--rule)' : 'none' }}>{it}</li>
              ))}
            </ul>
          </div>
          <div style={{ padding: 28 }}>
            <div className="mono upper" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em' }}>✗ Tough spots</div>
            <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['I underestimated the moderation problem — Gen-AI hallucinations needed a longer review loop.', 'We added a "raw view" toggle late. It should have been there on day one.', 'I let one stakeholder review derail a sprint. Won\'t happen again.'].map((it, i) => (
                <li key={i} style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', paddingTop: i > 0 ? 12 : 0, borderTop: i > 0 ? '1px solid var(--rule)' : 'none' }}>{it}</li>
              ))}
            </ul>
          </div>
        </div>
      </CSection>

      {/* PREV / NEXT */}
      <section style={{ borderTop: '1px solid var(--ink)', background: 'var(--paper)' }}>
        <div className="container" style={{ padding: '56px 32px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <NavCard dir="prev" p={prev} />
            <NavCard dir="next" p={next} />
          </div>
        </div>
      </section>
    </main>
  );
}

// ---- Section wrapper ----
function CSection({ kicker, title, children }: { kicker: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <SectionHead kicker={kicker} title={title} />
      <div className="container" style={{ padding: '0 32px 80px' }}>{children}</div>
    </section>
  );
}

function cssCopy(): React.CSSProperties {
  return { margin: 0, fontSize: 'clamp(17px, 1.5vw, 21px)', lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: '62ch' };
}

function Quote({ quote, attribution }: { quote: string; attribution: string }) {
  return (
    <div style={{ border: '1px solid var(--rule)', padding: 28, background: 'var(--paper)', borderRadius: 'var(--radius)' }}>
      <div className="serif" style={{ fontStyle: 'italic', fontSize: 26, lineHeight: 1.3, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
        &#x201C;{quote}&#x201D;
      </div>
      <div className="mono upper" style={{ marginTop: 16, fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em' }}>
        — {attribution}
      </div>
    </div>
  );
}

function ProcessStep({ n, h, body, last }: { n: string; h: string; body: string; last?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 32, padding: '28px 0', borderTop: '1px solid var(--rule)', borderBottom: last ? '1px solid var(--rule)' : 'none' }}>
      <div className="mono" style={{ fontSize: 13, color: 'var(--accent)' }}>{n}</div>
      <div>
        <h4 className="tight" style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em' }}>{h}</h4>
        <p style={{ margin: '10px 0 0', color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.55, maxWidth: '62ch' }}>{body}</p>
      </div>
    </div>
  );
}

function Screenshot({ title, caption, variant, annotation }: { title: string; caption: string; variant: string; annotation?: string }) {
  return (
    <div style={{ border: '1px solid var(--ink)', background: 'var(--paper)', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
      <div className="frame-bar" style={{ background: 'var(--bone)' }}>
        <span className="dots"><i /><i /><i /></span>
        <span style={{ marginLeft: 8, fontWeight: 500 }}>{title}</span>
        <span style={{ marginLeft: 'auto' }}>redcanary.com / identity / {variant}</span>
      </div>
      <div style={{ position: 'relative', aspectRatio: '16/8', background: 'var(--bone-2)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 8px, rgba(17,17,16,0.05) 8px 9px)' }} />
        <FakeUI variant={variant} />
        {annotation && (
          <div style={{ position: 'absolute', top: 24, right: 24, background: 'var(--accent)', color: 'var(--bone)', padding: '8px 12px', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 6, maxWidth: 220 }}>
            {annotation}
          </div>
        )}
      </div>
      <div style={{ padding: '14px 18px', borderTop: '1px solid var(--rule)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--ink-2)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{caption}</span>
        <span style={{ color: 'var(--sub)' }}>fig. {variant}</span>
      </div>
    </div>
  );
}

function FakeUI({ variant }: { variant: string }) {
  const after = variant === 'after';
  return (
    <div style={{ position: 'absolute', inset: 24, display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16 }}>
      <div style={{ background: 'rgba(17,17,16,0.08)', border: '1px solid var(--rule)', padding: 8 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ height: 12, marginTop: i === 0 ? 0 : 6, background: 'rgba(17,17,16,0.08)', width: i === 2 ? '70%' : '100%' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 26, background: 'rgba(17,17,16,0.12)', border: '1px solid var(--rule)', width: '60%' }} />
        {after ? (
          <>
            <div style={{ padding: 10, background: 'rgba(225,59,20,0.1)', border: '1px solid var(--accent)' }}>
              <div style={{ height: 10, background: 'rgba(225,59,20,0.4)', width: '30%' }} />
              <div style={{ height: 8, background: 'rgba(17,17,16,0.18)', marginTop: 8, width: '92%' }} />
              <div style={{ height: 8, background: 'rgba(17,17,16,0.18)', marginTop: 4, width: '78%' }} />
              <div style={{ height: 8, background: 'rgba(17,17,16,0.18)', marginTop: 4, width: '85%' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ padding: 8, background: 'rgba(17,17,16,0.05)', border: '1px solid var(--rule)' }}>
                  <div style={{ height: 8, background: 'rgba(17,17,16,0.22)', width: '50%' }} />
                  <div style={{ height: 20, background: 'rgba(17,17,16,0.14)', marginTop: 8 }} />
                </div>
              ))}
            </div>
          </>
        ) : (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <div style={{ height: 16, flex: 1, background: 'rgba(17,17,16,0.08)' }} />
              <div style={{ height: 16, flex: 1, background: 'rgba(17,17,16,0.08)' }} />
              <div style={{ height: 16, flex: 2, background: 'rgba(17,17,16,0.08)' }} />
            </div>
          ))
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 28, background: 'rgba(17,17,16,0.08)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NavCard({ dir, p }: { dir: 'prev' | 'next'; p: typeof PROJECTS[number] }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={`/work/${p.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: '1px solid var(--ink)',
        background: hover ? 'var(--ink)' : 'var(--bone)',
        color: hover ? 'var(--bone)' : 'var(--ink)',
        padding: 28, display: 'flex', flexDirection: 'column', gap: 12,
        textAlign: dir === 'prev' ? 'left' : 'right',
        borderRadius: 'var(--radius-lg)',
        transition: 'background 160ms, color 160ms',
      }}
    >
      <div className="mono upper" style={{ fontSize: 11, color: hover ? 'var(--accent)' : 'var(--sub)', letterSpacing: '0.1em' }}>
        {dir === 'prev' ? '← Previous' : 'Next →'}
      </div>
      <div className="mono upper" style={{ fontSize: 11, letterSpacing: '0.08em', color: hover ? 'rgba(236,231,220,0.65)' : 'var(--sub)' }}>
        {p.company} · {p.year}
      </div>
      <div className="tight" style={{ fontSize: 'clamp(28px, 3.4vw, 44px)', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.02 }}>
        {p.title}
      </div>
    </Link>
  );
}
