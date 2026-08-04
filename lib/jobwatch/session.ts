import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

/**
 * The gate on Jobwatch.
 *
 * One user, one password, so there is no user table and no accounts — the
 * password is checked against an env var and the result is a signed cookie.
 *
 * The password lives in `JOBS_PASSWORD` rather than in this file because the
 * repository is public. A literal here would be readable by anyone who opened
 * the repo on GitHub, which would make the gate decorative.
 */

const COOKIE = 'jobwatch_session';
const MAX_AGE_S = 60 * 60 * 24 * 30;

/**
 * Both secrets are read lazily. Reading them at module scope would evaluate
 * during `next build`, which runs before the environment is necessarily
 * populated, and would fail the build rather than the request.
 */
function key(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return new TextEncoder().encode(secret);
}

/**
 * Compares in constant time. A plain `===` leaks the length of the matching
 * prefix through timing; it is a small leak against one password, but the
 * constant-time version is the same amount of code.
 */
function matches(candidate: string, expected: string): boolean {
  if (candidate.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i += 1) {
    diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/** Fails closed: with no password configured nothing can sign in. */
export function checkPassword(candidate: string): boolean {
  const expected = process.env.JOBS_PASSWORD;
  if (!expected) return false;
  return matches(candidate, expected);
}

export async function createSession(): Promise<void> {
  const token = await new SignJWT({ sub: 'owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_S,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/**
 * The real authorization check — the one the page and the state routes call.
 * `proxy.ts` does an optimistic version of this to keep unauthenticated
 * requests from reaching the app at all, but per the Next.js guidance a proxy
 * is not the boundary; this is.
 */
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, key(), { algorithms: ['HS256'] });
    return true;
  } catch {
    // Expired, tampered with, or signed under a rotated secret.
    return false;
  }
}

export const SESSION_COOKIE = COOKIE;
