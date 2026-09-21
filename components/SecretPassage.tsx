'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isBareRoute } from './SiteChrome';
import { DEEP_DIVE_PATH, PASSPHRASE } from '@/lib/deepDive/route';

/** This many taps on a [data-knock] element, all inside the window, open the door. */
const KNOCKS = 5;
const KNOCK_WINDOW_MS = 2500;

/**
 * The way into the deep dives without typing a URL in front of a room.
 *
 * On a keyboard: type the passphrase anywhere on the site, outside a text
 * field. On a phone: tap the © in the footer five times, quickly. Nothing
 * appears on screen until it works.
 */
export default function SecretPassage() {
  const router = useRouter();
  const pathname = usePathname();
  const inDeck = isBareRoute(pathname);

  useEffect(() => {
    if (inDeck) return;

    let typed = '';
    let knocks: number[] = [];

    function open() {
      typed = '';
      knocks = [];
      router.push(DEEP_DIVE_PATH);
    }

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      typed = (typed + e.key.toLowerCase()).slice(-PASSPHRASE.length);
      if (typed === PASSPHRASE) open();
    }

    function onClick(e: MouseEvent) {
      if (!(e.target instanceof Element) || !e.target.closest('[data-knock]')) return;
      knocks = [...knocks.filter((t) => e.timeStamp - t < KNOCK_WINDOW_MS), e.timeStamp];
      if (knocks.length >= KNOCKS) open();
    }

    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [inDeck, router]);

  return null;
}
