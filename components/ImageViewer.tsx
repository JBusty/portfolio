'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { imageMeta } from '@/lib/imageMeta';

/**
 * Full-screen viewer for a case study screenshot. Traps focus on the one control
 * it has, restores it on close, and locks the page behind it.
 */
export default function ImageViewer({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { w, h } = imageMeta(src);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Only the close button is focusable in here, so keep Tab from escaping to the page behind.
      if (e.key === 'Tab') {
        e.preventDefault();
        closeRef.current?.focus();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `Expanded image: ${alt}` : 'Expanded image'}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: visible ? 'rgba(10,8,6,0.88)' : 'rgba(10,8,6,0)',
        backdropFilter: visible ? 'blur(14px)' : 'blur(0px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 320ms ease, backdrop-filter 320ms ease',
      }}
    >
      <Image
        src={src}
        alt={alt ?? ''}
        width={w}
        height={h}
        sizes="90vw"
        unoptimized={src.endsWith('.svg')}
        onClick={e => e.stopPropagation()}
        style={{
          // width:auto capped every image at its intrinsic pixel size, so the sub-1200px
          // screenshots opened barely bigger than the thumbnail. Grow to whichever viewport
          // bound binds first instead — but never blow a small asset past 2x its own pixels.
          width: `min(90vw, calc(88vh * ${(w / h).toFixed(4)}), ${w * 2}px)`,
          height: 'auto',
          maxWidth: '90vw',
          maxHeight: '88vh',
          objectFit: 'contain',
          borderRadius: 'var(--radius)',
          boxShadow: '0 48px 96px rgba(0,0,0,0.6)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.94)',
          transition: 'opacity 360ms ease, transform 420ms cubic-bezier(.2,.7,.2,1)',
        }}
      />
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close image"
        style={{
          position: 'absolute',
          top: 24,
          right: 28,
          background: 'rgba(236,231,220,0.08)',
          border: '1px solid rgba(236,231,220,0.2)',
          color: 'var(--bone)',
          width: 44,
          height: 44,
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: visible ? 1 : 0,
          transition: 'opacity 280ms ease 80ms, background 160ms',
        }}
      >
        ✕
      </button>
    </div>,
    document.body,
  );
}
