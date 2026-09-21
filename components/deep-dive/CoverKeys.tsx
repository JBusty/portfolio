'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Number keys open decks from the cover: 1 for the first, 2 for the second.
 * A row that links out — a Figma file — opens in a new tab, as its click does.
 */
export default function CoverKeys({ hrefs }: { hrefs: string[] }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const href = hrefs[Number.parseInt(e.key, 10) - 1];
      if (!href) return;
      if (/^https?:\/\//.test(href)) window.open(href, '_blank', 'noopener');
      else router.push(href);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hrefs, router]);

  return null;
}
