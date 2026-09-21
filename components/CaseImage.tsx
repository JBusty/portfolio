import Image from 'next/image';
import type { CSSProperties } from 'react';
import { imageMeta } from '@/lib/imageMeta';

/**
 * Case study screenshot. Renders at its true aspect ratio — these images range from
 * ar 0.92 (portrait) to 4.13 (ultra-wide), so a fixed crop throws away most of the frame.
 */
export default function CaseImage({
  src,
  alt,
  sizes,
  className,
  style,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  style?: CSSProperties;
}) {
  const { w, h } = imageMeta(src);
  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      sizes={sizes}
      loading="lazy"
      // The optimizer refuses SVG unless explicitly allowed; pass wireframes through untouched.
      unoptimized={src.endsWith('.svg')}
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block', ...style }}
    />
  );
}
