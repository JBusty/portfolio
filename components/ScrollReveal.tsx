'use client';

import {
  createElement,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

type ScrollRevealProps<T extends ElementType = 'div'> = {
  as?: T;
  children: ReactNode;
  className?: string;
  delayMs?: number;
  rootMargin?: string;
  style?: CSSProperties;
  threshold?: number;
};

export default function ScrollReveal<T extends ElementType = 'div'>({
  as,
  children,
  className,
  delayMs = 0,
  rootMargin = '0px 0px -8% 0px',
  style,
  threshold = 0.08,
}: ScrollRevealProps<T>) {
  const Component = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.9) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      });
    }, {
      threshold,
      rootMargin,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return createElement(Component, {
    ref,
    className: ['scroll-reveal', visible ? 'is-visible' : '', className ?? ''].filter(Boolean).join(' '),
    style: {
      ...style,
      ['--reveal-delay' as string]: `${delayMs}ms`,
    },
  }, children);
}
