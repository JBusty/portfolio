import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: "Available for senior product design roles. Let's talk about what you're building.",
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: "Contact — Joshua Bussey",
    description: "Available for senior product design roles. Let's talk about what you're building.",
    url: `${SITE_URL}/contact`,
  },
  twitter: {
    title: "Contact — Joshua Bussey",
    description: "Available for senior product design roles. Let's talk about what you're building.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
