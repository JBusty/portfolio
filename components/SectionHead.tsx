import { ReactNode } from 'react';

interface SectionHeadProps {
  kicker?: string;
  title?: ReactNode;
}

export default function SectionHead({ kicker, title }: SectionHeadProps) {
  return (
    <div style={{ borderTop: '1px solid var(--ink)' }}>
      <div className="container" style={{ padding: '40px 32px 32px' }}>
        {kicker && (
          <div className="mono upper" style={{
            fontSize: 11,
            color: 'var(--accent)',
            marginBottom: 12,
            letterSpacing: '0.1em',
          }}>
            {kicker}
          </div>
        )}
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
