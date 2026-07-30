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
        color: hover ? 'var(--accent)' : 'rgba(17,17,16,0.65)',
        transform: hover ? 'translateX(-3px)' : 'translateX(0)',
        transition: 'transform 240ms cubic-bezier(.2,.8,.2,1), color 180ms',
      }}>&lt;</span>
      <span style={{ color: 'var(--ink)' }}>JB</span>
      <span style={{
        display: 'inline-block',
        color: hover ? 'var(--accent)' : 'rgba(17,17,16,0.65)',
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

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 22 }}>
      <span style={{
        display: 'block', height: 2, background: 'var(--ink)', borderRadius: 2,
        transform: open ? 'translateY(7px) rotate(45deg)' : 'none',
        transition: 'transform 220ms cubic-bezier(.2,.8,.2,1)',
      }} />
      <span style={{
        display: 'block', height: 2, background: 'var(--ink)', borderRadius: 2,
        opacity: open ? 0 : 1,
        transition: 'opacity 180ms',
      }} />
      <span style={{
        display: 'block', height: 2, background: 'var(--ink)', borderRadius: 2,
        transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none',
        transition: 'transform 220ms cubic-bezier(.2,.8,.2,1)',
      }} />
    </div>
  );
}

export default function TopBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Close on route change or Escape
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setMenuOpen(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Prevent body scroll while menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const bg = getHeroBg(pathname);

  return (
    <>
      <header
        className="topbar"
        style={{ background: bg, top: menuOpen ? 0 : (visible ? 0 : -80) }}
      >
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
              <span className="topbar-logo-name" style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', whiteSpace: 'nowrap', lineHeight: 1 }}>
                Joshua Bussey
              </span>
              <span className="mono upper topbar-logo-role" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap', color: 'var(--sub)', lineHeight: 1 }}>
                Product Designer
              </span>
            </div>
          </Link>

          <span className="grow" />

          {/* Desktop nav */}
          <nav className="topbar-nav" style={{ display: 'flex', gap: 6 }}>
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

          {/* Desktop CTA */}
          <LinkedInButton />

          {/* Hamburger */}
          <button
            className="topbar-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              lineHeight: 0,
            }}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </header>

      {/* Backdrop */}
      <div
        className="topbar-mobile-backdrop"
        onClick={() => setMenuOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 49,
          background: 'rgba(17,17,16,0.45)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 300ms ease',
        }}
      />

      {/* Slide-in panel */}
      <nav
        className="topbar-mobile-menu"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(300px, 82vw)',
          height: '100dvh',
          zIndex: 51,
          background: bg,
          boxShadow: '-12px 0 40px rgba(17,17,16,0.14)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 20px 32px',
          overflowY: 'auto',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 340ms cubic-bezier(.2,.8,.2,1)',
        }}
      >
        {/* Panel header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Joshua Bussey
            </span>
            <span className="mono upper" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--sub)', lineHeight: 1 }}>
              Product Designer
            </span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, lineHeight: 0 }}
          >
            <HamburgerIcon open={true} />
          </button>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                  padding: '13px 16px',
                  fontSize: 13,
                  letterSpacing: '0.06em',
                  borderRadius: 10,
                  color: isActive ? 'var(--bone)' : 'var(--ink)',
                  background: isActive ? 'var(--ink)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span style={{ marginRight: 8, color: isActive ? 'var(--bone)' : 'var(--accent)' }}>·</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* LinkedIn at bottom */}
        <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--rule)' }}>
          <LinkedInButton />
          <div
            className="mono"
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: 11,
              lineHeight: 1.5,
              color: 'var(--sub)',
              letterSpacing: '0.04em',
            }}
          >
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', marginTop: 1, flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="8" width="14" height="11" rx="3" />
                <path d="M12 4v4" />
                <path d="M9 4h6" />
                <circle cx="10" cy="13" r="1" fill="currentColor" stroke="none" />
                <circle cx="14" cy="13" r="1" fill="currentColor" stroke="none" />
                <path d="M9 16h6" />
                <path d="M5 12H3" />
                <path d="M21 12h-2" />
              </svg>
            </span>
            No robots were harmed building this portfolio.
          </div>
        </div>
      </nav>
    </>
  );
}
