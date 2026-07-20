'use client';

import { useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { versions } from '@/data/versions';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const isMajor = (v: string) => /^V\d+\.0(?:\.0)?$/.test(v);

export default function ChangelogPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Count major versions for the hero stat
  const majorCount = versions.filter((v) => isMajor(v.version)).length;

  // Hero entrance
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.cl-kicker', { opacity: 0, y: 20, duration: 0.55, ease: 'power3.out' })
      .from('.cl-title', { opacity: 0, y: 36, duration: 0.7, ease: 'power3.out' }, '-=0.25')
      .from('.cl-sub', { opacity: 0, y: 16, duration: 0.55, ease: 'power3.out' }, '-=0.4');
  }, { scope: heroRef });

  // Timeline entries — staggered scroll reveal
  useGSAP(() => {
    const entries = gsap.utils.toArray<HTMLElement>('.cl-entry');
    entries.forEach((entry, i) => {
      const major = isMajor(versions[i]?.version ?? '');
      gsap.from(entry, {
        opacity: 0,
        x: major ? 0 : (i % 2 === 0 ? -20 : 20),
        y: major ? 36 : 20,
        duration: major ? 0.75 : 0.5,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: entry,
          start: major ? 'top 88%' : 'top 92%',
          once: true,
        },
      });
    });
  }, { scope: pageRef });

  return (
    <div ref={pageRef} style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* ── Hero ── */}
      <section
        ref={heroRef}
        style={{
          padding: '160px 28px 80px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 50% 50% at 50% 35%, rgba(90,130,230,0.04) 0%, transparent 55%),
            radial-gradient(ellipse 30% 30% at 50% 75%, rgba(201,168,92,0.03) 0%, transparent 55%)
          `,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <div className="cl-kicker" style={{
            fontSize: 13, fontWeight: 500, color: 'var(--amber)',
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 24,
            fontFamily: 'var(--font-mono), monospace',
          }}>
            更新日志
          </div>

          {/* Title with large version count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span aria-hidden style={{
              fontSize: 'clamp(64px, 10vw, 96px)',
              fontWeight: 700,
              color: 'var(--amber)',
              opacity: 0.1,
              lineHeight: 1,
              fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC',serif",
            }}>
              {versions.length}
            </span>
            <h1 className="cl-title" style={{
              fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700,
              color: 'var(--text-primary)', margin: 0,
              lineHeight: 1.18, letterSpacing: '-0.012em',
              fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC','SimSun',serif",
            }}>
              迭代印记
            </h1>
          </div>

          <p className="cl-sub" style={{
            fontSize: 'clamp(16px, 1.7vw, 19px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7, margin: '24px 0 0',
          }}>
            {versions.length} 个版本，{majorCount} 次主版本迭代。
            <br />从 V1.0 到 V5.0.1，每一次迭代都让存迹更完善。
          </p>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section style={{ padding: '0 28px 140px' }}>
        <div ref={timelineRef} style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>

          {/* Spine line */}
          <div aria-hidden style={{
            position: 'absolute', left: 15, top: 0, bottom: 0, width: 1,
            background: 'linear-gradient(180deg, rgba(120,150,230,0.12) 0%, rgba(201,168,92,0.08) 50%, rgba(120,150,230,0.04) 100%)',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {versions.map((v, i) => {
              const major = isMajor(v.version);
              return (
                <div
                  key={v.version}
                  className="cl-entry"
                  style={{
                    display: 'flex', gap: 28,
                    paddingTop: i === 0 ? 0 : (major ? 56 : 28),
                    paddingBottom: i === versions.length - 1 ? 0 : (major ? 28 : 0),
                  }}
                >
                  {/* Node on the spine */}
                  <div style={{
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative', zIndex: 1,
                  }}>
                    <div style={{
                      width: major ? 16 : 10,
                      height: major ? 16 : 10,
                      borderRadius: '50%',
                      marginTop: major ? 6 : 8,
                      backgroundColor: major ? 'var(--amber)' : 'var(--amber-deep)',
                      boxShadow: major
                        ? '0 0 16px rgba(201,168,92,0.35), 0 0 4px rgba(201,168,92,0.2)'
                        : '0 0 6px rgba(168,133,90,0.2)',
                      transition: 'box-shadow 0.6s ease',
                    }} />
                  </div>

                  {/* Content */}
                  <div style={{
                    flex: 1,
                    paddingBottom: major ? 4 : 0,
                  }}>
                    {/* Version header row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      marginBottom: major ? 14 : 8,
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        fontSize: major ? 15 : 13,
                        fontWeight: major ? 700 : 500,
                        color: 'var(--amber)',
                        fontFamily: 'var(--font-mono), monospace',
                        letterSpacing: '0.04em',
                      }}>
                        {v.version}
                      </span>

                      <span style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        opacity: major ? 0.7 : 0.5,
                      }}>
                        {v.date}
                      </span>

                      {major && (
                        <span style={{
                          fontSize: 11,
                          color: 'var(--amber-deep)',
                          letterSpacing: '0.12em',
                          fontFamily: 'var(--font-mono), monospace',
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: 'rgba(201,168,92,0.06)',
                          border: '1px solid rgba(201,168,92,0.1)',
                        }}>
                          主版本
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    <p style={{
                      fontSize: major ? 17 : 14,
                      fontWeight: major ? 500 : 400,
                      color: 'var(--text-primary)',
                      margin: `0 0 ${major ? 14 : 8}px`,
                      lineHeight: 1.6,
                    }}>
                      {v.summary}
                    </p>

                    {/* Changes */}
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 5,
                      paddingLeft: major ? 0 : 2,
                    }}>
                      {v.changes.map((change, ci) => (
                        <div
                          key={ci}
                          style={{
                            fontSize: 14,
                            color: major ? 'var(--text-secondary)' : 'var(--text-muted)',
                            paddingLeft: 18, position: 'relative',
                            lineHeight: 1.6,
                          }}
                        >
                          <span style={{
                            position: 'absolute', left: 0, top: 0,
                            color: major ? 'var(--amber)' : 'var(--amber-deep)',
                            opacity: major ? 1 : 0.6,
                          }}>
                            ·
                          </span>
                          {change}
                        </div>
                      ))}
                    </div>

                    {/* Subtle divider between major versions */}
                    {major && i < versions.length - 1 && (
                      <div style={{
                        marginTop: 32,
                        height: 1,
                        background: 'linear-gradient(90deg, rgba(201,168,92,0.1), transparent)',
                      }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* End marker */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            marginTop: 40, paddingLeft: 43,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: 'var(--amber)',
              opacity: 0.25,
            }} />
            <span style={{
              fontSize: 12, color: 'var(--text-muted)',
              opacity: 0.4, fontStyle: 'italic',
            }}>
              持续迭代中...
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
