import type { Metadata } from 'next';

export const metadata: Metadata = { title: '功能详情' };

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
