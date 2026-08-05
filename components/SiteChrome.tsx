'use client';

import { usePathname } from 'next/navigation';
import TopBar from './TopBar';
import Footer from './Footer';

/**
 * Routes that render without the portfolio's chrome.
 *
 * Jobwatch is a tool that happens to be hosted here, not a page of the site.
 * It is password-gated, absent from the nav and the sitemap, and its own filter
 * bar already had to be given a higher z-index than the TopBar to stay
 * reachable — which was the sign that two competing bars were one too many.
 * A footer full of portfolio links under a dense work surface is the same
 * mistake at the other end.
 */
const BARE_ROUTES = ['/jobs'];

function isBare(pathname: string | null): boolean {
  if (!pathname) return false;
  return BARE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function SiteNav() {
  const pathname = usePathname();
  return isBare(pathname) ? null : <TopBar />;
}

export function SiteFooter() {
  const pathname = usePathname();
  return isBare(pathname) ? null : <Footer />;
}
