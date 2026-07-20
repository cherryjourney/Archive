import Link from "next/link";

const COLUMNS = [
  {
    title: "Archive·存迹",
    items: [
      { label: "为研究生而生的个人效率桌面应用", href: null },
      { label: "每一段认真度过的晨昏，皆在此间", href: null },
      { label: "100% 本地离线 · 完全免费 · 开源", href: null },
    ],
  },
  {
    title: "功能模块",
    items: [
      { label: "核心效率 (4项)", href: "/features" },
      { label: "时间规划 (4项)", href: "/features" },
      { label: "学术研究 (3项)", href: "/features" },
      { label: "生活工具 (8项)", href: "/features" },
    ],
  },
  {
    title: "资源",
    items: [
      { label: "下载", href: "/download" },
      { label: "更新日志", href: "/changelog" },
      { label: "关于", href: "/about" },
    ],
  },
  {
    title: "社区",
    items: [
      { label: "GitHub", href: "https://github.com" },
      { label: "提交反馈", href: "https://github.com" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#04070a",
        padding: "100px 40px 48px",
      }}
    >
      {/* Main grid */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 48,
        }}
      >
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 15,
                color: "var(--text-primary)",
                marginBottom: 20,
                letterSpacing: "0.04em",
              }}
            >
              {col.title}
            </div>
            {col.items.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    display: "block",
                    fontSize: 14,
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    marginBottom: 10,
                    transition: "color 0.2s",
                  }}
                  {...(item.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {item.label}
                  {item.href.startsWith("http") ? " ↗" : ""}
                </Link>
              ) : (
                <div
                  key={item.label}
                  style={{
                    fontSize: 14,
                    color: "var(--text-muted)",
                    marginBottom: 10,
                    opacity: 0.6,
                  }}
                >
                  {item.label}
                </div>
              )
            )}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: 1200,
          margin: "56px auto 0",
          paddingTop: 28,
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          fontSize: 13,
          color: "var(--text-muted)",
          textAlign: "center",
          opacity: 0.45,
        }}
      >
        &copy; {new Date().getFullYear()} Archive·存迹. All rights reserved.
        {" · "}V5.0.1
      </div>
    </footer>
  );
}
