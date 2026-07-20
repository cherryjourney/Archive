'use client';

import { useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Download, Monitor, Apple, Terminal, ArrowRight } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const STEPS = [
  { title: '下载安装包', desc: '点击下载按钮，获取 Archive·存迹 Windows 安装程序（.exe, 8.2 MB）。' },
  { title: '运行安装', desc: '双击安装程序，按提示完成。WebView2 运行环境自动配置。' },
  { title: '首次启动', desc: '设置出生日期后即可开始使用——你的数据只属于你。' },
];

export default function DownloadPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);

  // Subtle pulse on the download button after page load
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const tl = gsap.timeline({ delay: 1.2 });
    tl.to(btn, {
      boxShadow: '0 0 48px rgba(201,168,92,0.25)',
      duration: 1.2,
      ease: 'power2.inOut',
    }).to(btn, {
      boxShadow: '0 0 16px rgba(201,168,92,0.08)',
      duration: 1.2,
      ease: 'power2.inOut',
    });
  }, []);

  // Hero entrance
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.dl-kicker', { opacity: 0, y: 20, duration: 0.55, ease: 'power3.out' })
      .from('.dl-title', { opacity: 0, y: 36, duration: 0.7, ease: 'power3.out' }, '-=0.25')
      .from('.dl-sub', { opacity: 0, y: 16, duration: 0.55, ease: 'power3.out' }, '-=0.4')
      .from('.dl-btn-area', { opacity: 0, y: 24, duration: 0.6, ease: 'power3.out' }, '-=0.3')
      .from('.dl-meta', { opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2');
  }, { scope: heroRef });

  // Steps — scroll reveal
  useGSAP(() => {
    const steps = gsap.utils.toArray<HTMLElement>('.dl-step');
    gsap.from(steps, {
      opacity: 0, y: 28, stagger: 0.12, duration: 0.65, ease: 'power3.out',
      scrollTrigger: { trigger: '.dl-steps-container', start: 'top 78%', once: true },
    });
  }, { scope: pageRef });

  // Platform cards + requirements
  useGSAP(() => {
    gsap.from('.dl-alt-platforms', {
      opacity: 0, y: 24, duration: 0.65, ease: 'power3.out',
      scrollTrigger: { trigger: '.dl-alt-platforms', start: 'top 88%', once: true },
    });
    gsap.from('.dl-req', {
      opacity: 0, y: 20, duration: 0.6, ease: 'power3.out',
      scrollTrigger: { trigger: '.dl-req', start: 'top 92%', once: true },
    });
  }, { scope: pageRef });

  return (
    <div ref={pageRef} style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* ── Hero ── */}
      <section
        ref={heroRef}
        style={{
          minHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
          padding: '120px 28px 80px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Ambient — a single warm focal point behind the download button */}
        <div aria-hidden="true" style={{
          position: 'absolute', pointerEvents: 'none',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(360px, 50vw, 640px)',
          height: 'clamp(360px, 50vw, 640px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,92,0.07) 0%, rgba(90,130,230,0.02) 35%, transparent 60%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
          {/* Kicker */}
          <div className="dl-kicker" style={{
            fontSize: 13, fontWeight: 500, color: 'var(--amber)',
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 28,
            fontFamily: 'var(--font-mono), monospace',
          }}>
            下载
          </div>

          {/* Title */}
          <h1 className="dl-title" style={{
            fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 700,
            color: 'var(--text-primary)', margin: '0 0 24px',
            lineHeight: 1.14, letterSpacing: '-0.012em',
            fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC','SimSun',serif",
          }}>
            下载存迹
          </h1>

          {/* Subtitle */}
          <p className="dl-sub" style={{
            fontSize: 'clamp(16px, 1.8vw, 20px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7, margin: '0 0 48px',
          }}>
            完全免费，100% 本地离线。<br />你的数据只属于你。
          </p>

          {/* Download button — the focal point */}
          <div className="dl-btn-area">
            <a
              ref={btnRef}
              href="/Archive-CunJi-installer-v5.0.1.exe"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                padding: '18px 56px', fontSize: 18, fontWeight: 600,
                color: 'var(--bg-base)',
                background: 'var(--amber)',
                borderRadius: 8,
                textDecoration: 'none',
                boxShadow: '0 0 16px rgba(201,168,92,0.08)',
                transition: 'box-shadow 0.6s ease, filter 0.2s ease',
                fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC',serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              <Download size={18} />
              下载 Windows 版
            </a>
          </div>

          {/* Meta */}
          <div className="dl-meta" style={{
            marginTop: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 20, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              V5.0.1
            </span>
            <span style={{ color: 'var(--text-muted)', opacity: 0.3 }}>·</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              8.2 MB
            </span>
            <span style={{ color: 'var(--text-muted)', opacity: 0.3 }}>·</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Windows 10+
            </span>
            <span style={{ color: 'var(--text-muted)', opacity: 0.3 }}>·</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              无需管理员权限
            </span>
          </div>
        </div>
      </section>

      {/* ── Install Steps ── */}
      <section style={{ padding: '0 28px 100px' }}>
        <div className="dl-steps-container" style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            textAlign: 'center', marginBottom: 56,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 500, color: 'var(--amber)',
              letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 16,
              fontFamily: 'var(--font-mono), monospace',
            }}>
              安装指南
            </div>
            <h2 style={{
              fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 600,
              color: 'var(--text-primary)', margin: 0,
              lineHeight: 1.22, letterSpacing: '-0.012em',
              fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC','SimSun',serif",
            }}>
              三步开始使用
            </h2>
          </div>

          {/* Horizontal steps on desktop, vertical on mobile */}
          <div style={{
            display: 'grid',
            gap: 'clamp(20px, 3vw, 32px)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            position: 'relative',
          }}>
            {/* Connecting line — desktop only */}
            <div
              className="hidden md:block"
              aria-hidden
              style={{
                position: 'absolute', top: 24, left: 'calc(16.7% + 24px)', right: 'calc(16.7% + 24px)',
                height: 1,
                background: 'linear-gradient(90deg, rgba(201,168,92,0.2), rgba(120,150,230,0.15), rgba(201,168,92,0.2))',
              }}
            />
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="dl-step"
                style={{
                  textAlign: 'center',
                  position: 'relative', zIndex: 1,
                }}
              >
                {/* Step number */}
                <div style={{
                  width: 48, height: 48, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', borderRadius: '50%',
                  margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, rgba(90,130,230,0.15), rgba(201,168,92,0.1))',
                  border: '1px solid rgba(120,150,230,0.12)',
                  color: 'var(--amber)',
                  fontSize: 18, fontWeight: 700,
                  fontFamily: 'var(--font-mono), monospace',
                }}>
                  {i + 1}
                </div>
                <h3 style={{
                  fontSize: 17, fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 8px',
                  fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC',serif",
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: 14, color: 'var(--text-secondary)',
                  lineHeight: 1.65, margin: 0,
                  maxWidth: 240, marginLeft: 'auto', marginRight: 'auto',
                }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Other Platforms + Requirements ── */}
      <section style={{ padding: '0 28px 120px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* Other platforms */}
          <div className="dl-alt-platforms" style={{
            display: 'grid', gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            marginBottom: 40,
          }}>
            {[
              { icon: Monitor, name: 'Windows', status: '已发布', available: true },
              { icon: Apple, name: 'macOS', status: '规划中', available: false },
              { icon: Terminal, name: 'Linux', status: '规划中', available: false },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '18px 20px', borderRadius: 8,
                    backgroundColor: p.available ? 'rgba(201,168,92,0.04)' : 'rgba(120,150,230,0.03)',
                    border: `1px solid ${p.available ? 'rgba(201,168,92,0.12)' : 'rgba(120,150,230,0.05)'}`,
                    opacity: p.available ? 1 : 0.5,
                  }}
                >
                  <Icon size={18} color={p.available ? 'var(--amber)' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 12, color: p.available ? 'var(--amber)' : 'var(--text-muted)' }}>
                      {p.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* System requirements */}
          <div className="dl-req" style={{
            padding: '24px 28px', borderRadius: 8,
            backgroundColor: 'rgba(14,22,41,0.5)',
            border: '1px solid rgba(120,150,230,0.06)',
          }}>
            <div style={{
              fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
              letterSpacing: '0.08em', marginBottom: 12,
            }}>
              系统要求
            </div>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '8px 28px',
            }}>
              {['Windows 10 或更高版本', '64 位处理器（x86_64）', 'WebView2 运行时（系统自带）', '无需管理员权限'].map((req) => (
                <span key={req} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {req}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
