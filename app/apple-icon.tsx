import { ImageResponse } from 'next/og';

// iOS requests /apple-touch-icon.png on every page load; without this it 404s and
// home-screen bookmarks fall back to a page screenshot. 180px is the iOS target size.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // iOS masks the corners itself, so this stays square.
          background: '#111110',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F5F1E6',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 900,
            fontSize: 92,
            letterSpacing: '-0.08em',
            lineHeight: 1,
            transform: 'translate(-2px, -4px)',
          }}
        >
          JB
        </span>
      </div>
    ),
    { ...size },
  );
}
