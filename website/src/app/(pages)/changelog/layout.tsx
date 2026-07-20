import type { Metadata } from 'next';

export const metadata: Metadata = { title: '更新日志' };

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
