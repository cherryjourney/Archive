import type { Metadata } from 'next';
import Link from 'next/link';
import SectionTitle from '@/components/SectionTitle';
import { MonitorIcon, AppleIcon, TerminalIcon } from '@/components/Icons';

export const metadata: Metadata = { title: '下载' };

const PLATFORMS = [
  { name: 'Windows', icon: <MonitorIcon />, available: true, href: '/download/windows', label: 'Windows 10/11 · 64位' },
  { name: 'macOS', icon: <AppleIcon />, available: false, label: '即将推出' },
  { name: 'Linux', icon: <TerminalIcon />, available: false, label: '即将推出' },
];

export default function DownloadPage() {
  return (
    <div style={{
      background: '#FFFFFF',
      color: '#1D1D1F',
      minHeight: '100vh',
    }}>
      <div style={{ padding: '120px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
        <SectionTitle
          title="下载 Archive·存迹"
          subtitle="选择你的平台开始使用"
          dark={false}
        />

        <div className="platform-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
          marginBottom: 60,
        }}>
          {PLATFORMS.map((p) => (
            <div key={p.name} style={{
              textAlign: 'center', padding: '48px 24px',
              opacity: p.available ? 1 : 0.35,
              background: '#F5F5F7',
              borderRadius: 16,
            }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                {p.icon}
              </div>
              <div style={{
                fontSize: 22, fontWeight: 700, color: '#1D1D1F',
                marginBottom: 8, fontFamily: 'var(--font-heading), sans-serif',
              }}>
                {p.name}
              </div>
              <div style={{ fontSize: 15, color: '#86868B', marginBottom: 28 }}>
                {p.label}
              </div>
              {p.available && p.href ? (
                <Link href={p.href} style={{
                  display: 'inline-block', padding: '13px 40px', fontSize: 16, fontWeight: 600,
                  color: 'white', background: 'linear-gradient(135deg, #0071E3, #0077ED)',
                  borderRadius: 10, textDecoration: 'none',
                  boxShadow: '0 0 24px rgba(0,113,227,0.25)',
                }}>
                  下载
                </Link>
              ) : (
                <span style={{
                  display: 'inline-block', padding: '13px 40px', fontSize: 16, fontWeight: 600,
                  color: '#86868B', background: 'rgba(0,0,0,0.04)',
                  borderRadius: 10,
                }}>
                  即将推出
                </span>
              )}
            </div>
          ))}
        </div>

        <div style={{
          background: '#F5F5F7',
          borderRadius: 16, padding: 36,
        }}>
          <h3 style={{
            fontSize: 22, fontWeight: 600, color: '#1D1D1F',
            marginBottom: 24, fontFamily: 'var(--font-heading), sans-serif',
          }}>
            安装说明
          </h3>
          <ol style={{
            fontSize: 17, color: '#86868B', lineHeight: 2.4,
            paddingLeft: 22, margin: 0,
          }}>
            <li>下载 <code style={{
              background: 'rgba(0,0,0,0.06)', padding: '2px 8px', borderRadius: 4, fontSize: 14,
              fontFamily: 'var(--font-mono), monospace', color: '#1D1D1F',
            }}>.exe</code> 安装包</li>
            <li>双击运行，按提示完成安装</li>
            <li>首次启动自动初始化数据库，立即开始使用</li>
          </ol>

          <div style={{
            marginTop: 28, paddingTop: 20,
            borderTop: '1px solid rgba(0,0,0,0.08)',
            fontSize: 14, color: '#86868B',
            fontFamily: 'var(--font-mono), monospace',
          }}>
            系统要求：Windows 10/11 · 64位 · 200MB 可用空间
          </div>
        </div>
      </div>
    </div>
  );
}
