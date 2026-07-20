'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExternalLink } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const TECH_STACK = [
  ['桌面框架', 'Tauri 2 (Rust)'],
  ['前端', 'React 18 + TypeScript'],
  ['UI 库', 'Ant Design 5'],
  ['数据库', 'SQLite (本地)'],
  ['图表', 'ECharts 5'],
  ['状态管理', 'Zustand'],
  ['目标平台', 'Windows (x86_64-pc-windows-gnu)'],
];

export default function AboutPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  // Hero entrance
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.ab-kicker', { opacity: 0, y: 20, duration: 0.55, ease: 'power3.out' })
      .from('.ab-title', { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .from('.ab-hero-quote', { opacity: 0, y: 20, duration: 0.65, ease: 'power3.out' }, '-=0.5');
  }, { scope: heroRef });

  // Story sections — staggered scroll reveal
  useGSAP(() => {
    const blocks = gsap.utils.toArray<HTMLElement>('.ab-block');
    blocks.forEach((block) => {
      gsap.from(block, {
        opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: block, start: 'top 84%', once: true },
      });
    });
  }, { scope: pageRef });

  // Pull quotes — slightly different reveal
  useGSAP(() => {
    const quotes = gsap.utils.toArray<HTMLElement>('.ab-pullquote');
    quotes.forEach((q) => {
      gsap.from(q, {
        opacity: 0, scale: 0.96, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: q, start: 'top 88%', once: true },
      });
    });
  }, { scope: pageRef });

  return (
    <div ref={pageRef} style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* ── Hero ── */}
      <section
        ref={heroRef}
        style={{
          padding: '160px 28px 100px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 45% 40% at 60% 25%, rgba(90,130,230,0.04) 0%, transparent 55%),
            radial-gradient(ellipse 35% 30% at 35% 70%, rgba(201,168,92,0.03) 0%, transparent 55%)
          `,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto' }}>
          <div className="ab-kicker" style={{
            fontSize: 13, fontWeight: 500, color: 'var(--amber)',
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 28,
            fontFamily: 'var(--font-mono), monospace',
          }}>
            关于我们
          </div>

          <h1 className="ab-title" style={{
            fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 700,
            color: 'var(--text-primary)', margin: '0 0 36px',
            lineHeight: 1.12, letterSpacing: '-0.014em',
            fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC','SimSun',serif",
          }}>
            把认真度过的<br />每一天，都留下来
          </h1>

          <p className="ab-hero-quote" style={{
            fontSize: 'clamp(17px, 1.8vw, 21px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.75, margin: 0,
            maxWidth: 560,
          }}>
            这不是又一个 Todo 应用——这是为认真生活的人打造的时间伙伴。
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section style={{ padding: '0 28px 140px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* ── Origin Story ── */}
          <div className="ab-block" style={{ marginBottom: 120 }}>
            <div style={{
              fontSize: 13, fontWeight: 500,
              color: 'var(--amber-deep)',
              letterSpacing: '0.16em',
              marginBottom: 24,
              fontFamily: 'var(--font-mono), monospace',
            }}>
              01 · 起源
            </div>

            <p style={{
              fontSize: 18, color: 'var(--text-primary)',
              lineHeight: 1.85, margin: '0 0 28px',
            }}>
              读研期间，我们同时面对着科研、课程、生活三个维度的信息洪流。
              Paper 要读、实验要跑、课程作业要交——但翻开任何一个"通用"效率工具，
              都不够专注：它们要么太通用，要么依赖云端。
            </p>

            <p style={{
              fontSize: 18, color: 'var(--text-primary)',
              lineHeight: 1.85, margin: 0,
            }}>
              存迹把研究生的真实场景拆解为
              任务、时间线、论文、实验、生活记录——
              每个模块都为"学术人"设计，但每个认真生活的人都能使用。
            </p>

            {/* Pull quote */}
            <div className="ab-pullquote" style={{
              margin: '48px 0 0',
              padding: '36px 0',
              borderTop: '1px solid rgba(120,150,230,0.08)',
              borderBottom: '1px solid rgba(120,150,230,0.08)',
            }}>
              <p style={{
                fontSize: 'clamp(20px, 2.5vw, 28px)',
                fontWeight: 600,
                color: 'var(--amber)',
                lineHeight: 1.5,
                margin: 0,
                fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC','SimSun',serif",
              }}>
                "所有数据 100% 存在你本地。
                <br />没有云同步，没有账号系统，你的数据只属于你自己。"
              </p>
            </div>
          </div>

          {/* ── Tech Stack ── */}
          <div className="ab-block" style={{ marginBottom: 120 }}>
            <div style={{
              fontSize: 13, fontWeight: 500,
              color: 'var(--amber-deep)',
              letterSpacing: '0.16em',
              marginBottom: 32,
              fontFamily: 'var(--font-mono), monospace',
            }}>
              02 · 技术架构
            </div>

            <div style={{
              display: 'grid',
              gap: 1,
              backgroundColor: 'rgba(120,150,230,0.06)',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid rgba(120,150,230,0.06)',
            }}>
              {TECH_STACK.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 24px',
                    backgroundColor: 'rgba(14,22,41,0.7)',
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                    {label}
                  </span>
                  <span style={{
                    fontSize: 14, fontWeight: 500,
                    color: 'var(--text-primary)',
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono), monospace',
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Principles ── */}
          <div className="ab-block" style={{ marginBottom: 120 }}>
            <div style={{
              fontSize: 13, fontWeight: 500,
              color: 'var(--amber-deep)',
              letterSpacing: '0.16em',
              marginBottom: 32,
              fontFamily: 'var(--font-mono), monospace',
            }}>
              03 · 原则
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {[
                {
                  num: 'I',
                  title: '100% 本地',
                  desc: '所有数据存储在本地 SQLite 数据库。无需账号、无需联网、无需云服务。你的硬盘就是你的数据中心。',
                },
                {
                  num: 'II',
                  title: '隐私优先',
                  desc: '代码开源可审计。我们不会、也没有能力访问任何用户数据。隐私不是功能——是底线。',
                },
                {
                  num: 'III',
                  title: '开源透明',
                  desc: 'GitHub 开源，欢迎提交 Issues 和 Pull Requests。好的工具应该被看见、被改进、被信任。',
                },
              ].map((p) => (
                <div key={p.num} style={{
                  display: 'flex', gap: 28,
                  paddingLeft: 0,
                }}>
                  <span style={{
                    fontSize: 14, fontWeight: 600,
                    color: 'var(--amber)',
                    opacity: 0.5,
                    flexShrink: 0, width: 28,
                    fontFamily: 'var(--font-mono), monospace',
                    paddingTop: 2,
                  }}>
                    {p.num}
                  </span>
                  <div>
                    <h3 style={{
                      fontSize: 20, fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: '0 0 8px',
                      fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC',serif",
                    }}>
                      {p.title}
                    </h3>
                    <p style={{
                      fontSize: 16, color: 'var(--text-secondary)',
                      lineHeight: 1.7, margin: 0,
                    }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Contact ── */}
          <div className="ab-block" id="contact">
            <div style={{
              fontSize: 13, fontWeight: 500,
              color: 'var(--amber-deep)',
              letterSpacing: '0.16em',
              marginBottom: 24,
              fontFamily: 'var(--font-mono), monospace',
            }}>
              04 · 联系
            </div>

            <p style={{
              fontSize: 18, color: 'var(--text-secondary)',
              lineHeight: 1.75, margin: '0 0 40px',
            }}>
              欢迎通过 GitHub Issues 提交功能建议或 bug 报告。
              每一个反馈都会被认真对待。
            </p>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '15px 44px', fontSize: 16, fontWeight: 600,
                color: 'var(--bg-base)',
                background: 'var(--amber)',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'filter 0.2s ease',
                fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC',serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              <ExternalLink size={16} />
              GitHub →
            </a>
          </div>

        </div>
      </section>
    </div>
  );
}
