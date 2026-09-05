import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Closed Test Pro AAB Signer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(180deg, #121212 0%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24 }}>
          Closed Test Pro
        </div>
        <div style={{ color: 'white', fontSize: 72, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, marginBottom: 20 }}>
          AAB Signer
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 28, maxWidth: 720, lineHeight: 1.35 }}>
          Sign Android App Bundles for Google Play — free and open source.
        </div>
        <div style={{ position: 'absolute', bottom: 48, left: 80, color: 'rgba(255,255,255,0.35)', fontSize: 20 }}>
          aab.closedtestpro.com
        </div>
      </div>
    ),
    { ...size }
  );
}
