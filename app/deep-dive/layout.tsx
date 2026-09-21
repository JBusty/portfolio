import type { Metadata } from 'next';

// Unlisted, and kept that way: noindex here, absent from the sitemap, and no
// robots.txt line — a Disallow entry would only publish the path.
export const metadata: Metadata = {
  title: { absolute: 'Project deep dives — Joshua Bussey' },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function DeepDiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
