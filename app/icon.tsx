import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 20, color: '#E13B14', lineHeight: 1 }}>{'<'}</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 17, color: '#111110', lineHeight: 1, letterSpacing: '-1px' }}>JB</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: '#E13B14', lineHeight: 1 }}>{'/>'}</span>
      </div>
    ),
    { ...size },
  );
}
