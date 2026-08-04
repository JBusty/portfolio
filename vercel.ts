import { type VercelConfig } from '@vercel/config/v1';

/**
 * Jobwatch's board sweep.
 *
 * Each firing takes one of twelve shards, so the full ~15,900-board list needs
 * twelve firings for full coverage. Sharding is what keeps the job inside a
 * single invocation's budget — see `app/api/jobwatch/refresh/route.ts`.
 *
 * Schedule is once daily because a five-minute schedule exceeds the Hobby
 * plan's cron limits and fails the deployment outright. At one firing per day
 * that means ~12 days per full sweep; minute-level scheduling needs Pro.
 */
export const config: VercelConfig = {
  framework: 'nextjs',
  crons: [{ path: '/api/jobwatch/refresh', schedule: '0 4 * * *' }],
};
