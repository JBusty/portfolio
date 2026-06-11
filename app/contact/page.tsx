'use client';

import { useEffect, useState } from 'react';
import SectionHead from '@/components/SectionHead';

const CONTACT_FAQ = [
  {
    q: 'What type of culture do you look for?',
    a: 'I thrive in high-accountability, high-ownership cultures. Bonus points if I get to wear a lot of hats.',
  },
  {
    q: 'What kind of scope excites you most?',
    a: 'Messy, meaningful problems with lots of moving parts, especially when the work spans strategy, systems, and execution.',
  },
  {
    q: 'How do you like to collaborate?',
    a: 'I do my best work in close partnership with product and engineering, with fast feedback loops and a shared willingness to get into the details.',
  },
  {
    q: "What's your availability?",
    a: 'Available Q3 2026. US East Coast timezone (Eastern Time). I overlap well with EU mornings and West Coast afternoons.',
  },
  {
    q: 'Can you sign an NDA before a conversation?',
    a: 'Of course. Most of my best work is behind one. Send it over.',
  },
];

export default function ContactPage() {
  return (
    <main className="page-enter">
      <section style={{ borderBottom: '1px solid var(--ink)', background: 'var(--hero-contact)' }}>
        <div className="container r-hero-split sp-ctct-hero" style={{ padding: '80px 32px', gap: 56 }}>
          <div>
            <h1
              className="tight"
              style={{
                margin: 0,
                fontSize: 'clamp(52px, 11vw, 98px)',
                lineHeight: 0.88,
                letterSpacing: '-0.055em',
                fontWeight: 700,
              }}
            >
              Let&apos;s talk<span className="accent">.</span>
            </h1>
            <div style={{ marginTop: 48, maxWidth: '82ch' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 'clamp(18px, 1.5vw, 22px)',
                  lineHeight: 1.45,
                  color: 'var(--ink-2)',
                  maxWidth: '52ch',
                }}
              >
                I enjoy working on products that are genuinely hard to design well, the kind with complex workflows, technical users, and a lot of moving pieces. If you&apos;re building something in that space, I&apos;d be happy to connect.
              </p>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href="mailto:jbusseywork@gmail.com" className="btn">
                  jbusseywork@gmail.com <span className="arr">↗</span>
                </a>
                <a href="https://drive.google.com/file/d/17OJanguMKHAdKGfoBDpI_eS_1_a5fZEh/view" className="btn ghost">
                  Resume / CV <span className="arr">↗</span>
                </a>
              </div>
            </div>
          </div>
          <div style={{ width: '100%', maxWidth: 380, justifySelf: 'end' }}>
            <ContactHeroArt />
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--bone)', borderTop: '1px solid var(--ink)' }}>
        <div className="container sp-normal" style={{ padding: '112px 32px 128px' }}>
          <div className="r-grid-3" style={{ gap: 0 }}>
            {[
              { label: 'Focus', value: 'Product design', note: 'Complex software, workflows, and systems' },
              { label: 'Location', value: 'Remote', note: 'Farmington NH' },
              { label: 'Timezone', value: 'Eastern Time', note: 'Flexible on working with teammates in other timezones' },
            ].map((item, i) => (
              <div key={item.label} className="avail-card" style={{ padding: '4px 28px', borderLeft: i === 0 ? 'none' : '1px solid var(--rule-strong)' }}>
                <div className="mono upper" style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: '0.08em', marginBottom: 8 }}>
                  {item.label}
                </div>
                <div className="tight" style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {item.value}
                </div>
                <div style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>
                  {item.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ borderTop: '1px solid var(--ink)', background: 'var(--paper)' }}>
        <SectionHead title={<>Common<br />Questions<span className="accent">.</span></>} />
        <div className="container sp-bot-sm" style={{ padding: '0 32px 160px' }}>
          <ContactFAQ />
        </div>
      </section>
    </main>
  );
}

