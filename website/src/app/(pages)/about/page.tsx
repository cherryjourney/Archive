import type { Metadata } from 'next';
import SectionTitle from '@/components/SectionTitle';

export const metadata: Metadata = { title: '关于' };

const ABOUT_SECTIONS = [
  {
    title: '项目故事',
    content: '一个研究生为自己打造的个人效率工具。从 V1.0 到 V5.0，5 年持续打磨，不断进化。本地优先，数据掌握在自己手中——这是我们对隐私和可靠性的承诺。',
  },
  {
    title: '技术架构',
    content: 'Tauri 2 · Rust · React 18 · TypeScript · SQLite · Ant Design 5。5 层架构：React Page → Zustand Store → Tauri invoke → Rust Command → Rust Service → SQLite。离线运行，无需网络。',
  },
  {
    title: '联系与反馈',
    content: 'GitHub Issues 是最快的反馈渠道。功能建议、Bug 报告、使用问题，都欢迎提出。',
    links: [
      { label: 'GitHub', href: 'https://github.com' },
      { label: '邮件联系', href: 'mailto:hello@archive.app' },
    ],
  },
];

export default function AboutPage() {
  return (
    <div style={{
      background: '#FFFFFF',
      color: '#1D1D1F',
      minHeight: '100vh',
    }}>
      <div style={{ padding: '120px 24px 80px', maxWidth: 760, margin: '0 auto' }}>
        <SectionTitle title="关于 Archive·存迹" dark={false} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {ABOUT_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 style={{
                fontSize: 22, fontWeight: 600, color: '#1D1D1F',
                marginBottom: 16, fontFamily: 'var(--font-heading), sans-serif',
              }}>
                {section.title}
              </h3>
              <p style={{
                fontSize: 17, color: '#86868B', lineHeight: 1.8, margin: 0,
              }}>
                {section.content}
              </p>
              {section.links && (
                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                  {section.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      style={{
                        fontSize: 15, fontWeight: 600, color: '#0071E3',
                        textDecoration: 'none',
                        padding: '8px 20px',
                        borderRadius: 10,
                        background: 'rgba(0,113,227,0.08)',
                        transition: 'background 0.2s',
                      }}
                    >
                      {link.label} →
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
