'use client';

import { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';
import { featureGroups } from '@/data/features';
import {
  LayoutDashboard, CheckSquare, CalendarDays, Calendar, Timer,
  GanttChart, Hourglass, Milestone, MapPin, ClipboardList, Package,
  FileText, FlaskConical, GraduationCap, Wallet, FileBarChart,
  Link, Tag, Bell,
} from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, CheckSquare, CalendarDays, Calendar, Timer,
  GanttChart, Hourglass, Milestone, MapPin, ClipboardList, Package,
  FileText, FlaskConical, GraduationCap, Wallet, FileBarChart,
  Link, Tag, Bell,
};

const GROUP_ACCENTS = [
  'rgba(201,168,92,0.06)',
  'rgba(120,150,230,0.04)',
  'rgba(201,168,92,0.04)',
  'rgba(120,150,230,0.05)',
];

export default function FeaturesPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const numeralRef = useRef<HTMLSpanElement>(null);
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(featureGroups.map((g) => g.id)),
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Counter animation for the big "20"
  useEffect(() => {
    const el = numeralRef.current;
    if (!el) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: 20,
      duration: 1.8,
      ease: 'power2.out',
      delay: 0.3,
      onUpdate: () => {
        el.textContent = String(Math.round(obj.val));
      },
    });
  }, []);

  // Hero entrance
  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.1 });
    tl.from('.feat-hero-kicker', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' })
      .from('.feat-hero-title', { opacity: 0, y: 32, duration: 0.7, ease: 'power3.out' }, '-=0.3')
      .from('.feat-hero-desc', { opacity: 0, y: 16, duration: 0.6, ease: 'power3.out' }, '-=0.4');
  }, { scope: heroRef });

  // Group sections — scroll reveal with varied directions
  useGSAP(() => {
    const groups = gsap.utils.toArray<HTMLElement>('.feat-chapter');
    groups.forEach((group, i) => {
      const isEven = i % 2 === 0;
      gsap.from(group, {
        opacity: 0,
        x: isEven ? -30 : 30,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: group,
          start: 'top 82%',
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
          padding: '160px 28px 100px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient depth layer */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 60% 50% at 70% 20%, rgba(90,130,230,0.05) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 30% 80%, rgba(201,168,92,0.04) 0%, transparent 55%)
          `,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1040, margin: '0 auto' }}>
          {/* Kicker */}
          <div className="feat-hero-kicker" style={{
            fontSize: 13, fontWeight: 500, color: 'var(--amber)',
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 20,
            fontFamily: 'var(--font-mono), monospace',
          }}>
            功能矩阵
          </div>

          {/* Main title block */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap' }}>
            <span
              ref={numeralRef}
              aria-hidden
              style={{
                fontSize: 'clamp(96px, 14vw, 168px)',
                fontWeight: 700,
                lineHeight: 0.78,
                color: 'var(--amber)',
                opacity: 0.12,
                fontFamily: "'Times New Roman', 'Songti SC', 'Source Han Serif SC', serif",
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              0
            </span>
            <div style={{ paddingBottom: 'clamp(12px, 2vw, 24px)' }}>
              <h1 className="feat-hero-title" style={{
                fontSize: 'clamp(36px, 5.5vw, 56px)', fontWeight: 700,
                color: 'var(--text-primary)', margin: 0,
                lineHeight: 1.14, letterSpacing: '-0.012em',
                fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC','SimSun',serif",
              }}>
                个模块<br />四个维度
              </h1>
            </div>
          </div>

          <p className="feat-hero-desc" style={{
            fontSize: 'clamp(16px, 1.7vw, 19px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7, margin: '28px 0 0',
            maxWidth: 520,
          }}>
            核心效率、时间规划、学术研究、生活工具。
            所有功能 100% 本地运行，无需联网。
          </p>
        </div>
      </section>

      {/* ── Feature Chapters ── */}
      <section style={{ padding: '0 28px 140px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          {featureGroups.map((group, gi) => {
            const isOpen = expanded.has(group.id);
            return (
              <div
                key={group.id}
                className="feat-chapter"
                style={{ marginBottom: gi < featureGroups.length - 1 ? 24 : 0 }}
              >
                {/* Chapter header */}
                <button
                  onClick={() => toggle(group.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '32px 0',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'inherit', textAlign: 'left',
                    borderBottom: '1px solid rgba(120,150,230,0.08)',
                    fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC',serif",
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 'clamp(24px, 3vw, 36px)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                    }}>
                      {group.name}
                    </span>
                    <span style={{
                      fontSize: 14,
                      color: 'var(--text-muted)',
                      fontWeight: 400,
                    }}>
                      {group.nameEn} · {group.features.length} 模块
                    </span>
                  </div>
                  <div style={{
                    width: 36, height: 36, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', borderRadius: '50%',
                    backgroundColor: isOpen ? 'rgba(201,168,92,0.1)' : 'rgba(120,150,230,0.04)',
                    color: 'var(--amber)',
                    transition: 'transform 0.35s ease, background-color 0.35s ease',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    flexShrink: 0,
                  }}>
                    <ChevronDown size={16} />
                  </div>
                </button>

                {/* Chapter body */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      display: 'grid',
                      gap: 10,
                      padding: '28px 0',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    }}>
                      {group.features.map((f, fi) => {
                        const Icon = ICON_MAP[f.icon];
                        return (
                          <div
                            key={f.id}
                            className="feat-item"
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 16,
                              padding: '22px 24px',
                              borderRadius: 8,
                              backgroundColor: GROUP_ACCENTS[gi],
                              border: '1px solid rgba(120,150,230,0.04)',
                              transition: 'border-color 0.25s ease, background-color 0.25s ease',
                              cursor: 'default',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(201,168,92,0.15)';
                              e.currentTarget.style.backgroundColor = GROUP_ACCENTS[gi].replace('0.06', '0.10').replace('0.04', '0.08').replace('0.05', '0.09');
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(120,150,230,0.04)';
                              e.currentTarget.style.backgroundColor = GROUP_ACCENTS[gi];
                            }}
                          >
                            {Icon && (
                              <div style={{
                                width: 38, height: 38, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', borderRadius: 8, flexShrink: 0,
                                backgroundColor: 'rgba(201,168,92,0.1)',
                                marginTop: 1,
                              }}>
                                <Icon size={18} color="var(--amber)" />
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                                <span style={{
                                  fontSize: 15, fontWeight: 600,
                                  color: 'var(--text-primary)',
                                }}>
                                  {f.name}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                  {f.nameEn}
                                </span>
                              </div>
                              <p style={{
                                fontSize: 14, color: 'var(--text-secondary)',
                                lineHeight: 1.6, margin: 0,
                              }}>
                                {f.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
