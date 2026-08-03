import type { Metadata } from 'next';
import { PROJECTS } from '@/lib/data';
import { SITE_URL } from '@/lib/site';

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) return {};

  const title = project.title;
  const description = `${project.blurb} ${project.metric ? `Result: ${project.metric}.` : ''}`.trim();
  const url = `${SITE_URL}/work/${slug}`;

  return {
    // Absolute on purpose: app/work/layout.tsx sets a plain-string title, which
    // ends the root's "%s — Joshua Bussey" template before it reaches this depth.
    // Without this, case studies index as bare "Fleet Card".
    title: { absolute: `${title} — Joshua Bussey` },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — Joshua Bussey`,
      description,
      url,
    },
    twitter: {
      title: `${title} — Joshua Bussey`,
      description,
    },
  };
}

export default function CaseStudyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
