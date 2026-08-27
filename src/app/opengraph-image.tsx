import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Lumina - Học từ vựng qua Video';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)',
          color: 'white',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '140px', fontWeight: 900, color: '#e0e7ff', letterSpacing: '-0.05em' }}>
            LUMINA
          </div>
        </div>
        <div style={{ fontSize: '48px', fontWeight: 600, marginTop: '50px', color: '#94a3b8', textAlign: 'center', maxWidth: '900px', lineHeight: 1.4 }}>
          Khám phá và học từ vựng, ngữ pháp từ bất kỳ video YouTube nào với AI.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '60px', padding: '16px 32px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '100px', border: '2px solid rgba(99, 102, 241, 0.5)', color: '#818cf8', fontSize: '32px', fontWeight: 700 }}>
          lumina-vocab.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
