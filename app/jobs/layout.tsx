import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';

/**
 * Jobwatch is a tool with accounts, served from its own host — see `proxy.ts`,
 * which rewrites jobwatch.joshuabussey.com onto this tree. It is deliberately
 * absent from the portfolio's top nav and from `sitemap.ts`.
 *
 * `noindex` is a holdover from when this was one person's private board behind
 * a shared password, and it is worth a deliberate decision now that anyone can
 * register: a product nobody can find is a strange thing to open registration
 * on. Left as it stands rather than flipped quietly, because making a domain
 * indexable is not a change to sneak into a refactor.
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
 * The Clerk boundary is here rather than in the root layout, and that placement
 * is load-bearing twice over.
 *
 * The portfolio is statically prerendered — `/`, `/work`, `/contact` and the
 * case studies are all built at deploy time. `ClerkProvider` at the root would
 * pull every one of them into Clerk's runtime and make a build depend on
 * credentials that have nothing to do with them. Scoped here, the marketing
 * site keeps building and rendering exactly as it did, with no Clerk JavaScript
 * in its bundle at all.
 */
export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    /**
     * `afterSignOutUrl` because Clerk's default is `/`, and `/` is the
     * portfolio — so signing out of the tool ejected you onto a marketing site
     * with no way back except the browser's back button. Signing out should
     * leave you where you signed out from, which for an app that works signed
     * out is the board itself.
     *
     * Set as a prop rather than through `NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL`:
     * this is a fact about how the app is laid out, not a per-environment
     * setting, and it should not be able to drift between them.
     */
    <ClerkProvider afterSignOutUrl="/jobs">{children}</ClerkProvider>
  );
}
