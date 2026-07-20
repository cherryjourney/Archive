'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ScreenshotCarousel from '@/components/ScreenshotCarousel';
import Footer from '@/components/Footer';
import { SCENARIOS } from '@/lib/data';

const fadeUp = {
  initial: { opacity: 0, y: 36 },
  animate: { opacity: 1, y: 0 },
};

const spring = { type: 'spring' as const, stiffness: 180, damping: 22 };

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(0);
  const lockedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sections = [...container.querySelectorAll<HTMLElement>('section')];

    const scrollTo = (index: number) => {
      if (index < 0 || index >= sections.length || lockedRef.current) return;
      lockedRef.current = true;
      currentRef.current = index;
      sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { lockedRef.current = false; }, 1000);
    };

    const handleWheel = (e: WheelEvent) => {
      if (lockedRef.current || Math.abs(e.deltaY) < 20) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const next = currentRef.current + dir;

      // Allow free scroll past the last section (to footer) or above the first
      if (next < 0 || next >= sections.length) return;

      e.preventDefault();
      scrollTo(next);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (lockedRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        scrollTo(currentRef.current + dir);
      }
    };

    // Touch swipe support
    let touchStart = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (lockedRef.current) return;
      const delta = touchStart - e.changedTouches[0].clientY;
      if (Math.abs(delta) < 50) return;
      const dir = delta > 0 ? 1 : -1;
      scrollTo(currentRef.current + dir);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKey);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <>
      <style>{`html, body { overflow: hidden; }`}</style>
      <div
        ref={containerRef}
        style={{
          height: '100vh',
          overflowY: 'auto',
          overscrollBehavior: 'none',
          background: 'linear-gradient(170deg, #0b101e 0%, #05080f 35%, #000000 70%, #0a0c14 100%)',
        }}
      >
        {/* ===== 1. Hero（渐变暗色，100vh）===== */}
        <section style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          textAlign: 'center',
          padding: '120px 32px',
          color: '#F5F5F7',
          overflow: 'hidden',
        }}>
          {/* Radial glow */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,113,227,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Grain texture */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.02,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '256px 256px',
            pointerEvents: 'none',
          }} />

          {/* Logo */}
          <motion.img
            src="/logo.svg"
            alt="Archive·存迹"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring, delay: 0.05 }}
            style={{
              width: 80, height: 80,
              marginBottom: 44,
              position: 'relative', zIndex: 1,
              filter: 'drop-shadow(0 0 40px rgba(0,113,227,0.3))',
            }}
          />

          {/* Title */}
          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            style={{
              fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 700,
              margin: '0 0 12px',
              fontFamily: 'var(--font-heading), sans-serif',
              color: '#F5F5F7',
              letterSpacing: '-2px', lineHeight: 1.04,
              position: 'relative', zIndex: 1,
              maxWidth: 900,
            }}
          >
            Archive · 存迹
          </motion.h1>

          {/* Subtitle — poetic */}
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            style={{
              fontSize: 'clamp(20px, 2.5vw, 28px)',
              color: 'rgba(245,245,247,0.6)',
              margin: '0 0 16px',
              position: 'relative', zIndex: 1,
              lineHeight: 1.5,
            }}
          >
            每一段认真度过的晨昏，<br />皆在此间。
          </motion.p>

          {/* Tagline — descriptive */}
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.38 }}
            style={{
              fontSize: 'clamp(16px, 1.8vw, 19px)',
              color: 'rgba(245,245,247,0.38)',
              margin: '0 0 56px',
              position: 'relative', zIndex: 1,
              lineHeight: 1.6,
            }}
          >
            为研究生而生的个人效率桌面应用。任务、时间线、论文、生活，一处存迹。
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...spring, delay: 0.5 }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <Link
              href="/download"
              style={{
                padding: '14px 44px', fontSize: 16, fontWeight: 600,
                color: 'white', background: 'linear-gradient(135deg, #0071E3, #0077ED)',
                borderRadius: 10, textDecoration: 'none',
                boxShadow: '0 0 32px rgba(0,113,227,0.25)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'inline-block',
              }}
            >
              免费下载
            </Link>
          </motion.div>

          {/* Version */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            style={{
              marginTop: 28, fontSize: 13,
              color: 'rgba(245,245,247,0.25)',
              fontFamily: 'var(--font-mono), monospace',
              position: 'relative', zIndex: 1,
            }}
          >
            V5.1 · Windows 10/11
          </motion.div>
        </section>

        {/* ===== 2-5. Four Scenarios（左右交替布局）===== */}
        {SCENARIOS.map((scenario, i) => {
          const imageRight = scenario.imagePosition === 'right';
          return (
            <motion.section
              key={scenario.id}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                minHeight: '100vh',
                display: 'flex', alignItems: 'center',
                padding: '80px 40px',
                color: '#F5F5F7',
              }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'clamp(40px, 6vw, 80px)',
                alignItems: 'center',
                maxWidth: 1200,
                margin: '0 auto',
                width: '100%',
              }}>
                {/* Text column */}
                <div style={{
                  order: imageRight ? 0 : 1,
                  textAlign: imageRight ? 'left' : 'left',
                  paddingRight: imageRight ? 'clamp(20px, 4vw, 48px)' : 0,
                  paddingLeft: imageRight ? 0 : 'clamp(20px, 4vw, 48px)',
                }}>
                  {/* Scenario number */}
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    color: 'rgba(0,113,227,0.6)',
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    marginBottom: 16,
                    fontFamily: 'var(--font-mono), monospace',
                  }}>
                    {scenario.number} · {scenario.id}
                  </div>

                  <h2 style={{
                    fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 600,
                    color: '#F5F5F7', margin: '0 0 20px',
                    fontFamily: 'var(--font-heading), sans-serif',
                    letterSpacing: '-0.5px', lineHeight: 1.15,
                  }}>
                    {scenario.title}
                  </h2>

                  <p style={{
                    fontSize: 'clamp(16px, 1.8vw, 20px)',
                    color: 'rgba(201, 168, 92, 0.6)',
                    margin: '0 0 24px',
                    lineHeight: 1.65,
                    fontStyle: 'italic',
                  }}>
                    &ldquo;{scenario.quote}&rdquo;
                  </p>

                  <p style={{
                    fontSize: 'clamp(15px, 1.6vw, 17px)',
                    color: 'rgba(245,245,247,0.45)',
                    margin: '0 0 28px',
                    lineHeight: 1.75,
                    maxWidth: 480,
                  }}>
                    {scenario.description}
                  </p>

                  <div style={{
                    display: 'flex', flexWrap: 'wrap',
                    gap: '8px 12px', marginBottom: 36,
                  }}>
                    {scenario.moduleNames.map((name) => (
                      <span key={name} style={{
                        fontSize: 14, fontWeight: 500,
                        color: 'rgba(120, 150, 230, 0.8)',
                        background: 'rgba(120, 150, 230, 0.08)',
                        padding: '6px 16px', borderRadius: 9999,
                      }}>
                        {name}
                      </span>
                    ))}
                  </div>

                  <div>
                    <a
                      href="/features"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        fontSize: 15, fontWeight: 500,
                        color: 'rgba(0,113,227,0.7)',
                        textDecoration: 'none',
                        transition: 'color 0.15s',
                      }}
                    >
                      查看全部功能 <span style={{ fontSize: 14 }}>→</span>
                    </a>
                  </div>
                </div>

                {/* Image column */}
                <div style={{
                  order: imageRight ? 1 : 0,
                }}>
                  <div style={{
                    width: '100%', aspectRatio: '16/10',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(245,245,247,0.2)', fontSize: 15,
                  }}>
                    [ 界面截图 ]
                  </div>
                </div>
              </div>
            </motion.section>
          );
        })}

        {/* ===== 7. Screenshots（暗色 #000）===== */}
        <section style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-start',
          padding: '120px 32px 80px',
          color: '#F5F5F7',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 72 }}
          >
            <h2 style={{
              fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 600, margin: 0,
              fontFamily: 'var(--font-heading), sans-serif',
              color: '#F5F5F7', letterSpacing: '-0.5px',
            }}>
              界面预览
            </h2>
            <p style={{
              marginTop: 16, fontSize: 'clamp(17px, 2vw, 19px)',
              color: 'rgba(245,245,247,0.45)',
            }}>
              真实使用场景截图
            </p>
          </motion.div>
          <ScreenshotCarousel />
        </section>

        {/* ===== 8. CTA（暗色 #000）===== */}
        <section style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '120px 32px 160px',
          textAlign: 'center',
          color: '#F5F5F7',
        }}>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              fontSize: 'clamp(20px, 2.5vw, 26px)',
              color: 'rgba(245,245,247,0.45)',
              margin: '0 auto 44px',
              maxWidth: 500,
              lineHeight: 1.5,
              fontFamily: 'var(--font-body), sans-serif',
            }}
          >
            从今天开始，记录每一次认真的晨昏
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/download"
              style={{
                padding: '15px 52px', fontSize: 17, fontWeight: 600,
                color: 'white', background: 'linear-gradient(135deg, #0071E3, #0077ED)',
                borderRadius: 10, textDecoration: 'none',
                display: 'inline-block',
                boxShadow: '0 0 40px rgba(0,113,227,0.3)',
                transition: 'transform 0.2s',
              }}
            >
              免费下载
            </Link>
          </motion.div>
          <div style={{
            marginTop: 24, fontSize: 13,
            color: 'rgba(245,245,247,0.2)',
            fontFamily: 'var(--font-mono), monospace',
          }}>
            V5.1 · Windows 10/11 · 免费
          </div>
        </section>

        {/* Footer — flows naturally after CTA */}
        <Footer />
      </div>
    </>
  );
}
