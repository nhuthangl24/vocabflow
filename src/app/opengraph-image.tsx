import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
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
          backgroundColor: '#030712',
          backgroundImage: 'radial-gradient(circle at 50% -20%, #4f46e5 0%, #1e1b4b 40%, #030712 100%)',
          color: 'white',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Glow effect in background */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '200px',
            background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.4) 0%, rgba(0,0,0,0) 70%)',
            zIndex: 0,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div
            style={{
              fontSize: '150px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.06em',
              textShadow: '0 10px 40px rgba(99, 102, 241, 0.8)',
            }}
          >
            LUMINA
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: '44px',
            fontWeight: 500,
            marginTop: '40px',
            color: '#cbd5e1',
            textAlign: 'center',
            maxWidth: '950px',
            lineHeight: 1.5,
            zIndex: 10,
            letterSpacing: '-0.01em',
          }}
        >
          Khám phá và học từ vựng, ngữ pháp từ bất kỳ video YouTube nào với sức mạnh của AI.
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '70px',
            padding: '18px 48px',
            background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
            borderRadius: '100px',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            color: '#c4b5fd',
            fontSize: '28px',
            fontWeight: 600,
            zIndex: 10,
            boxShadow: '0 8px 32px rgba(79, 70, 229, 0.2)',
          }}
        >
          luminastudy.site
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
