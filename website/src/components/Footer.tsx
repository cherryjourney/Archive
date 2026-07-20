import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Archive·存迹',
    items: [
      { label: '个人效率管理工具', href: null },
      { label: '每一次认真的晨昏', href: null },
      { label: '都在这里', href: null },
    ],
  },
  {
    title: '功能模块',
    items: [
      { label: '核心 (4项)', href: '/features' },
      { label: '时间规划 (4项)', href: '/features' },
      { label: '学术 (3项)', href: '/features' },
      { label: '工具 (8项)', href: '/features' },
    ],
  },
  {
    title: '资源',
    items: [
      { label: '下载', href: '/download' },
      { label: '更新日志', href: '/changelog' },
      { label: '关于', href: '/about' },
    ],
  },
  {
    title: '社区',
    items: [
      { label: 'GitHub', href: 'https://github.com' },
      { label: '反馈 / Issue', href: 'https://github.com' },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{
      background: '#000000',
      padding: '80px 24px 40px',
    }}>
      <div className="footer-grid" style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40,
      }}>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div style={{
              fontWeight: 600, fontSize: 14, color: '#F5F5F7',
              marginBottom: 16, fontFamily: 'var(--font-heading), sans-serif',
            }}>
              {col.title}
            </div>
            {col.items.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    display: 'block', fontSize: 13, color: 'rgba(245,245,247,0.55)',
                    textDecoration: 'none', marginBottom: 8,
                    transition: 'color 0.2s',
                  }}
                >
                  {item.label}
                </Link>
              ) : (
                <div key={item.label} style={{
                  fontSize: 13, color: 'rgba(245,245,247,0.45)', marginBottom: 8,
                }}>
                  {item.label}
                </div>
              )
            )}
          </div>
        ))}
      </div>
      <div style={{
        maxWidth: 1100, margin: '48px auto 0',
        paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: 12, color: 'rgba(245,245,247,0.35)', textAlign: 'center',
      }}>
        &copy; {new Date().getFullYear()} Archive·存迹. All rights reserved.
      </div>
    </footer>
  );
}
