'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { scenarios } from '@/data/scenarios';
import { allFeatures } from '@/data/features';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// ── Helpers ────────────────────────────────────────────

/** moduleId → Chinese display name */
const MODULE_NAMES: Record<string, string> = Object.fromEntries(
  allFeatures.map((f) => [f.id, f.name]),
);

/** Split Chinese sentence into word groups for stagger animation */
const HERO_WORDS = [
  { text: '每一段', amber: false },
  { text: '认真度过的', amber: false },
  { text: '晨昏', amber: true },
  { text: '，', amber: false },
  { text: '皆在此间。', amber: false },
];

/** Subtle dark tone alternation for scenario sections */
const SECTION_BGS = [
  'var(--bg-base)',
  'var(--bg-deep)',
  'var(--bg-base)',
];

// ── Component ──────────────────────────────────────────

export default function HomePage() {
  const mainRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const animating = useRef(false);

  // ═══ Smooth section-to-section scroll on wheel ═══
  useGSAP(() => {
    const handleWheel = (e: WheelEvent) => {
      // Let normal scroll happen inside a section (overflow content, etc.)
      // We only intercept when it would cross a section boundary
      if (animating.current) {
        e.preventDefault();
        return;
      }

      const sections = gsap.utils.toArray<HTMLElement>('section');
      if (sections.length === 0) return;

      // Find the section whose top is closest to viewport top
      const scrollY = window.scrollY;
      let currentIdx = 0;
      let minDist = Infinity;
      sections.forEach((s, i) => {
        const dist = Math.abs(s.offsetTop - scrollY);
        if (dist < minDist) {
          minDist = dist;
          currentIdx = i;
        }
      });

      const delta = e.deltaY;
      // Use a threshold: small trackpad scrolls shouldn't trigger
      if (Math.abs(delta) < 20) return;

      const direction = delta > 0 ? 1 : -1;
      const targetIdx = Math.max(0, Math.min(sections.length - 1, currentIdx + direction));

      // Don't intercept if already at the end
      if (targetIdx === currentIdx) return;

      e.preventDefault();
      animating.current = true;

      const target = sections[targetIdx];
      const obj = { y: scrollY };

      gsap.to(obj, {
        y: target.offsetTop,
        duration: 0.75,
        ease: 'power3.inOut',
        onUpdate: () => window.scrollTo(0, obj.y),
        onComplete: () => {
          animating.current = false;
        },
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, { scope: mainRef });

  // ═══ Hero entrance — word-staggered cascade ═══
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.from('.hero-word', {
      opacity: 0,
      y: 72,
      rotationX: -12,
      stagger: 0.09,
      duration: 1.05,
    })
      .from(
        '.hero-tagline',
        { opacity: 0, y: 28, duration: 0.75, ease: 'power3.out' },
        '-=0.35',
      )
      .from(
        '.hero-cta',
        { opacity: 0, y: 20, scale: 0.96, duration: 0.55, ease: 'power2.out' },
        '-=0.4',
      )
      .from(
        '.hero-version',
        { opacity: 0, duration: 0.5 },
        '-=0.25',
      );
  }, { scope: heroRef });

  // ═══ Scenario sections — staggered text + image reveal ═══
  useGSAP(() => {
    const sections = gsap.utils.toArray<HTMLElement>('[data-scenario]');

    sections.forEach((section) => {
      const items = section.querySelectorAll<HTMLElement>('.sc-reveal');
      const image = section.querySelector<HTMLElement>('.sc-image');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 72%',
          once: true,
        },
      });

      tl.from(
        items,
        {
          opacity: 0,
          y: 36,
          stagger: 0.1,
          duration: 0.75,
          ease: 'power3.out',
        },
        0,
      );

      if (image) {
        tl.from(
          image,
          {
            opacity: 0,
            scale: 0.94,
            duration: 1,
            ease: 'power3.out',
          },
          0.15,
        );
      }
    });
  }, { scope: mainRef });

  // ═══ CTA — fade-up on scroll ═══
  useGSAP(() => {
    gsap.from('.cta-inner > *', {
      opacity: 0,
      y: 40,
      stagger: 0.12,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: ctaRef.current,
        start: 'top 82%',
        once: true,
      },
    });
  }, { scope: ctaRef });

  // ═══ Render ═══
  return (
    <div ref={mainRef}>
      {/* ═══════════════════════════════════════════════════
          1. HERO
          ═══════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        id="hero"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          textAlign: 'center',
          padding: '120px 28px 80px',
          backgroundColor: 'var(--bg-base)',
        }}
      >
        {/* Subtle distant radial — not a glowing orb, more like nebula */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 60% 40% at 50% 35%, rgba(90,130,230,0.04) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 50% 65%, rgba(201,168,92,0.03) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Grain texture — very subtle */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.015,
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            backgroundSize: '256px 256px',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860 }}>
          {/* App name eyebrow */}
          <div
            className="hero-word"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--amber)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 28,
              fontFamily: 'var(--font-mono), monospace',
            }}
          >
            Archive · 存迹
          </div>

          {/* Main title — word-staggered */}
          <h1
            style={{
              margin: '0 0 28px',
              fontSize: 'clamp(44px, 7vw, 80px)',
              fontWeight: 700,
              lineHeight: 1.18,
              letterSpacing: '-0.015em',
              color: 'var(--text-primary)',
              fontFamily:
                "'Times New Roman','Songti SC','Source Han Serif SC','SimSun',serif",
            }}
          >
            {HERO_WORDS.map((w, i) => (
              <span
                key={i}
                className="hero-word"
                style={{
                  color: w.amber ? 'var(--amber)' : 'inherit',
                  display: 'inline-block',
                  marginRight: w.text === '，' ? 0 : '0.15em',
                }}
              >
                {w.text}
              </span>
            ))}
          </h1>

          {/* Tagline */}
          <p
            className="hero-tagline"
            style={{
              fontSize: 'clamp(17px, 2vw, 21px)',
              color: 'var(--text-secondary)',
              margin: '0 auto 48px',
              maxWidth: 480,
              lineHeight: 1.7,
            }}
          >
            为研究生而生的个人效率桌面应用。
            <br />
            任务、时间线、论文、生活，一处存迹。
          </p>

          {/* CTA button */}
          <div className="hero-cta">
            <Link
              href="/download"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 44px',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--bg-base)',
                background: 'var(--amber)',
                borderRadius: 6,
                textDecoration: 'none',
                transition: 'filter 0.2s ease, transform 0.2s ease',
                fontFamily:
                  "'Times New Roman','Songti SC','Source Han Serif SC',serif",
              }}
            >
              立即下载
              <span style={{ fontSize: 15, fontWeight: 400 }}>→</span>
            </Link>
          </div>

          {/* Version */}
          <div
            className="hero-version"
            style={{
              marginTop: 24,
              fontSize: 13,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono), monospace',
            }}
          >
            V5.1 · Windows 10/11 · 完全免费
          </div>
        </div>

        {/* Scroll hint — subtle */}
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 12,
            color: 'var(--text-muted)',
            letterSpacing: '0.13em',
            opacity: 0.35,
            fontFamily: 'var(--font-mono), monospace',
          }}
        >
          ↓ 往下看
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          2-4. SCENARIO SECTIONS
          ═══════════════════════════════════════════════════ */}
      {scenarios.map((scenario, i) => {
        const reversed = scenario.reversed ?? false;

        return (
          <section
            key={scenario.id}
            data-scenario={scenario.id}
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              padding: '100px 28px',
              backgroundColor: SECTION_BGS[i % SECTION_BGS.length],
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'clamp(48px, 7vw, 88px)',
                alignItems: 'center',
                maxWidth: 1200,
                margin: '0 auto',
                width: '100%',
              }}
            >
              {/* ── Text column ── */}
              <div
                style={{
                  order: reversed ? 1 : 0,
                  maxWidth: 480,
                  justifySelf: reversed ? 'end' : 'start',
                }}
              >
                {/* Number — like a star catalog entry */}
                <div
                  className="sc-reveal"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--amber)',
                    letterSpacing: '0.16em',
                    fontFamily: 'var(--font-mono), monospace',
                    marginBottom: 20,
                  }}
                >
                  {scenario.number}
                </div>

                {/* Title */}
                <h2
                  className="sc-reveal"
                  style={{
                    fontSize: 'clamp(28px, 4vw, 44px)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: '0 0 20px',
                    lineHeight: 1.22,
                    letterSpacing: '-0.012em',
                    fontFamily:
                      "'Times New Roman','Songti SC','Source Han Serif SC','SimSun',serif",
                  }}
                >
                  {scenario.title}
                </h2>

                {/* English subtitle */}
                <div
                  className="sc-reveal"
                  style={{
                    fontSize: 14,
                    color: 'var(--text-muted)',
                    marginBottom: 24,
                    fontStyle: 'italic',
                    fontFamily: "'Times New Roman', serif",
                  }}
                >
                  {scenario.titleEn}
                </div>

                {/* Quote */}
                <blockquote
                  className="sc-reveal"
                  style={{
                    fontSize: 'clamp(16px, 1.7vw, 19px)',
                    color: 'var(--amber)',
                    margin: '0 0 24px',
                    lineHeight: 1.65,
                    borderLeft: '2px solid rgba(201,168,92,0.3)',
                    paddingLeft: 18,
                    fontStyle: 'italic',
                    fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC',serif",
                  }}
                >
                  &ldquo;{scenario.quote}&rdquo;
                </blockquote>

                {/* Description */}
                <p
                  className="sc-reveal"
                  style={{
                    fontSize: 'clamp(15px, 1.5vw, 17px)',
                    color: 'var(--text-secondary)',
                    margin: '0 0 28px',
                    lineHeight: 1.78,
                  }}
                >
                  {scenario.description}
                </p>

                {/* Module tags */}
                <div
                  className="sc-reveal"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px 10px',
                    marginBottom: 32,
                  }}
                >
                  {scenario.moduleIds.map((mid) => {
                    const name = MODULE_NAMES[mid] ?? mid;
                    return (
                      <span
                        key={mid}
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--amber)',
                          background: 'rgba(201,168,92,0.07)',
                          padding: '5px 14px',
                          borderRadius: 9999,
                          fontFamily:
                            "'Times New Roman','Songti SC','Source Han Serif SC',serif",
                        }}
                      >
                        {name}
                      </span>
                    );
                  })}
                </div>

                {/* Link to full feature list */}
                <div className="sc-reveal">
                  <Link
                    href="/features"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 15,
                      fontWeight: 500,
                      color: 'var(--amber)',
                      textDecoration: 'none',
                      transition: 'opacity 0.2s ease',
                      fontFamily:
                        "'Times New Roman','Songti SC','Source Han Serif SC',serif",
                    }}
                  >
                    查看全部功能 <span style={{ fontSize: 14 }}>→</span>
                  </Link>
                </div>
              </div>

              {/* ── Image column ── */}
              <div
                className="sc-image"
                style={{
                  order: reversed ? 0 : 1,
                  justifySelf: reversed ? 'start' : 'end',
                }}
              >
                {/* Placeholder — abstract star-chart aesthetic */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '4/3',
                    maxWidth: 520,
                    background:
                      'radial-gradient(ellipse at 30% 40%, rgba(90,130,230,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(201,168,92,0.04) 0%, transparent 50%)',
                    backgroundColor: 'rgba(14,22,41,0.6)',
                    border: '1px solid rgba(120,150,230,0.08)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Abstract grid lines — like a star chart / UI wireframe */}
                  <svg
                    viewBox="0 0 400 300"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0.15,
                    }}
                    aria-hidden="true"
                  >
                    <defs>
                      <pattern
                        id={`grid-${scenario.id}`}
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 40 0 L 0 0 0 40"
                          fill="none"
                          stroke="rgba(120,150,230,0.15)"
                          strokeWidth="0.5"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#grid-${scenario.id})`} />
                    {/* Random "star" dots */}
                    {[
                      [60, 50],
                      [200, 80],
                      [320, 120],
                      [100, 180],
                      [280, 200],
                      [150, 250],
                      [340, 260],
                    ].map(([cx, cy], idx) => (
                      <circle
                        key={idx}
                        cx={cx}
                        cy={cy}
                        r={1.5}
                        fill={idx % 3 === 0 ? 'rgba(201,168,92,0.5)' : 'rgba(120,150,230,0.3)'}
                      />
                    ))}
                  </svg>

                  {/* Center hint */}
                  <span
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.12)',
                      letterSpacing: '0.06em',
                      fontFamily: 'var(--font-mono), monospace',
                    }}
                  >
                    界面截图
                  </span>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* ═══════════════════════════════════════════════════
          5. CTA
          ═══════════════════════════════════════════════════ */}
      <section
        ref={ctaRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '120px 28px',
          backgroundColor: 'var(--bg-base)',
          position: 'relative',
        }}
      >
        {/* Faint radial */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(201,168,92,0.04) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div className="cta-inner" style={{ position: 'relative', zIndex: 1 }}>
          <p
            style={{
              fontSize: 'clamp(20px, 2.8vw, 28px)',
              color: 'var(--text-secondary)',
              margin: '0 auto 44px',
              maxWidth: 480,
              lineHeight: 1.6,
              fontFamily:
                "'Times New Roman','Songti SC','Source Han Serif SC','SimSun',serif",
            }}
          >
            从今天开始，记录每一次认真的晨昏。
          </p>

          <Link
            href="/download"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 52px',
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--bg-base)',
              background: 'var(--amber)',
              borderRadius: 6,
              textDecoration: 'none',
              transition: 'filter 0.2s ease',
              fontFamily:
                "'Times New Roman','Songti SC','Source Han Serif SC',serif",
            }}
          >
            免费下载
            <span style={{ fontSize: 16, fontWeight: 400 }}>→</span>
          </Link>

          <div
            style={{
              marginTop: 24,
              fontSize: 13,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono), monospace',
            }}
          >
            V5.1 · Windows 10/11 · 完全免费
          </div>
        </div>
      </section>
    </div>
  );
}
