import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Archive·存迹 — 每一段认真度过的晨昏，皆在此间",
  description:
    "为研究生而生的个人效率桌面应用。任务、时间线、论文、生活，一处存迹。20+ 功能模块，100% 本地离线，完全免费。",
  keywords: [
    "存迹",
    "Archive",
    "研究生",
    "效率工具",
    "任务管理",
    "时间线",
    "论文管理",
    "桌面应用",
    "Tauri",
  ],
  openGraph: {
    title: "Archive·存迹 — 每一段认真度过的晨昏，皆在此间",
    description:
      "为研究生而生的个人效率桌面应用。任务、时间线、论文、生活，一处存迹。",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
          style={{
            background: "var(--amber)",
            color: "var(--bg-base)",
          }}
        >
          跳到主要内容
        </a>
        {children}
      </body>
    </html>
  );
}
