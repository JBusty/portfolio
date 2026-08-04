/**
 * HTML handling for third-party job descriptions.
 *
 * Greenhouse hands back `content` with every angle bracket entity-escaped, so
 * it has to be decoded before it is markup at all. Lever and Ashby hand back
 * real HTML. Either way it is somebody else's markup going into the DOM, so it
 * gets sanitized against an allowlist first.
 */

/**
 * Named entities worth resolving. Anything outside this set is left alone
 * rather than guessed at — a stray `&foo;` renders as itself, which is the
 * same thing a browser would do.
 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–', bull: '•', middot: '·',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  reg: '®', copy: '©', trade: '™', deg: '°', times: '×', minus: '−',
  frac12: '½', frac14: '¼', frac34: '¾', eacute: 'é', egrave: 'è',
  uuml: 'ü', ouml: 'ö', auml: 'ä', ccedil: 'ç', ntilde: 'ñ', shy: '­',
};

/**
 * Decodes numeric and named entities in a single pass.
 *
 * One pass matters: decoding `&amp;` before the rest would turn `&amp;lt;`
 * into `&lt;` and then into `<`, inventing a tag that was never in the source.
 * Matching every reference in one sweep makes that impossible.
 */
export function decodeEntities(input: string): string {
  if (!input) return '';
  return input.replace(/&(#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const isHex = body[1] === 'x' || body[1] === 'X';
      const code = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return whole;
      try {
        return String.fromCodePoint(code);
      } catch {
        return whole;
      }
    }
    const hit = NAMED_ENTITIES[body.toLowerCase()];
    return hit === undefined ? whole : hit;
  });
}

/** Structural tags a job description legitimately needs. */
const ALLOWED_TAGS = new Set([
  'P', 'BR', 'HR', 'DIV', 'SPAN', 'SECTION', 'ARTICLE',
  'B', 'STRONG', 'I', 'EM', 'U', 'SMALL', 'SUB', 'SUP', 'CODE', 'PRE', 'BLOCKQUOTE',
  'UL', 'OL', 'LI', 'DL', 'DT', 'DD',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'A', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD',
]);

/** Tags whose *contents* are dropped too, not just the wrapper. */
const DROP_ENTIRELY = new Set([
  'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON',
  'SELECT', 'TEXTAREA', 'LINK', 'META', 'BASE', 'NOSCRIPT', 'SVG', 'MATH',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(['href', 'title']),
};

function isSafeHref(value: string): boolean {
  const v = value.trim().toLowerCase();
  // Relative and anchor links are fine; of the schemes, only these three.
  if (v.startsWith('#') || v.startsWith('/')) return true;
  return /^(https?:|mailto:|tel:)/.test(v);
}

/**
 * Allowlist sanitizer built on the browser's own parser.
 *
 * Parsing first and then walking the tree avoids the usual regex-sanitizer
 * failure mode, where markup that a regex reads as inert text still gets
 * revived into a node once the browser parses it.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  // Server-side (prerender) there is no DOMParser. The description panel only
  // ever renders after a client fetch, so this path is a safety net: strip to
  // text rather than trusting unparsed markup.
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return escapeHtml(stripTags(dirty));
  }

  const doc = new DOMParser().parseFromString(dirty, 'text/html');

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  const unwrap: Element[] = [];
  const remove: Element[] = [];

  while (walker.nextNode()) {
    const el = walker.currentNode as Element;
    const tag = el.tagName.toUpperCase();

    if (DROP_ENTIRELY.has(tag)) {
      remove.push(el);
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      // Unknown-but-harmless wrapper: keep the words, drop the element.
      unwrap.push(el);
      continue;
    }

    const allowed = ALLOWED_ATTRS[tag];
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (!allowed || !allowed.has(name)) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (name === 'href' && !isSafeHref(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }

    if (tag === 'A' && el.getAttribute('href')) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  }

  // Collected first, mutated after: editing the DOM mid-walk invalidates it.
  for (const el of remove) el.remove();
  for (const el of unwrap) el.replaceWith(...Array.from(el.childNodes));

  return doc.body.innerHTML;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Markup to plain text, for search indexing and previews. */
export function stripTags(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
