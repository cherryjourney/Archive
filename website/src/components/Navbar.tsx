'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: '功能', href: '/features' },
  { label: '下载', href: '/download' },
  { label: '更新日志', href: '/changelog' },
  { label: '关于', href: '/about' },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) return;

    // Use IntersectionObserver on the first <section> (Hero)
    // since the page uses a custom scroll container, window.scrollY is always 0
    const hero = document.querySelector('section');
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrolled(!entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [isHome]);

  const isDark = isHome && !scrolled;

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isDark ? 'transparent' : 'rgba(0,0,0,0.82)',
        borderBottom: isDark ? '1px solid transparent' : '1px solid rgba(255,255,255,0.06)',
        backdropFilter: isDark ? 'none' : 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: isDark ? 'none' : 'blur(20px) saturate(180%)',
        transition: 'background 0.4s, border-color 0.4s, backdrop-filter 0.4s',
      }}
    >
      <div style={{
        maxWidth: 1200, width: '100%',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link
          href="/"
          style={{
            fontSize: 19, fontWeight: 700,
            fontFamily: 'var(--font-heading), sans-serif',
            color: '#F5F5F7',
            textDecoration: 'none',
            letterSpacing: '-0.3px',
          }}
        >
          Archive·存迹
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '8px 16px', fontSize: 15,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#F5F5F7' : 'rgba(245,245,247,0.55)',
                  textDecoration: 'none',
                  borderRadius: 6,
                  transition: 'color 0.2s',
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
            style={{
              marginLeft: 12, padding: '8px 16px', fontSize: 15,
              color: 'rgba(245,245,247,0.45)', textDecoration: 'none',
              borderRadius: 6,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </nav>
  );
}
