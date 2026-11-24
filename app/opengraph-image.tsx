import { ImageResponse } from 'next/og';

export const alt = 'Joshua Bussey — Senior Product Designer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '72px 80px',
          background: '#EDF0F5',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3D5A80', marginRight: 12 }} />
          <span style={{ fontSize: 18, color: '#5A6172', letterSpacing: 2, textTransform: 'uppercase' }}>
            Portfolio
          </span>
        </div>
        <div style={{ fontSize: 80, fontWeight: 700, color: '#1B2233', letterSpacing: '-3px', lineHeight: 1, marginBottom: 24 }}>
          Joshua Bussey
        </div>
        <div style={{ fontSize: 32, color: '#2C3446', fontWeight: 400 }}>
          Senior Product Designer · 12+ years untangling enterprise software
        </div>
      </div>
    ),
    { ...size },
  );
}
