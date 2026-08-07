import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Host routing and the Clerk session, in the one proxy Next allows.
 *
 * Next 16 renamed Middleware to Proxy; the file must sit at the project root
 * beside `app`, and the function may be a default or a named `proxy` export.
 *
 * This no longer gates anything. It used to bounce every cookie-less visitor to
 * a login screen, which was right when Jobwatch had one user and a password in
 * an environment variable — and is exactly wrong now that anonymous browsing is
 * a supported way to use it. Authorization moved to where the data is: every
 * state route resolves an account and refuses to write without one. A proxy is
 * not an authorization boundary, and this one has stopped pretending to be.
 */

/**
 * The tool's own host, and whether it is actually reachable yet.
 *
 * Set `NEXT_PUBLIC_JOBWATCH_HOST` once the subdomain resolves; leave it unset
 * until then. The rewrite below is harmless either way — a host that nobody can
 * reach cannot arrive here — but the redirect is not: sending
 * joshuabussey.com/jobs to a subdomain with no DNS behind it takes Jobwatch off
 * the internet for as long as the record is missing, and it would do it on the
 * deploy *before* the one that fixes it. So the canonical redirect is opt-in,
 * and the ordering stops mattering.
 */
const APP_HOST = process.env.NEXT_PUBLIC_JOBWATCH_HOST || 'jobwatch.joshuabussey.com';
const SUBDOMAIN_LIVE = Boolean(process.env.NEXT_PUBLIC_JOBWATCH_HOST);

/** The portfolio. Kept as a set so www and apex answer the same way. */
const SITE_HOSTS = new Set(['joshuabussey.com', 'www.joshuabussey.com']);

/** Ports are part of the Host header and never part of the comparison. */
const hostname = (request: NextRequest) =>
  (request.headers.get('host') ?? '').split(':')[0].toLowerCase();

/**
 * Paths that mean the same thing on every host.
 *
 * `/api` is the one that bites: the client fetches `/api/jobwatch/index` by
 * absolute path, and prefixing that with `/jobs` on the subdomain would rewrite
 * a live route into a 404 — the tool would load and then quietly have no
 * postings in it. `_next` is here for the same reason with the asset graph.
 */
const isShared = (pathname: string) =>
  pathname.startsWith('/api/') ||
  pathname.startsWith('/_next/') ||
  pathname.startsWith('/jobs');

/**
 * Host routing on its own, with no opinion about sessions.
 *
 * Returns a response only when there is genuinely somewhere else to send the
 * request, and `undefined` otherwise — which is the whole trick, and was the
 * bug. Returning `NextResponse.next()` for ordinary requests looks like a
 * harmless no-op and is not: `clerkMiddleware` attaches the resolved auth state
 * to the response it builds, so handing back a fresh blank one throws that away
 * on every request. The symptom is a session the browser can see and the server
 * cannot — signed in in the chrome, anonymous in every route handler, and no
 * error anywhere to say so.
 *
 * Separated from the Clerk wrapper below so it can also run without it — see
 * the export, and why that matters.
 */
function routeByHost(request: NextRequest): NextResponse | undefined {
  const host = hostname(request);
  const { pathname, search } = request.nextUrl;

  /**
   * On the tool's host, the /jobs tree is served from the root.
   *
   * A rewrite rather than a redirect, which is the whole point: the browser
   * keeps showing `jobwatch.joshuabussey.com/sign-in` while Next renders
   * `app/jobs/sign-in`. Nothing moves on disk, `/jobs` keeps working in local
   * development where there is no subdomain to speak of, and the portfolio and
   * the tool stay one deployment.
   */
  if (host === APP_HOST && !isShared(pathname)) {
    const to = new URL(`/jobs${pathname === '/' ? '' : pathname}${search}`, request.url);
    return NextResponse.rewrite(to);
  }

  /**
   * One canonical address for the tool.
   *
   * The old path has to keep answering — it is in browser histories and in the
   * bookmark of the one person who has been using it — but answering with the
   * page would leave two URLs serving the same app, which splits sessions
   * across two cookie scopes and is the kind of thing that reads as a bug three
   * weeks later. Permanent, because it is.
   */
  if (SUBDOMAIN_LIVE && SITE_HOSTS.has(host) && (pathname === '/jobs' || pathname.startsWith('/jobs/'))) {
    const to = new URL(`${pathname.replace(/^\/jobs/, '') || '/'}${search}`, `https://${APP_HOST}`);
    return NextResponse.redirect(to, 308);
  }

  // Nothing to route. Deliberately not `NextResponse.next()` — see above.
  return undefined;
}

/**
 * Whether this deployment has been given the keys.
 *
 * The matcher below is deliberately broad — Clerk has to see every request it
 * might attach a session to — and the cost of that breadth is that anything
 * thrown in here takes the *portfolio* down too, not just the tool. Clerk
 * throws on a missing publishable key, so an unconfigured deployment would
 * serve a 500 on the front page: a marketing site felled by the auth of an app
 * that shares its repo.
 *
 * So the session layer is what degrades. Without keys, host routing still runs,
 * the portfolio is untouched, and Jobwatch resolves no account — which is
 * precisely the anonymous session it already supports, and it says so in the
 * chrome rather than pretending to save.
 */
const CLERK_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export default CLERK_CONFIGURED
  ? clerkMiddleware(async (_auth, request: NextRequest) => routeByHost(request))
  // Without Clerk there is no session to preserve, so the bare path has to
  // produce a response itself rather than returning nothing.
  : (request: NextRequest) => routeByHost(request) ?? NextResponse.next();

/**
 * Clerk needs to run on everything it might have to attach a session to, which
 * is why this is an exclusion list rather than the `/jobs` matcher that used to
 * be here — on the subdomain the tool's paths do not start with `/jobs` from
 * the outside, so a path-shaped matcher would miss every one of them.
 *
 * Static files and Next's own internals are excluded: they cannot read a
 * session and running on them is pure latency on every asset.
 */
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
