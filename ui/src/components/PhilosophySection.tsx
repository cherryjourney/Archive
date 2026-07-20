"use client";

import { useEffect, useRef } from "react";

const PRINCIPLES = [
  {
    kanji: "静",
    reading: "silence",
    text: "不推送通知，不催促你打卡。Archive 相信，好的工具应该是你打开它，而不是它打开你。",
  },
  {
    kanji: "深",
    reading: "depth",
    text: "19 个模块不是功能的堆砌，而是研究生日常的完整剖面。每个模块的存在，都因为有人真的需要它。",
  },
  {
    kanji: "私",
    reading: "privacy",
    text: "数据完全本地存储，不联网，不上传。你的任务清单、你的心情记录、你的论文进度——只属于你。",
  },
  {
    kanji: "简",
    reading: "simplicity",
    text: "界面的每一像素都经过斟酌。没有多余的按钮，没有装饰性的动画。在这里，克制就是尊重。",
  },
];

export default function PhilosophySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const principleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").default.context> | undefined;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const principles = principleRefs.current.filter(Boolean);

        principles.forEach((el) => {
          if (!el) return;
          const kanji = el.querySelector(".principle-kanji");
          const text = el.querySelector(".principle-text");
          const reading = el.querySelector(".principle-reading");

          // Kanji scales in
          if (kanji) {
            gsap.fromTo(
              kanji,
              { opacity: 0, scale: 0.8 },
              {
                opacity: 1,
                scale: 1,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: el,
                  start: "top 75%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          // Reading label fades
          if (reading) {
            gsap.fromTo(
              reading,
              { opacity: 0, y: 10 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: el,
                  start: "top 70%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }

          // Text reveal with clip
          if (text) {
            gsap.fromTo(
              text,
              { opacity: 0, y: 24 },
              {
                opacity: 1,
                y: 0,
                duration: 0.7,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: el,
                  start: "top 65%",
                  toggleActions: "play none none reverse",
                },
              }
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
      id="philosophy"
      style={{
        position: "relative",
        padding: "clamp(100px, 16vw, 200px) clamp(20px, 6vw, 80px)",
        background:
          "linear-gradient(180deg, var(--space-deep) 0%, var(--space-deepest) 100%)",
      }}
    >
      {/* Section header */}
      <div
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto clamp(60px, 10vw, 120px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading), system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.2em",
            color: "var(--amber-muted)",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          设计理念
        </div>
        <h2
          style={{
            fontFamily: "var(--font-serif), 'Noto Serif SC', serif",
            fontSize: "clamp(28px, 4.5vw, 48px)",
            fontWeight: 700,
            color: "var(--ink-primary)",
            margin: 0,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}
        >
          四个字，说清楚我们在做什么
        </h2>
      </div>

      {/* Principles grid */}
      <div
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "clamp(32px, 5vw, 64px)",
        }}
      >
        {PRINCIPLES.map((p, i) => (
          <div
            key={p.kanji}
            ref={(el) => {
              principleRefs.current[i] = el;
            }}
            style={{
              padding: "clamp(24px, 3vw, 40px)",
              borderRadius: "var(--radius-md)",
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(255,255,255,0.04)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Kanji */}
            <div
              className="principle-kanji"
              style={{
                fontFamily: "var(--font-serif), 'Noto Serif SC', serif",
                fontSize: "clamp(56px, 8vw, 88px)",
                fontWeight: 700,
                color: "var(--amber)",
                lineHeight: 1,
                marginBottom: 8,
                opacity: 0.15,
                position: "absolute",
                top: "clamp(16px, 2vw, 28px)",
                right: "clamp(16px, 2vw, 28px)",
                userSelect: "none",
                willChange: "opacity, transform",
              }}
            >
              {p.kanji}
            </div>

            {/* Reading */}
            <div
              className="principle-reading"
              style={{
                fontFamily: "var(--font-heading), system-ui, sans-serif",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.15em",
                color: "var(--amber-muted)",
                textTransform: "uppercase",
                marginBottom: 16,
                willChange: "opacity, transform",
              }}
            >
              {p.reading}
            </div>

            {/* Text */}
            <p
              className="principle-text"
              style={{
                fontSize: "clamp(14px, 1.5vw, 16px)",
                color: "var(--ink-secondary)",
                lineHeight: 1.85,
                margin: 0,
                position: "relative",
                zIndex: 1,
                willChange: "opacity, transform",
              }}
            >
              {p.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
