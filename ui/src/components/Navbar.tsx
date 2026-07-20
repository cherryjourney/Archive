"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "功能", href: "#features" },
  { label: "理念", href: "#philosophy" },
  { label: "下载", href: "#download" },
] as const;

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      ref={navRef}
      role="navigation"
      aria-label="主导航"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 clamp(20px, 4vw, 48px)",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: "100%",
        transition:
          "opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        opacity: scrolled ? (visible ? 1 : 0) : 1,
        transform: scrolled
          ? visible
            ? "translateY(0)"
            : "translateY(-16px)"
          : "translateY(0)",
        pointerEvents: scrolled && !visible ? "none" : "auto",
      }}
    >
      {/* Backdrop */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: scrolled
            ? "rgba(6,8,15,0.72)"
            : "rgba(6,8,15,0)",
          backdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
          WebkitBackdropFilter: scrolled
            ? "blur(20px) saturate(1.4)"
            : "none",
          borderBottom: scrolled
            ? "1px solid rgba(201,168,92,0.08)"
            : "1px solid transparent",
          transition: "background 0.4s, backdrop-filter 0.4s",
        }}
      />

      {/* Logo */}
      <Link
        href="/"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          color: "var(--ink-primary)",
        }}
      >
        <img
          src="/logo.svg"
          alt=""
          width={28}
          height={28}
          style={{ filter: "brightness(1.1)" }}
          aria-hidden
        />
        <span
          style={{
            fontFamily: "var(--font-heading), system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: "-0.02em",
          }}
        >
          Archive · 存迹
        </span>
      </Link>

      {/* Links */}
      <div style={{ position: "relative", display: "flex", gap: 32 }}>
        {NAV_ITEMS.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            style={{
              fontFamily: "var(--font-heading), system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink-secondary)",
              textDecoration: "none",
              letterSpacing: "0.02em",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--amber)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--ink-secondary)")
            }
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
