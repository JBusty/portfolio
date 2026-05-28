'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Index' },
  { href: '/work', label: 'Work' },
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

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/New_York',
  });
}

export default function TopBar() {
  const pathname = usePathname();
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(formatTime(new Date()));
    const id = setInterval(() => setTime(formatTime(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);

  const bg = getHeroBg(pathname);

  return (
    <header className="topbar" style={{ background: bg }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '14px 32px',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            background: 'var(--ink)',
            color: 'var(--bone)',
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
          }}>J</span>
          <span className="mono upper" style={{ fontSize: 12, letterSpacing: '0.08em' }}>
            Josh / Portfolio · &#x2019;26
          </span>
        </Link>

        <span className="grow" />

        {/* Nav */}
        <nav className="hide-sm" style={{ display: 'flex', gap: 6 }}>
          {navItems.map(item => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="mono upper"
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  border: '1px solid transparent',
                  borderRadius: 999,
                  color: isActive ? 'var(--bone)' : 'var(--ink)',
                  background: isActive ? 'var(--ink)' : 'transparent',
                  transition: 'background 120ms, border-color 120ms',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = 'var(--rule-strong)';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                }}
              >
                <span style={{ marginRight: 6, color: 'var(--accent)' }}>·</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status + time */}
        <div className="hide-sm" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: 'var(--font-jetbrains-mono)',
          fontSize: 11,
          color: 'var(--sub)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#1f9d55',
              display: 'inline-block',
              boxShadow: '0 0 0 3px rgba(31,157,85,0.15)',
            }} />
            Available · Q3 &#x2019;26
          </span>
          <span className="rule-v" style={{ height: 14 }} />
          {time && <span>{time} ET</span>}
        </div>

        {/* CTA */}
        <Link href="/contact" className="btn">
          Let&#x2019;s talk <span className="arr">↗</span>
        </Link>
      </div>
    </header>
  );
}
