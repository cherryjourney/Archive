"use client";

import { useEffect, useRef } from "react";

interface Feature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  modules: string[];
  accent: string; // oklch value for the subtle background tint
}

const FEATURES: Feature[] = [
  {
    id: "morning",
    title: "晨间仪式",
    subtitle: "一天的开始，从清晰的意图出发",
    description:
      "打开 Archive，花五分钟回顾昨天的完成与今天的待办。不需要复杂的规划流程——写下今天最重要的事，然后去做。",
    modules: ["每日计划", "习惯追踪", "晨间清单"],
    accent: "oklch(0.12 0.02 60)",
  },
  {
    id: "research",
    title: "学术追踪",
    subtitle: "论文、会议、deadline，一处掌握",
    description:
      "从导师会议到论文进度，从投稿截止到实验计划——所有学术线紝始终清晰可见。再也不会忘记那个说了「下周看看」的 deadline。",
    modules: ["学术日历", "论文进度", "导师记录"],
    accent: "oklch(0.12 0.025 200)",
  },
  {
    id: "life",
    title: "生活管理",
    subtitle: "生活不止论文，但论文之外也需要管理",
    description:
      "出行清单、购物记录、健康打卡、财务笔记——研究生生活中那些不成体系的琐事，Archive 用同样的冷静帮它们找到位置。",
    modules: ["出行清单", "财务记录", "健康打卡"],
    accent: "oklch(0.13 0.02 140)",
  },
  {
    id: "night",
    title: "晚间回顾",
    subtitle: "关掉它之前，看看今天做了什么",
    description:
      "Archive 记录的不只是计划，更是完成。每晚花两分钟回顾——这比任何鸡汤都更能让你相信明天会更清晰。",
    modules: ["每日总结", "心情记录", "周报生成"],
    accent: "oklch(0.11 0.018 300)",
  },
];

export default function FeatureShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").default.context> | undefined;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const track = trackRef.current;
        const section = sectionRef.current;
        if (!track || !section) return;

        const panels = panelRefs.current.filter(Boolean);
        const panelCount = panels.length;

        /* ── Horizontal scroll tween (pinned section) ── */
        const scrollTween = gsap.to(track, {
          xPercent: () => -(panelCount - 1) * (100 / panelCount) * (panelCount / (panelCount - 1) * 0.85),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => `+=${window.innerWidth * (panelCount - 0.3)}`,
            invalidateOnRefresh: true,
          },
        });

        /* ── Panel-specific reveals ── */
        panels.forEach((panel, i) => {
          if (!panel) return;
          const title = titleRefs.current[i];
          const moduleTags = panel.querySelectorAll(".module-tag");
          const desc = panel.querySelector(".feature-desc");
          const subtitle = panel.querySelector(".feature-subtitle");

          // Stagger in elements as each panel scrolls into view
          const panelTl = gsap.timeline({
            scrollTrigger: {
              trigger: panel,
              containerAnimation: scrollTween,
              start: "left 70%",
              end: "left 30%",
              scrub: 0.6,
            },
          });

          if (subtitle) {
            panelTl.fromTo(
              subtitle,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.5 },
              0
            );
          }

          if (title) {
            panelTl.fromTo(
              title,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.6 },
              0.1
            );
          }

          if (desc) {
            panelTl.fromTo(
              desc,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.5 },
              0.25
            );
          }

          if (moduleTags.length) {
            panelTl.fromTo(
              moduleTags,
              { opacity: 0, y: 12 },
              {
                opacity: 1,
                y: 0,
                duration: 0.4,
                stagger: 0.08,
              },
              0.35
            );
          }
        });
      }, sectionRef);
    };

    init();

    return () => {
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      style={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Horizontal track */}
      <div
        ref={trackRef}
        style={{
          display: "flex",
          width: `${FEATURES.length * 100}vw`,
          height: "100vh",
        }}
      >
        {FEATURES.map((feature, i) => (
          <div
            key={feature.id}
            ref={(el) => {
              panelRefs.current[i] = el;
            }}
            style={{
              flex: "0 0 100vw",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Panel background accent */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: feature.accent,
                opacity: 0.3,
              }}
            />

            {/* Panel content */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                padding: "0 clamp(32px, 8vw, 120px)",
                maxWidth: 640,
                width: "100%",
              }}
            >
              {/* Panel number */}
              <div
                style={{
                  fontFamily: "var(--font-heading), system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  color: "var(--amber-muted)",
                  marginBottom: 20,
                  opacity: 0.7,
                }}
              >
                {String(i + 1).padStart(2, "0")} / {String(FEATURES.length).padStart(2, "0")}
              </div>

              {/* Subtitle */}
              <p
                className="feature-subtitle"
                style={{
                  fontFamily: "var(--font-serif), 'Noto Serif SC', serif",
                  fontSize: "clamp(16px, 2vw, 20px)",
                  color: "var(--amber-ghost)",
                  margin: "0 0 12px",
                  lineHeight: 1.6,
                }}
              >
                {feature.subtitle}
              </p>

              {/* Title */}
              <h2
                ref={(el) => {
                  titleRefs.current[i] = el;
                }}
                style={{
                  fontFamily: "var(--font-heading), system-ui, sans-serif",
                  fontSize: "clamp(32px, 5vw, 56px)",
                  fontWeight: 700,
                  color: "var(--ink-primary)",
                  letterSpacing: "-0.025em",
                  margin: "0 0 clamp(20px, 3vw, 32px)",
                  lineHeight: 1.1,
                }}
              >
                {feature.title}
              </h2>

              {/* Description */}
              <p
                className="feature-desc"
                style={{
                  fontSize: "clamp(15px, 1.6vw, 17px)",
                  color: "var(--ink-secondary)",
                  lineHeight: 1.8,
                  margin: "0 0 28px",
                  maxWidth: 520,
                }}
              >
                {feature.description}
              </p>

              {/* Module tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {feature.modules.map((mod) => (
                  <span
                    key={mod}
                    className="module-tag"
                    style={{
                      display: "inline-block",
                      padding: "6px 16px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--amber)",
                      background: "rgba(201,168,92,0.08)",
                      border: "1px solid rgba(201,168,92,0.12)",
                      fontFamily:
                        "var(--font-heading), system-ui, sans-serif",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>

            {/* Decorative index */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                right: "clamp(40px, 8vw, 120px)",
                top: "50%",
                transform: "translateY(-50%)",
                fontFamily: "var(--font-heading), system-ui, sans-serif",
                fontSize: "clamp(120px, 18vw, 240px)",
                fontWeight: 300,
                color: "var(--space-surface)",
                opacity: 0.25,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                zIndex: 1,
                userSelect: "none",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
