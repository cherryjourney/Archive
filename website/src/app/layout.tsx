import type { Metadata } from 'next';
import { Space_Grotesk, DM_Sans, JetBrains_Mono, Noto_Sans_SC } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  variable: '--font-body-cn',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Archive·存迹 — 每一次认真的晨昏，都在这里',
    template: '%s | Archive·存迹',
  },
  description: '面向研究生的个人效率管理桌面应用。任务管理、时间规划、学术追踪、出行清单——19个模块，本地优先。',
  keywords: ['效率工具', '任务管理', '研究生', 'Tauri', '桌面应用', '时间规划'],
  openGraph: {
    title: 'Archive·存迹',
    description: '每一次认真的晨昏，都在这里',
    type: 'website',
    locale: 'zh_CN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${notoSansSC.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
