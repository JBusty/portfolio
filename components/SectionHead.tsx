import { ReactNode } from 'react';

interface SectionHeadProps {
  title?: ReactNode;
  eyebrow?: string;
}

export default function SectionHead({ title, eyebrow }: SectionHeadProps) {
  return (
    <div data-reveal style={{ borderTop: '1px solid var(--ink)' }}>
      <div className="container sp-sec-head" style={{ padding: '80px 32px 64px' }}>
        {eyebrow && (
          <div className="mono upper" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: 20 }}>
            {eyebrow}
          </div>
        )}
        {title && (
          <h2 className="tight" style={{
            margin: 0,
            fontSize: 'clamp(36px, 5vw, 80px)',
            lineHeight: 1.06,
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
