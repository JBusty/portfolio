'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MeetJosh from '@/components/MeetJosh';
import SearchPalette from '@/components/SearchPalette';
import { LINKEDIN_URL, RESUME_URL } from '@/lib/home';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Case studies' },
  { href: '/skills', label: 'Skills' },
  { href: '/contact', label: 'Contact' },
];

// The nav floats over the page. Above it sits a spacer the colour of each page's
// masthead, so headers start below the nav. The homepage hero runs underneath
// instead, so there's no spacer there. /jobs has no masthead, so it falls back to the page colour.
const heroBgMap: Record<string, string> = {
  '/work':    'var(--hero-work)',
  '/skills':  'var(--hero-skills)',
  '/contact': 'var(--hero-contact)',
};
function getHeroBg(pathname: string) {
  if (pathname.startsWith('/work/')) return 'var(--hero-case)';
  return heroBgMap[pathname] ?? 'var(--bone)';
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

/**
 * Nav glyphs, on the same 24 grid and 1.8 stroke as the other icons in here.
 * Decorative — the label beside each one carries the meaning.
 */
function NavIcon({ href }: { href: string }) {
  // Fill is left to CSS: outline at rest, solid once the link goes dark. Details
  // marked nav-icon-cut stay unfilled and switch to ink there, so they read as
  // knockouts in the solid shape instead of vanishing into it.
  const props = {
    className: 'nav-icon',
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (href === '/') {
    return (
      <svg {...props}>
        <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
        <path className="nav-icon-cut" d="M9.5 20.5v-6h5v6" />
      </svg>
    );
  }
  if (href === '/work') {
    // An open book: something to read.
    return (
      <svg {...props}>
        <path d="M3 5h4.8c2.3 0 4.2 1.2 4.2 2.7v11.5c0-1.5-1.9-2.7-4.2-2.7H3z" />
        <path d="M21 5h-4.8c-2.3 0-4.2 1.2-4.2 2.7v11.5c0-1.5 1.9-2.7 4.2-2.7H21z" />
        <path className="nav-icon-cut" d="M12 7.7v11.5" />
      </svg>
    );
  }
  if (href === '/skills') {
    // Three rising bars: a skills meter.
    return (
      <svg {...props}>
        <rect x="3.5" y="13" width="4.5" height="7.5" rx="1.2" />
        <rect x="9.75" y="8.5" width="4.5" height="12" rx="1.2" />
        <rect x="16" y="3.5" width="4.5" height="17" rx="1.2" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path className="nav-icon-cut" d="m3.6 7 8.4 6 8.4-6" />
    </svg>
  );
}

/**
 * Light/dark switch. The theme lives on <html data-theme>, set before paint by
 * the script in app/layout.tsx; this flips it and remembers the choice. Which
 * icon shows is left to CSS, so the server render never disagrees with it.
 */
function readTheme() {
  try { return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(readTheme() === 'dark'); }, []);
  // Keep the saved theme on <html>: React owns that element, and when the root
  // layout re-renders (Fast Refresh, for one) it drops the attribute the
  // pre-paint script added. Watch for that and put it back.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const want = readTheme() === 'dark' ? 'dark' : undefined;
      if (root.dataset.theme !== want) {
        if (want) root.dataset.theme = want;
        else delete root.dataset.theme;
      }
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  const toggle = () => {
    const next = readTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', next); } catch {}
    if (next === 'dark') document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    setDark(next === 'dark');
  };
  return { dark, toggle };
}

function ThemeIcon() {
  return (
    <>
      <svg className="theme-ic-moon" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
      <svg className="theme-ic-sun" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
    </>
  );
}

export default function TopBar() {
  const pathname = usePathname();
  const theme = useTheme();
  const [visible, setVisible] = useState(true);
  const [meetOpen, setMeetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);   // phones: the slide-out menu
  const [mod, setMod] = useState('⌘');
  const avatarRef = useRef<HTMLImageElement>(null);
  const lastY = useRef(0);
  const dockRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  // Menu: closes on navigation and Escape, locks page scroll while open, and
  // moves focus in (and back to the button when it closes).
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    document.documentElement.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLElement>('.drawer-x')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    const burger = burgerRef.current;
    return () => {
      document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      if (burger && document.activeElement && drawerRef.current?.contains(document.activeElement)) burger.focus({ preventScroll: true });
    };
  }, [menuOpen]);
  // Close it if the screen grows past the phone layout.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = () => { if (!mq.matches) setMenuOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Hides scrolling down, comes back scrolling up; always shown near the top.
  // A jump of more than half a screen in one go isn't someone scrolling: it's a link to
  // an anchor (/skills#engineering) or a programmatic scroll, so show the nav on arrival.
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (y < 100 || Math.abs(y - lastY.current) > window.innerHeight / 2) setVisible(true);
      else if (y > lastY.current) setVisible(false);
      else setVisible(true);
      lastY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Always arrive on a new page with the nav showing. Next.js moves focus to the
  // new <main> after navigation, which nudges the page down slightly; without this
  // the nav reads that as a downward scroll and hides itself on arrival.
  useEffect(() => { setVisible(true); lastY.current = 0; }, [pathname]);

  // ⌘K / Ctrl+K opens search from anywhere.
  useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.platform)) setMod('Ctrl ');
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(o => !o); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isHome = pathname === '/';
  const shown = visible || meetOpen || searchOpen || menuOpen;

  // Tell sticky things (the pinned process line) how much room the nav takes right now.
  useEffect(() => {
    const set = () => {
      const d = dockRef.current;   // layout box, not the on-screen one, which is mid-slide when this runs
      const b = d ? d.offsetTop + d.offsetHeight : 0;
      document.documentElement.style.setProperty('--dock-offset', shown ? `${b}px` : '0px');
    };
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, [shown]);

  return (
    <>
      <div className="dock-spacer" aria-hidden="true" style={{ height: isHome ? 0 : undefined, background: getHeroBg(pathname) }} />
      <header ref={dockRef} className={`dock${shown ? '' : ' dock-away'}`}>
        <nav aria-label="Main" className="dock-in" style={{ '--nav-surface': 'var(--paper)' } as CSSProperties}>
          <button type="button" className="dock-me" onClick={() => setMeetOpen(true)} aria-haspopup="dialog" aria-label="Josh Bussey, Senior Product Designer. Meet Josh">
            <Image ref={avatarRef} src="/images/crew/josh.jpg" alt="" width={84} height={84} preload />
            <span className="dock-who"><b>Josh Bussey</b><small>Senior Product Designer</small></span>
          </button>
          <span className="dock-sep" aria-hidden="true" />
          <div className="dock-tabs">
            {navItems.map(item => {
              const active = item.href === '/' ? isHome : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={`dock-tab${active ? ' on' : ''}`} data-icon={item.href.slice(1) || 'home'} aria-current={active ? 'page' : undefined}>
                  <NavIcon href={item.href} />
                  {item.label}
                </Link>
              );
            })}
          </div>
          {/* looks like a field, opens the ⌘K palette */}
          <button type="button" className="dock-srch" onClick={() => setSearchOpen(true)} aria-label={`Search case studies, systems, or skills (${mod.trim()}+K)`}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <span className="dock-ph">Search case studies, systems, or skills…</span>
          </button>
          <div className="dock-actions">
            <button type="button" className="dock-ib" onClick={theme.toggle} aria-pressed={theme.dark} aria-label="Dark mode" data-tip={theme.dark ? 'Light mode' : 'Dark mode'}>
              <ThemeIcon />
            </button>
            <a className="dock-ib" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn (opens in a new tab)" data-tip="LinkedIn">
              <LinkedInIcon />
            </a>
            <a className="dock-ib" href={RESUME_URL} target="_blank" rel="noopener noreferrer" aria-label="Résumé (opens in a new tab)" data-tip="Résumé">
              <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor" /><path d="M12 6.5v8M8.5 11.5 12 15l3.5-3.5M7.5 17.5h9" fill="none" style={{ stroke: 'var(--paper)' }} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          </div>
          <button
            ref={burgerRef}
            type="button"
            className={`dock-burger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span /><span /><span />
          </button>
        </nav>
      </header>

      {/* Phones: the menu slides in from the right */}
      <div className={`drawer-scrim${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <nav ref={drawerRef} id="mobile-menu" className={`drawer${menuOpen ? ' open' : ''}`} aria-label="Menu" inert={!menuOpen}>
        <div className="drawer-head">
          <button type="button" className="drawer-me" onClick={() => { setMenuOpen(false); setMeetOpen(true); }}>
            <Image src="/images/crew/josh.jpg" alt="" width={96} height={96} />
            <span><b>Josh Bussey</b><small>Senior Product Designer</small><em>Meet Josh (and the dogs) →</em></span>
          </button>
          <button type="button" className="drawer-x" onClick={() => setMenuOpen(false)} aria-label="Close menu">&times;</button>
        </div>
        <div className="drawer-links">
          {navItems.map((item, i) => {
            const active = item.href === '/' ? isHome : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`drawer-link${active ? ' on' : ''}`} aria-current={active ? 'page' : undefined} style={{ '--i': i } as CSSProperties}>
                <NavIcon href={item.href} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="drawer-acts">
          <a className="btn" href={RESUME_URL} target="_blank" rel="noopener noreferrer">
            Résumé
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5M12 11v6M9 14l3 3 3-3" /></svg>
          </a>
          <div className="drawer-row">
            <button type="button" className="drawer-ib" onClick={() => { setMenuOpen(false); setSearchOpen(true); }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              Search
            </button>
            <a className="drawer-ib" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
              <LinkedInIcon />
              LinkedIn
            </a>
            <button type="button" className="drawer-ib" onClick={theme.toggle} aria-pressed={theme.dark}>
              <ThemeIcon />
              Dark mode
            </button>
          </div>
        </div>
        <p className="drawer-note">No robots were harmed building this portfolio.</p>
      </nav>
      <MeetJosh open={meetOpen} onClose={() => setMeetOpen(false)} avatarRef={avatarRef} />
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
