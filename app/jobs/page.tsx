import JobwatchApp from './_components/JobwatchApp';

/**
 * No gate. That is the change.
 *
 * This page used to be the authorization boundary — it verified a signed cookie
 * and redirected anyone without one to a password screen. Both halves of that
 * are gone: there is no shared password, and being signed out is a way to use
 * Jobwatch rather than a reason to be turned away. The index is public, the
 * filtering runs in the browser, and an anonymous session gets the whole board.
 *
 * What signing in buys is persistence, and that boundary lives where the data
 * is: `/api/jobwatch/state` resolves an account and refuses to write without
 * one. So there is nothing left here to check, and a redirect would only be a
 * door in front of an open room.
 */
export default function JobsPage() {
  return <JobwatchApp />;
}
