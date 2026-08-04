import { NextResponse, type NextRequest } from 'next/server';

/**
 * Optimistic gate on Jobwatch.
 *
 * Next 16 renamed Middleware to Proxy; the file must sit at the project root
 * beside `app`.
 *
 * This only checks that a session cookie is *present* — it does not verify the
 * signature. That is deliberate, and matches the framework guidance that a
 * proxy is not an authorization boundary: it runs on every matched request, so
 * the cheap check belongs here and the real one belongs where the data is. A
 * forged cookie gets past this and is then rejected by `isAuthed()` in the
 * layout and in every state route.
 *
 * The value is bouncing an anonymous visitor to the login screen without
 * rendering the tool, not security.
 */
const COOKIE = 'jobwatch_session';

export function proxy(request: NextRequest) {
  if (request.cookies.has(COOKIE)) return NextResponse.next();

  const url = new URL('/jobs/login', request.url);
  return NextResponse.redirect(url);
}

/**
 * Everything under /jobs except the login screen itself — matching that would
 * redirect it to itself forever.
 */
export const config = {
  matcher: ['/jobs', '/jobs/((?!login).*)'],
};
