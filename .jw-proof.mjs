/* Verifies one real session token twice with Clerk's own verifier: once against
   this machine's clock, once with the skew allowed for. Nothing else changes. */
import { chromium } from 'playwright';
import { verifyToken } from '@clerk/backend';
import { readFileSync } from 'node:fs';

const ticket = readFileSync(
  'C:/Users/jbuss/AppData/Local/Temp/claude/C--dev-portfolio/a8e99869-608f-4a2e-bc6b-c4d478639400/scratchpad/ticket.txt',
  'utf8',
).trim();

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:3111/jobs/sign-in?__clerk_ticket=${ticket}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);
const cookies = await page.context().cookies();
await browser.close();

const token = cookies.find((c) => c.name === '__session')?.value;
if (!token) { console.log('no session cookie'); process.exit(1); }

const secret = process.env.CLERK_SECRET_KEY;

const attempt = async (label, opts) => {
  try {
    const claims = await verifyToken(token, { secretKey: secret, ...opts });
    console.log(`${label}\n   ACCEPTED  -> user ${claims.sub}`);
  } catch (err) {
    console.log(`${label}\n   REJECTED  -> ${err.message.split('\n')[0]}`);
  }
};

console.log('Same token. Same secret. Same signature. Only the clock differs.\n');
await attempt('1. Using this machine\'s clock as-is:', {});
await attempt('2. Allowing 10 minutes of clock slack:', { clockSkewInMs: 600_000 });
