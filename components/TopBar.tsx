'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Case Studies' },
  { href: '/contact', label: 'Contact' },
];

const heroBgMap: Record<string, string> = {
  '/':        'var(--hero-home)',
  '/work':    'var(--hero-work)',
  '/contact': 'var(--hero-contact)',
};

function getHeroBg(pathname: string) {
  if (pathname.startsWith('/work/')) return 'var(--hero-case)';
  return heroBgMap[pathname] ?? 'var(--bone)';
}

function LogoBadge() {
  const [hover, setHover] = useState(false);
  const [pressing, setPressing] = useState(false);

  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressing(false); }}
      onMouseDown={() => setPressing(true)}
      onMouseUp={() => setPressing(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-jetbrains-mono)',
        fontSize: 20,
        fontWeight: 600,
        cursor: 'pointer',
        userSelect: 'none',
        flexShrink: 0,
        letterSpacing: '-0.01em',
        transform: pressing ? 'scale(0.93)' : hover ? 'scale(1.07)' : 'scale(1)',
        transition: `transform ${pressing ? '60ms' : '220ms'} cubic-bezier(.2,.8,.2,1)`,
      }}
    >
      <span style={{
        display: 'inline-block',
        color: hover ? 'var(--accent)' : 'rgba(17,17,16,0.35)',
        transform: hover ? 'translateX(-3px)' : 'translateX(0)',
        transition: 'transform 240ms cubic-bezier(.2,.8,.2,1), color 180ms',
      }}>&lt;</span>
      <span style={{ color: 'var(--ink)' }}>JB</span>
      <span style={{
        display: 'inline-block',
        color: hover ? 'var(--accent)' : 'rgba(17,17,16,0.35)',
        transform: hover ? 'translateX(3px)' : 'translateX(0)',
        transition: 'transform 240ms cubic-bezier(.2,.8,.2,1), color 180ms',
        fontSize: 17,
      }}>&nbsp;/&gt;</span>
    </span>
  );
}

function LinkedInButton() {
  const [hover, setHover] = useState(false);
  return (
    <a
      href="https://www.linkedin.com/in/joshuabussey/"
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="btn topbar-linkedin"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: hover ? '#0A66C2' : 'transparent',
        borderColor: hover ? '#0A66C2' : 'var(--ink)',
        color: hover ? '#fff' : 'var(--ink)',
        transition: 'background 160ms, border-color 160ms, color 160ms',
      }}
    >
      <LinkedInIcon />
      <span>LinkedIn</span>
      <span className="arr" style={{ color: hover ? 'rgba(255,255,255,0.7)' : 'var(--ink)' }}>↗</span>
    </a>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function TopBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (y < 60) { setVisible(true); }
      else if (y > lastY.current) { setVisible(false); }
      else { setVisible(true); }
      lastY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const bg = getHeroBg(pathname);

  return (
    <header className="topbar" style={{ background: bg, top: visible ? 0 : -80 }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '14px 32px',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <LogoBadge />
          <div className="topbar-logo-text" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', whiteSpace: 'nowrap', lineHeight: 1 }}>
              Joshua Bussey
            </span>
            <span className="mono upper" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap', color: 'var(--sub)', lineHeight: 1 }}>
              Product Designer
            </span>
          </div>
        </Link>

        <span className="grow" />

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 6 }}>
          {navItems.map(item => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mono upper nav-link${isActive ? ' nav-link-active' : ''}`}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  borderRadius: 999,
                  color: isActive ? 'var(--bone)' : 'var(--ink)',
                  background: isActive ? 'var(--ink)' : 'transparent',
                }}
              >
                <span style={{ marginRight: 6, color: 'var(--accent)' }}>·</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <LinkedInButton />
      </div>
    </header>
  );
}
