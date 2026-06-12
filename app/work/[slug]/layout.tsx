import type { Metadata } from 'next';
import { PROJECTS } from '@/lib/data';
import { SITE_URL } from '@/lib/site';

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
    title,
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
