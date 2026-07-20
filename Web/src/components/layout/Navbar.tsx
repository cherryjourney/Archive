'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { label: '功能', href: '/features' },
  { label: '下载', href: '/download' },
  { label: '更新日志', href: '/changelog' },
  { label: '关于', href: '/about' },
  { label: '联系我们', href: '/about#contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(!isHome);
  const [mobileOpen, setMobileOpen] = useState(false);

  // IntersectionObserver: detect when hero leaves viewport
  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const hero = document.getElementById('hero');
    if (!hero) return;
    const obs = new IntersectionObserver(
      ([e]) => setScrolled(!e.isIntersecting),
      { threshold: 0.05 },
    );
    obs.observe(hero);
    return () => obs.disconnect();
  }, [isHome]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: scrolled ? 'rgba(6,8,15,0.86)' : 'transparent',
          borderBottom: scrolled
            ? '1px solid rgba(201,168,92,0.07)'
            : '1px solid transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          transition: 'background 0.45s ease, border-color 0.45s ease, backdrop-filter 0.45s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1200, width: '100%',
            padding: '0 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              fontSize: 19, fontWeight: 700,
              fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC',serif",
              color: 'var(--text-primary)',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
            }}
          >
            Archive<span style={{ color: 'var(--amber)' }}>·</span>存迹
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 2 }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '6px 14px', fontSize: 15, fontWeight: active ? 500 : 400,
                    color: active ? 'var(--amber)' : 'var(--text-secondary)',
                    textDecoration: 'none', borderRadius: 4,
                    transition: 'color 0.2s ease',
                    fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC',serif",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}

            <span style={{
              display: 'inline-block', width: 1, height: 18,
              background: 'rgba(120,150,230,0.1)', margin: '0 14px',
            }} />

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 12px', fontSize: 14,
                color: 'var(--text-muted)',
                textDecoration: 'none', borderRadius: 4,
                transition: 'color 0.2s ease',
              }}
            >
              GitHub ↗
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden"
            style={{
              padding: 8, marginRight: -8,
              color: 'var(--amber)', background: 'none', border: 'none',
              cursor: 'pointer',
            }}
            aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(4,6,11,0.94)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 36,
          }}
        >
          {NAV_ITEMS.map((item, i) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                style={{
                  fontSize: 28, fontWeight: active ? 600 : 400,
                  color: active ? 'var(--amber)' : 'var(--text-primary)',
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  fontFamily: "'Times New Roman','Songti SC','Source Han Serif SC',serif",
                  opacity: 0,
                  animation: `fadeUp 0.35s ${0.06 * i}s ease-out forwards`,
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMobile}
            style={{
              marginTop: 16, padding: '10px 28px', fontSize: 15,
              color: 'var(--text-muted)', textDecoration: 'none',
              border: '1px solid rgba(120,150,230,0.12)', borderRadius: 9999,
              opacity: 0,
              animation: `fadeUp 0.35s ${0.06 * NAV_ITEMS.length}s ease-out forwards`,
            }}
          >
            GitHub ↗
          </a>
          <div
            style={{
              position: 'absolute', bottom: 40,
              fontSize: 12, color: 'var(--text-muted)', opacity: 0.2,
              letterSpacing: '0.1em',
            }}
          >
            ESC 关闭
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
