import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Case Studies',
  description: 'Product design case studies spanning 0→1 products, design systems, and enterprise UX. Twelve-plus years of shipping complex software.',
  alternates: { canonical: `${SITE_URL}/work` },
  openGraph: {
    title: 'Case Studies — Joshua Bussey',
    description: 'Product design case studies spanning 0→1 products, design systems, and enterprise UX. Twelve-plus years of shipping complex software.',
    url: `${SITE_URL}/work`,
  },
  twitter: {
    title: 'Case Studies — Joshua Bussey',
    description: 'Product design case studies spanning 0→1 products, design systems, and enterprise UX. Twelve-plus years of shipping complex software.',
  },
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
