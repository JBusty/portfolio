import { ReactNode } from 'react';

interface SectionHeadProps {
  title?: ReactNode;
}

export default function SectionHead({ title }: SectionHeadProps) {
  return (
    <div data-reveal style={{ borderTop: '1px solid var(--ink)' }}>
      <div className="container" style={{ padding: '80px 32px 64px' }}>
        {title && (
          <h2 className="tight" style={{
            margin: 0,
            fontSize: 'clamp(36px, 5vw, 80px)',
            lineHeight: 0.96,
            letterSpacing: '-0.04em',
            fontWeight: 700,
            maxWidth: '16ch',
          }}>
            {title}
          </h2>
        )}
      </div>
    </div>
  );
}
