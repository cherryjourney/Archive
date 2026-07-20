"use client";

import { useEffect, useRef } from "react";

const STATEMENTS = [
  { text: "它不是日程表。", emphasis: false },
  { text: "不是待办清单。", emphasis: false },
  { text: "不是又一个番茄钟。", emphasis: false },
  { text: "Archive 是你对自己时间的", emphasis: false },
  { text: "认真对待。", emphasis: true },
] as const;

export default function IntroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").default.context> | undefined;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const lines = lineRefs.current.filter(Boolean);

        lines.forEach((line, i) => {
          gsap.fromTo(
            line,
            {
              opacity: 0,
              y: 40 + i * 8,
              clipPath: "inset(0 0 100% 0)",
            },
            {
              opacity: 1,
              y: 0,
              clipPath: "inset(0 0 0% 0)",
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: line,
                start: "top 85%",
                end: "top 55%",
                scrub: 0.8,
              },
            }
          );
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
      id="intro"
      style={{
        position: "relative",
        padding: "clamp(80px, 14vw, 200px) clamp(20px, 6vw, 80px)",
        background:
          "linear-gradient(180deg, var(--space-deepest) 0%, var(--space-deep) 100%)",
        overflow: "hidden",
      }}
    >
      {/* Subtle horizontal rule at top */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "clamp(60px, 10vw, 120px)",
          height: 1,
          background: "var(--amber-ghost)",
          opacity: 0.4,
        }}
      />

      <div
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Label */}
        <div
          style={{
            fontFamily: "var(--font-heading), system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.2em",
            color: "var(--amber-muted)",
            textTransform: "uppercase",
            marginBottom: "clamp(40px, 6vw, 72px)",
          }}
        >
          关于 Archive
        </div>

        {/* Statement lines */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(8px, 1.2vw, 16px)",
            marginBottom: "clamp(48px, 8vw, 96px)",
            maxWidth: "clamp(500px, 55vw, 780px)",
          }}
        >
          {STATEMENTS.map(({ text, emphasis }, i) => (
            <div
              key={i}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              style={{
                fontFamily: emphasis
                  ? "var(--font-serif), 'Noto Serif SC', serif"
                  : "var(--font-body), system-ui, sans-serif",
                fontSize: emphasis
                  ? "clamp(28px, 4.5vw, 52px)"
                  : "clamp(22px, 3.5vw, 40px)",
                fontWeight: emphasis ? 700 : 400,
                color: emphasis ? "var(--amber)" : "var(--ink-primary)",
                lineHeight: emphasis ? 1.2 : 1.45,
                letterSpacing: emphasis ? "-0.01em" : "0",
                willChange: "opacity, transform",
              }}
            >
              {text}
            </div>
          ))}
        </div>

        {/* Supporting paragraph */}
        <div
          style={{
            maxWidth: 480,
            fontSize: "clamp(15px, 1.6vw, 17px)",
            color: "var(--ink-secondary)",
            lineHeight: 1.85,
          }}
        >
          <p style={{ margin: "0 0 16px" }}>
            19 个模块，覆盖从任务管理到学术追踪、出行清单到习惯养成的每一个日常切面。数据完全本地，不联网，不上传——你的时间是你自己的。
          </p>
          <p style={{ margin: 0 }}>
            适合研究生，也适合任何一个认真对待时间的人。
          </p>
        </div>
      </div>
    </section>
  );
}
