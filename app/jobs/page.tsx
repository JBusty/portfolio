import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/jobwatch/session';
import JobwatchApp from './_components/JobwatchApp';

/**
 * The authorization boundary.
 *
 * `proxy.ts` bounces cookie-less requests before they reach the app, but it
 * only checks that a cookie exists — it never verifies the signature. This
 * does, so a hand-written cookie gets no further than here.
 *
 * The check lives in the page rather than in `layout.tsx` because that layout
 * also wraps /jobs/login, and redirecting there would bounce the login screen
 * to itself. The tool itself is a client component, which cannot read cookies,
 * so this server page wraps it.
 */
export default async function JobsPage() {
  if (!(await isAuthed())) redirect('/jobs/login');
  return <JobwatchApp />;
}
