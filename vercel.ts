import { type VercelConfig } from '@vercel/config/v1';

/**
 * Jobwatch's board sweep.
 *
 * Each firing takes one of twelve shards, so the full ~15,900-board list is
 * covered every hour. Sharding is what keeps the job inside a single
 * invocation's budget — see `app/api/jobwatch/refresh/route.ts`.
 */
export const config: VercelConfig = {
  framework: 'nextjs',
  crons: [{ path: '/api/jobwatch/refresh', schedule: '*/5 * * * *' }],
};
