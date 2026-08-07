import { type VercelConfig } from '@vercel/config/v1';

/**
 * Jobwatch used to live here and no longer does. It has its own repo, its own
 * project, and its own deployment; what stays behind is the redirect, because
 * `/jobs` is in browser histories and in at least one bookmark.
 *
 * The cron went with it. This project has no scheduled work left — the board
 * sweep runs from the Jobwatch project now, and pointing a cron at a route that
 * no longer exists would just be a daily 404.
 *
 * Two rules rather than one: `/jobs/:path*` alone would rely on the wildcard
 * matching zero segments, which it does, but the exact rule makes the bare
 * `/jobs` case explicit rather than incidental. Permanent, because it is.
 */
export const config: VercelConfig = {
  framework: 'nextjs',
  redirects: [
    {
      source: '/jobs',
      destination: 'https://jobwatch-topaz.vercel.app',
      permanent: true,
    },
    {
      source: '/jobs/:path*',
      destination: 'https://jobwatch-topaz.vercel.app/:path*',
      permanent: true,
    },
  ],
};
