import 'server-only';

import { auth, currentUser } from '@clerk/nextjs/server';
import { resolveUser, type Account } from './db';

/**
 * The seam between Clerk's identity and Jobwatch's own rows.
 *
 * Everything server-side asks this and nothing asks Clerk directly, so there is
 * one place that knows the two are different things — and one place to change
 * if identity ever moves again. What the rest of the app gets back is a local
 * account id, which is what its foreign keys point at.
 *
 * Anonymous is a supported answer here, not a failure. Jobwatch is readable
 * without an account: the index is public, the filters run in the browser, and
 * the only thing signing in buys is that any of it is still there tomorrow. So
 * this returns null rather than throwing, and each caller decides whether null
 * is allowed — a read may proceed, a write may not.
 */
export async function currentAccount(): Promise<Account | null> {
  /**
   * A deployment with no Clerk keys is every visitor anonymous, not an error.
   *
   * `auth()` throws rather than returning empty when it has not been
   * configured, and without this that throw reached the state route and came
   * back as a 500 on a perfectly ordinary page load — a browser being told the
   * server is broken when the correct answer is "nobody is signed in". The
   * proxy degrades the same way and for the same reason.
   */
  let clerkId: string | null = null;
  try {
    ({ userId: clerkId } = await auth());
  } catch {
    return null;
  }

  /**
   * A null id here is "no session", and it is worth knowing that it is also
   * what a *skewed system clock* looks like. Clerk validates the session JWT
   * locally, so a machine running minutes ahead of real time sees a token that
   * was issued in its future and rejects it — returning null rather than
   * raising, which reads as "signed out" everywhere downstream while the
   * browser stays cheerfully signed in. It cost an afternoon once. If the
   * client says one thing and this says another, check the clock before the
   * code.
   */
  if (!clerkId) return null;

  const user = await currentUser();
  if (!user) return null;

  /**
   * The verified primary address, and nothing else.
   *
   * `resolveUser` claims an existing row by email — that is how an application
   * history written before accounts existed ends up attached to the account
   * that should have it. Which means email is a credential here, and an
   * unverified one would let anybody claim somebody else's history by typing
   * their address at signup. Clerk reports verification per address, so this
   * reads the status rather than trusting the primary flag alone.
   *
   * Resolved through `primaryEmailAddressId` because this is the *backend*
   * `User`, which is not the object the Clerk docs show most often. The
   * frontend `UserResource` has a `primaryEmailAddress` convenience getter; the
   * backend one has only the id and the array. Reading the getter that does not
   * exist yielded `undefined`, which failed the guard below, which made every
   * signed-in visitor resolve as anonymous — a session that looked fine and
   * saved nothing.
   */
  const primary =
    user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)
    ?? user.emailAddresses[0];

  if (!primary || primary.verification?.status !== 'verified') return null;

  return resolveUser(clerkId, primary.emailAddress);
}

/** The common case: which account's rows to read and write, or nobody's. */
export const currentUserId = async (): Promise<string | null> =>
  (await currentAccount())?.id ?? null;

/**
 * Whether an email is verified enough to be trusted with a claim.
 *
 * Exported for the sign-in surface, which wants to explain the one case that
 * otherwise looks like a bug: signed in at Clerk, but Jobwatch behaves as
 * though you are not, because the address has not been confirmed yet.
 */
export async function hasVerifiedEmail(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const primary =
    user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)
    ?? user.emailAddresses[0];
  return primary?.verification?.status === 'verified';
}
