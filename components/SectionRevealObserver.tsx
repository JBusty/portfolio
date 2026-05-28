'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function SectionRevealObserver() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    document.documentElement.classList.add('motion-ready');

    const main = document.querySelector('main');
    if (!main) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const children = Array.from(main.children) as HTMLElement[];
    const groups: HTMLElement[][] = [];

    for (let index = 0; index < children.length; index += 1) {
      const current = children[index];
      const next = children[index + 1];
      const currentIsHead = current.matches('[data-reveal]');
      const nextIsSection = next?.tagName === 'SECTION';

      if (currentIsHead && nextIsSection) {
        groups.push([current, next]);
        index += 1;
        continue;
      }

      if (current.tagName === 'SECTION' || currentIsHead) {
        groups.push([current]);
      }
    }

    if (!groups.length) return;

    const revealGroup = (group: HTMLElement[]) => {
      group.forEach((element) => {
        element.dataset.revealState = 'visible';
      });
    };

    if (reduceMotion) {
      groups.forEach(revealGroup);
      return;
    }

    groups.forEach((group, index) => {
      const delay = `${Math.min(index * 45, 180)}ms`;
      group.forEach((element) => {
        element.dataset.revealState = 'pending';
        element.style.setProperty('--reveal-delay', delay);
      });
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const group = groups.find((candidate) => candidate[0] === entry.target);
        if (!group) return;
        revealGroup(group);
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -6% 0px',
    });

    groups.forEach((group) => {
      const anchor = group[0];
      const rect = anchor.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.9) {
        revealGroup(group);
        return;
      }
      observer.observe(anchor);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
