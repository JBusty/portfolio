/**
 * The deep dives' address, on its own so the site-wide components can import
 * it without pulling the decks — notes and pushback included — into every
 * page's bundle.
 *
 * Unlisted: not in the nav, the sitemap, or robots.txt (a Disallow line would
 * only advertise it), and every page under it is noindex. The ways in are the
 * URL itself and the passphrase — see components/SecretPassage.tsx. Both are
 * visible in client code to anyone who goes looking; this is a hidden door, not
 * a lock.
 */
export const DEEP_DIVE_PATH = '/deep-dive';

/** Typed anywhere on the site, outside a text field. */
export const PASSPHRASE = 'deepdive';
