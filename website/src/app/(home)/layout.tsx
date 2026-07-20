import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = { title: '首页' };

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
