'use client';

import Link from 'next/link';
import { useState } from 'react';

function BackToTop() {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        background: 'transparent',
        border: `1px solid ${hover ? 'rgba(236,231,220,0.5)' : 'rgba(236,231,220,0.2)'}`,
        borderRadius: 999,
        color: hover ? 'rgba(236,231,220,0.9)' : 'rgba(236,231,220,0.55)',
        fontFamily: 'var(--font-jetbrains-mono)',
        fontSize: 11,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding: '7px 14px',
        cursor: 'pointer',
        transition: 'color 160ms, border-color 160ms',
      }}
    >
      <span style={{
        display: 'inline-block',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 200ms cubic-bezier(.2,.7,.2,1)',
      }}>↑</span>
      Back to top
    </button>
  );
}

const siteLinks = [
  { href: '/', label: 'Homepage' },
  { href: '/work', label: 'Selected work' },
  { href: '/work/identity-profiles', label: 'Case study — Identity profiles' },
  { href: '/contact', label: "Let's talk" },
];

const elsewhereLinks = [
  { label: 'LinkedIn ↗', href: 'https://www.linkedin.com/in/joshuabussey/' },
  { label: 'Github ↗', href: 'https://github.com/JBusty' },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--ink)', background: 'var(--ink)', color: 'var(--bone)' }}>
      <div className="container" style={{ padding: '160px 32px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 40 }}>
          {/* CTA */}
          <div>
            <h2 className="tight" style={{
              fontSize: 'clamp(40px, 6vw, 96px)',
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              fontWeight: 700,
              margin: 0,
              maxWidth: '12ch',
            }}>
              Let's build something{' '}
              <span style={{ color: 'var(--accent)' }}>worth shipping.</span>
            </h2>
            <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="mailto:jbusseywork@gmail.com" className="btn" style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}>
                jbusseywork@gmail.com <span className="arr">↗</span>
              </a>
              <a href="https://drive.google.com/file/d/17OJanguMKHAdKGfoBDpI_eS_1_a5fZEh/view" className="btn ghost" style={{ color: 'var(--bone)', borderColor: 'rgba(236,231,220,0.4)' }}>
                Resume / CV <span className="arr">↗</span>
              </a>
            </div>
          </div>

          {/* Index */}
          <div>
            <div className="mono upper" style={{
              fontSize: 11,
              color: 'rgba(236,231,220,0.5)',
              letterSpacing: '0.08em',
              marginBottom: 16,
            }}>
              Index
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {siteLinks.map(it => (
                <li key={it.href}>
                  <Link href={it.href} className="link-u" style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13 }}>
                    → {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Elsewhere */}
          <div>
            <div className="mono upper" style={{
              fontSize: 11,
              color: 'rgba(236,231,220,0.5)',
              letterSpacing: '0.08em',
              marginBottom: 16,
            }}>
              Elsewhere
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {elsewhereLinks.map(it => (
                <li key={it.label}>
                  <a href={it.href} className="link-u" style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13 }}>
                    {it.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Colophon */}
        <div style={{
          marginTop: 64,
          paddingTop: 20,
          borderTop: '1px solid rgba(236,231,220,0.18)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          fontFamily: 'var(--font-jetbrains-mono)',
          fontSize: 11,
          color: 'rgba(236,231,220,0.55)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          <span>© 2026 Josh — Hand-built in HTML & opinions.</span>
          <span>No robots were harmed in the making of this portfolio.</span>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
