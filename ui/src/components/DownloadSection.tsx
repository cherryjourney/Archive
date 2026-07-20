"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function DownloadSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").default.context> | undefined;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        if (!contentRef.current) return;

        gsap.fromTo(
          contentRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          }
        );
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
      id="download"
      style={{
        position: "relative",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "clamp(80px, 12vw, 160px) clamp(20px, 4vw, 48px)",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "clamp(500px, 70vw, 900px)",
          height: "clamp(500px, 70vw, 900px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,168,92,0.06) 0%, transparent 60%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div ref={contentRef} style={{ position: "relative", zIndex: 2 }}>
        {/* Serif statement */}
        <p
          style={{
            fontFamily: "var(--font-serif), 'Noto Serif SC', serif",
            fontSize: "clamp(22px, 3.5vw, 36px)",
            fontWeight: 400,
            color: "var(--amber-ghost)",
            margin: "0 0 clamp(20px, 3vw, 36px)",
            lineHeight: 1.5,
            maxWidth: 500,
          }}
        >
          从今天开始，
          <br />
          认真对待你的每一寸时间
        </p>

        {/* Download button */}
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/Archive·CunJi_installer_v5.0.1.exe"
            download
            style={{
              display: "inline-block",
              padding: "clamp(14px, 2vw, 18px) clamp(36px, 5vw, 64px)",
              fontFamily: "var(--font-heading), system-ui, sans-serif",
              fontSize: "clamp(15px, 1.6vw, 17px)",
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: "var(--space-deepest)",
              background: "var(--amber)",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              transition:
                "transform 0.2s, box-shadow 0.2s, background 0.2s",
              boxShadow: "0 0 48px rgba(201,168,92,0.18)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--amber-glow)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 4px 56px rgba(201,168,92,0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--amber)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 0 48px rgba(201,168,92,0.18)";
            }}
          >
            下载 Archive · 存迹
          </Link>
        </div>

        {/* Meta */}
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-faint)",
            lineHeight: 1.8,
          }}
        >
          <div>V5.1 · Windows 10/11 · 约 82MB</div>
          <div style={{ marginTop: 4 }}>免费使用，永久免费</div>
        </div>
      </div>
    </section>
  );
}
