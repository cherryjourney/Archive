'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SCREENSHOTS = [
  { src: '/images/screenshot-1.png', alt: '仪表盘' },
  { src: '/images/screenshot-2.png', alt: '任务库' },
  { src: '/images/screenshot-3.png', alt: '日历' },
];

export default function ScreenshotCarousel() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(false);

  const goTo = (i: number) => {
    setFade(true);
    setTimeout(() => {
      setIndex(i);
      setFade(false);
    }, 150);
  };

  const prev = () => goTo(index === 0 ? SCREENSHOTS.length - 1 : index - 1);
  const next = () => goTo(index === SCREENSHOTS.length - 1 ? 0 : index + 1);

  return (
    <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto', padding: '0 48px' }}>
      <div style={{
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <img
          src={SCREENSHOTS[index].src}
          alt={SCREENSHOTS[index].alt}
          style={{
            width: '100%',
            borderRadius: 16,
            display: 'block',
            opacity: fade ? 0 : 1,
            transition: 'opacity 0.15s ease-in-out',
          }}
        />
      </div>

      <button
        onClick={prev}
        aria-label="上一张"
        style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 44, height: 44, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          zIndex: 2, transition: 'background 0.2s',
        }}
      >
        <ChevronLeft size={20} strokeWidth={1.5} color="#F5F5F7" />
      </button>
      <button
        onClick={next}
        aria-label="下一张"
        style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
          width: 44, height: 44, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          zIndex: 2, transition: 'background 0.2s',
        }}
      >
        <ChevronRight size={20} strokeWidth={1.5} color="#F5F5F7" />
      </button>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
        {SCREENSHOTS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`切换到第${i + 1}张截图`}
            style={{
              width: 12, height: 12, padding: 16, borderRadius: '50%',
              border: 'none', background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                width: 10, height: 10, borderRadius: '50%',
                background: i === index ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                transition: 'background 0.2s',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
