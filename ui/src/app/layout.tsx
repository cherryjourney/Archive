import type { Metadata } from "next";
import { Sora, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Archive·存迹 — 每一段认真度过的晨昏，皆在此间",
  description:
    "为研究生而生的个人效率桌面应用。任务管理、时间规划、学术追踪、出行清单——19个模块，本地优先，数据归你。",
  keywords: ["效率工具", "任务管理", "研究生", "Tauri", "桌面应用", "时间规划"],
  openGraph: {
    title: "Archive·存迹",
    description: "每一段认真度过的晨昏，皆在此间",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${sora.variable} ${notoSerifSC.variable}`}>
      <body>{children}</body>
    </html>
  );
}
