import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Instrument_Serif } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SiteNav, SiteFooter } from '@/components/SiteChrome';
import SectionRevealObserver from '@/components/SectionRevealObserver';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
});

const description = 'Product designer with 12+ years untangling complex enterprise software. Security, AI product surfaces, 0→1 work, and shipping things that actually work.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Joshua Bussey — Product Designer',
    template: '%s — Joshua Bussey',
  },
  description,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    siteName: 'Joshua Bussey',
    title: 'Joshua Bussey — Product Designer',
    description,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Joshua Bussey — Product Designer',
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Joshua Bussey',
              jobTitle: 'Senior Product Designer',
              url: SITE_URL,
              email: 'jbusseywork@gmail.com',
              description,
            }),
          }}
        />
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SectionRevealObserver />
        {/* Both bow out on /jobs — see SiteChrome. */}
        <SiteNav />
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
