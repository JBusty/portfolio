import { ImageResponse } from 'next/og';

export const size = { width: 128, height: 128 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1B2233',
          borderRadius: 28,
          position: 'relative',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 900,
            fontSize: 64,
            letterSpacing: '-0.08em',
            lineHeight: 1,
            transform: 'translate(-1px, -3px)',
          }}
        >
          JB
        </span>
      </div>
    ),
    { ...size },
  );
}