function ContactHeroArt() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);

    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <svg className="contact-hero-art" viewBox="52 52 336 336" aria-hidden="true">
        <g className={reduceMotion ? undefined : 'contact-draw-fade contact-draw-1'}>
          <rect
            x="118"
            y="108"
            width="204"
            height="224"
            rx="18"
            pathLength="100"
            fill="#F5F1E6"
            stroke="#111110"
            strokeWidth="1.5"
            className={reduceMotion ? undefined : 'contact-draw-stroke contact-draw-1'}
          />
          <rect x="144" y="138" width="48" height="18" rx="9" fill="#111110" className={reduceMotion ? undefined : 'contact-draw-fade contact-draw-2'} />
          <text x="168" y="151" textAnchor="middle" fill="#ECE7DC" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 8, letterSpacing: 1.4 }}>
            INBOX
          </text>
          <text x="144" y="192" fill="#111110" style={{ fontFamily: 'var(--font-instrument-serif), serif', fontSize: 34, fontStyle: 'italic' }}>
            say hi
          </text>
          <line x1="144" y1="214" x2="282" y2="214" pathLength="100" stroke="rgba(17,17,16,0.28)" strokeWidth="1.5" className={reduceMotion ? undefined : 'contact-draw-stroke contact-draw-2'} />
          <line x1="144" y1="240" x2="292" y2="240" pathLength="100" stroke="rgba(17,17,16,0.18)" strokeWidth="1.5" className={reduceMotion ? undefined : 'contact-draw-stroke contact-draw-3'} />
          <line x1="144" y1="262" x2="274" y2="262" pathLength="100" stroke="rgba(17,17,16,0.18)" strokeWidth="1.5" className={reduceMotion ? undefined : 'contact-draw-stroke contact-draw-4'} />
          <line x1="144" y1="284" x2="246" y2="284" pathLength="100" stroke="rgba(17,17,16,0.18)" strokeWidth="1.5" className={reduceMotion ? undefined : 'contact-draw-stroke contact-draw-5'} />
          <g transform="translate(265 290) rotate(-8)" className={reduceMotion ? undefined : 'contact-draw-fade contact-draw-5'}>
            <rect width="36" height="36" rx="18" fill="rgba(225,59,20,0.12)" stroke="#E13B14" strokeWidth="1.5" />
            <text x="18" y="21" textAnchor="middle" fill="#B12C0C" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1.2 }}>
              OK
            </text>
          </g>
          <g transform="translate(302 124)">
            <g className={reduceMotion ? undefined : 'contact-draw-fade contact-draw-4'}>
              <circle cx="0" cy="0" r="18" fill="#E13B14" />
              <text x="0" y="4" textAnchor="middle" fill="#ECE7DC" style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 8, fontWeight: 700, letterSpacing: 1.3 }}>
                SEND
              </text>
            </g>
          </g>
        </g>

        <circle
          cx="220"
          cy="220"
          r="154"
          pathLength="100"
          fill="none"
          stroke="rgba(17,17,16,0.18)"
          strokeWidth="1.5"
          strokeDasharray="8 10"
          className={reduceMotion ? undefined : 'contact-draw-stroke contact-draw-2'}
        />
        <circle
          cx="220"
          cy="220"
          r="116"
          pathLength="100"
          fill="none"
          stroke="rgba(17,17,16,0.10)"
          strokeWidth="1.5"
          strokeDasharray="4 10"
          className={reduceMotion ? undefined : 'contact-draw-stroke contact-draw-3'}
        />

        <g className={reduceMotion ? undefined : 'contact-draw-fade contact-draw-4'}>
          <g transform="translate(220 66)">
            <g transform="rotate(16)">
              <path d="M 0 -14 L 34 0 L 0 14 L 8 3 L -24 0 L 8 -3 Z" fill="#111110" />
              <path d="M 7 0 L 22 0" stroke="#ECE7DC" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </g>
        </g>

        <g className={reduceMotion ? undefined : 'contact-draw-fade contact-draw-5'}>
          <circle cx="220" cy="104" r="8" fill="#E13B14" />
          <circle cx="220" cy="104" r="18" fill="none" stroke="rgba(225,59,20,0.3)" strokeWidth="1.5" />
        </g>

        <g transform="translate(94 316)" className={reduceMotion ? undefined : 'contact-draw-fade contact-draw-5'}>
          <path
            d="M 0 16 C 34 6 60 6 96 16"
            pathLength="100"
            fill="none"
            stroke="rgba(17,17,16,0.18)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={reduceMotion ? undefined : 'contact-draw-stroke contact-draw-5'}
          />
          <circle cx="12" cy="16" r="4" fill="#111110" />
          <circle cx="84" cy="16" r="4" fill="#111110" />
        </g>
      </svg>
    </div>
  );
}

function ContactFAQ() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <div style={{ borderTop: '1px solid var(--ink)' }}>
      {CONTACT_FAQ.map((it, i) => {
        const isOpen = i === openIdx;
        return (
          <div key={it.q} style={{ borderBottom: '1px solid var(--rule)' }}>
            <button
              onClick={() => setOpenIdx(isOpen ? -1 : i)}
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '60px 1fr 40px',
                gap: 24,
                alignItems: 'center',
                padding: '28px 0',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
              }}
            >
              <span className="mono" style={{ fontSize: 12, color: 'var(--sub)' }}>
                Q.0{i + 1}
              </span>
              <span className="tight" style={{ fontSize: 'clamp(22px, 2.4vw, 32px)', fontWeight: 600, letterSpacing: '-0.025em', color: isOpen ? 'var(--accent)' : 'var(--ink)' }}>
                {it.q}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 22,
                  textAlign: 'right',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
                  transition: 'transform 220ms',
                  color: isOpen ? 'var(--accent)' : 'var(--ink)',
                  display: 'inline-block',
                }}
              >
                +
              </span>
            </button>
            <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 360ms cubic-bezier(.2,.7,.2,1)' }}>
              <div style={{ overflow: 'hidden' }}>
                <div
                  className="faq-answer"
                  style={{
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                    transition: 'opacity 280ms ease, transform 360ms cubic-bezier(.2,.7,.2,1)',
                    transitionDelay: isOpen ? '120ms' : '0ms',
                  }}
                >
                  {it.a}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
