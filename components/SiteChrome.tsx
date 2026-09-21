'use client';

import { usePathname } from 'next/navigation';
import TopBar from './TopBar';
import Footer from './Footer';
import { DEEP_DIVE_PATH } from '@/lib/deepDive/route';

/**
 * Routes that render without the portfolio's chrome.
 *
 * The deep dives are a slide deck, not a page of the site: a sticky nav over a
 * projected slide and a footer of portfolio links under it would both be in
 * the way. They are unlisted too, so nothing in the nav should lead there.
 */
const BARE_ROUTES = [DEEP_DIVE_PATH];

export function isBareRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return BARE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function SiteNav() {
  return isBareRoute(usePathname()) ? null : <TopBar />;
}

export function SiteFooter() {
  return isBareRoute(usePathname()) ? null : <Footer />;
}
