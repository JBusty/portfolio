import { type VercelConfig } from '@vercel/config/v1';

/**
 * RemoteTechRoles used to live here and no longer does. It has its own repo, its
 * own project, and its own domain; what stays behind is the redirect, because
 * `/jobs` is in browser histories and in at least one bookmark.
 *
 * The cron went with it. This project has no scheduled work left — the board
 * sweep runs from the RemoteTechRoles project now, and pointing a cron at a
 * route that no longer exists would just be a daily 404.
 *
 * Two rules rather than one: `/jobs/:path*` alone would rely on the wildcard
 * matching zero segments, which it does, but the exact rule makes the bare
 * `/jobs` case explicit rather than incidental. Permanent, because it is.
 *
 * The third rule is the case study, not the product: it shipped as Jobwatch and
 * was indexed under that slug before the rename, so `/work/jobwatch` has to keep
 * landing somewhere.
 *
 * The two off-site rules name `www` deliberately. The apex 308-redirects there,
 * so sending `/jobs` to the bare domain would spend two redirects getting one
 * visitor to one page — and this rule exists precisely for the traffic that has
 * the least patience for it, arriving from an old bookmark.
 */
export const config: VercelConfig = {
  framework: 'nextjs',
  redirects: [
    {
      source: '/jobs',
      destination: 'https://www.remotetechroles.com',
      permanent: true,
    },
    {
      source: '/jobs/:path*',
      destination: 'https://www.remotetechroles.com/:path*',
      permanent: true,
    },
    {
      source: '/work/jobwatch',
      destination: '/work/remote-tech-roles',
      permanent: true,
    },
  ],
};
