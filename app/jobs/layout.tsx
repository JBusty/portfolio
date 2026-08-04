import type { Metadata } from 'next';

/**
 * Jobwatch is a private tool, not part of the portfolio. It is deliberately
 * absent from the top nav and from `sitemap.ts`.
 *
 * `noindex` is the whole mechanism, and it is intentionally *not* paired with a
 * `Disallow` in robots.ts. A disallow would stop crawlers fetching the page,
 * which also stops them ever reading this tag — the standard way pages end up
 * indexed as a bare URL anyway. It would also publish the path in a file
 * anyone can read, which is the opposite of the point.
 */
export const metadata: Metadata = {
  title: 'Jobwatch',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

/**
 * No auth check here on purpose: this layout also wraps /jobs/login, so a
 * redirect at this level would bounce the login screen to itself. The gate
 * lives in `page.tsx`, which is a server component for exactly that reason.
 */
export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
