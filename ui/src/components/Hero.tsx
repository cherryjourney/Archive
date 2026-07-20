"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").default.context> | undefined;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        /* ── Entrance sequence ── */
        const tl = gsap.timeline({ delay: 0.3 });

        // Vignette fades in first
        tl.fromTo(
          vignetteRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 1.2, ease: "power2.out" },
          0
        );

        // Orb drifts into view
        tl.fromTo(
          orbRef.current,
          { opacity: 0, scale: 0.6, y: 40 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 2,
            ease: "power3.out",
          },
          0.1
        );

        // Title characters stagger in
        if (titleRef.current) {
          const chars = titleRef.current.querySelectorAll(".char");
          tl.fromTo(
            chars,
            { opacity: 0, y: 60, rotateX: -30 },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 0.9,
              stagger: 0.04,
              ease: "power3.out",
            },
            0.4
          );
        }

        // Subtitle
        tl.fromTo(
          subtitleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          1.0
        );

        // Tagline
        tl.fromTo(
          taglineRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
          1.2
        );

        // CTA
        tl.fromTo(
          ctaRef.current,
          { opacity: 0, y: 20, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out" },
          1.4
        );

        /* ── Scroll-driven parallax & fade ── */
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => {
            const p = self.progress;

            // Title drifts up and fades
            gsap.set(titleRef.current, {
              y: -80 * p,
              opacity: 1 - p * 1.2,
            });

            // Subtitle fades faster
            gsap.set(subtitleRef.current, {
              y: -40 * p,
              opacity: 1 - p * 1.8,
            });

            // Tagline fades fastest
            gsap.set(taglineRef.current, {
              opacity: 1 - p * 2.2,
            });

            // CTA fades
            gsap.set(ctaRef.current, {
              opacity: 1 - p * 1.5,
            });

            // Orb scales down slowly
            gsap.set(orbRef.current, {
              scale: 1 - p * 0.15,
              y: p * 20,
            });
          },
        });
      }, sectionRef);
    };

    init();

    return () => {
      ctx?.revert();
    };
  }, []);

  /* Split title into individual character spans for stagger animation */
  const titleText = "Archive · 存迹";
  const titleChars = titleText.split("").map((char, i) => (
    <span
      key={i}
      className="char"
      style={{
        display: "inline-block",
        whiteSpace: char === " " ? "pre" : undefined,
        willChange: "opacity, transform",
      }}
    >
      {char}
    </span>
  ));

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "120px clamp(20px, 4vw, 48px) 80px",
        overflow: "hidden",
      }}
    >
      {/* ── Ambient orb ── */}
      <div
        ref={orbRef}
        aria-hidden
        style={{
          position: "absolute",
          top: "18%",
          left: "50%",
          width: "clamp(400px, 60vw, 800px)",
          height: "clamp(400px, 60vw, 800px)",
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,168,92,0.08) 0%, rgba(201,168,92,0.02) 40%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          willChange: "opacity, transform",
        }}
      />

      {/* ── Vignette ── */}
      <div
        ref={vignetteRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, var(--space-deepest) 100%)",
          pointerEvents: "none",
          opacity: 0,
        }}
      />

      {/* ── Grain ── */}
      <div
        ref={grainRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
          pointerEvents: "none",
        }}
      />

      {/* ── Logo ── */}
      <img
        src="/logo.svg"
        alt="Archive·存迹"
        width={64}
        height={64}
        style={{
          marginBottom: "clamp(28px, 4vw, 44px)",
          position: "relative",
          zIndex: 2,
          filter: "drop-shadow(0 0 32px rgba(201,168,92,0.2))",
          opacity: 0,
        }}
        className="reveal-item"
      />
      {/* Fade logo in via simple CSS for reduced-motion safety */}
      <style>{`.reveal-item { animation: fadeInUp 1s 0.2s both } @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* ── Title ── */}
      <h1
        ref={titleRef}
        style={{
          fontFamily: "var(--font-heading), system-ui, sans-serif",
          fontSize: "clamp(42px, 7.5vw, 84px)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--ink-primary)",
          margin: "0 0 clamp(16px, 2vw, 24px)",
          position: "relative",
          zIndex: 2,
          perspective: "600px",
          lineHeight: 1.08,
          willChange: "transform, opacity",
        }}
      >
        {titleChars}
      </h1>

      {/* ── Subtitle (poetic, serif) ── */}
      <p
        ref={subtitleRef}
        style={{
          fontFamily: "var(--font-serif), 'Noto Serif SC', serif",
          fontSize: "clamp(18px, 2.8vw, 28px)",
          fontWeight: 400,
          color: "var(--amber-ghost)",
          margin: "0 0 12px",
          position: "relative",
          zIndex: 2,
          lineHeight: 1.6,
          letterSpacing: "0.02em",
          willChange: "transform, opacity",
        }}
      >
        每一段认真度过的晨昏，皆在此间
      </p>

      {/* ── Tagline (descriptive) ── */}
      <p
        ref={taglineRef}
        style={{
          fontSize: "clamp(14px, 1.5vw, 17px)",
          color: "var(--ink-tertiary)",
          margin: "0 0 clamp(36px, 5vw, 56px)",
          position: "relative",
          zIndex: 2,
          lineHeight: 1.7,
          maxWidth: 420,
          willChange: "opacity",
        }}
      >
        为研究生而生的个人效率桌面应用
        <br />
        任务、时间线、论文、生活，一处存迹
      </p>

      {/* ── CTA ── */}
      <div ref={ctaRef} style={{ position: "relative", zIndex: 2 }}>
        <Link
          href="#download"
          style={{
            display: "inline-block",
            padding: "14px clamp(32px, 4vw, 48px)",
            fontFamily: "var(--font-heading), system-ui, sans-serif",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: "var(--space-deepest)",
            background: "var(--amber)",
            borderRadius: "var(--radius-sm)",
            textDecoration: "none",
            transition: "transform 0.2s, box-shadow 0.2s, background 0.2s",
            boxShadow: "0 0 40px rgba(201,168,92,0.15)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--amber-glow)";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 4px 48px rgba(201,168,92,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--amber)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 0 40px rgba(201,168,92,0.15)";
          }}
        >
          免费下载
        </Link>
        <div
          style={{
            marginTop: 20,
            fontSize: 12,
            color: "var(--ink-faint)",
            fontFamily: "var(--font-heading), monospace",
            letterSpacing: "0.08em",
          }}
        >
          V5.1 · Windows 10/11
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.12em",
            fontFamily: "var(--font-heading), system-ui, sans-serif",
          }}
        >
          SCROLL
        </span>
        <div
          style={{
            width: 1,
            height: 40,
            background:
              "linear-gradient(to bottom, var(--ink-faint), transparent)",
          }}
        />
      </div>
    </section>
  );
}
