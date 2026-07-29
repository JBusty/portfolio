import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

const description =
  "Available for staff and lead product design roles in security and fintech. Remote only. Let's talk about what you're building.";

export const metadata: Metadata = {
  title: 'Contact',
  description,
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: "Contact — Joshua Bussey",
    description,
    url: `${SITE_URL}/contact`,
  },
  twitter: {
    title: "Contact — Joshua Bussey",
    description,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
