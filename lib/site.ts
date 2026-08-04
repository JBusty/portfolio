// Must match the host that actually serves 200. The apex 307-redirects to www,
// so canonicals/sitemap must point at www or Google sees a redirect loop and
// refuses to index (GSC "Redirect error").
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.joshuabussey.com';
