import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PROJECTS } from '@/lib/data';
import { getCaseStudy } from '@/lib/caseStudies';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  return [{ id: slug || 'og', alt: project ? `${project.title} by Joshua Bussey` : 'Case Study' }];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', background: '#EDF0F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 48, color: '#1B2233' }}>Joshua Bussey</span>
      </div>,
      { ...size },
    );
  }

  const study = getCaseStudy(project);
  const allImages = [
    ...(study.images?.solution ?? []),
    ...(study.images?.wireframes ?? []),
  ];
  const firstImagePath = allImages[0];

  let imgSrc: string | null = null;
  if (firstImagePath) {
    try {
      const fsPath = join(process.cwd(), 'public', firstImagePath);
      const data = await readFile(fsPath, 'base64');
      const ext = firstImagePath.endsWith('.svg') ? 'svg+xml' : 'png';
      imgSrc = `data:image/${ext};base64,${data}`;
    } catch {
      // fall through to text-only card
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#1B2233',
          position: 'relative',
        }}
      >
        {imgSrc && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <img src={imgSrc} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(27, 34, 51,0.15) 0%, rgba(27, 34, 51,0.1) 40%, rgba(27, 34, 51,0.82) 80%, rgba(27, 34, 51,0.95) 100%)',
            display: 'flex',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3D5A80' }} />
          <span style={{ fontSize: 16, color: 'rgba(248, 248, 247,0.7)', letterSpacing: 2, fontFamily: 'monospace', textTransform: 'uppercase' }}>
            joshuabussey.com
          </span>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0 64px 52px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 15, color: 'rgba(248, 248, 247,0.6)', letterSpacing: 1, fontFamily: 'monospace', textTransform: 'uppercase' }}>
              {project.company}
            </span>
            {project.metric && (
              <>
                <span style={{ color: 'rgba(248, 248, 247,0.3)', fontSize: 14 }}>·</span>
                <span style={{ fontSize: 15, color: '#3D5A80', letterSpacing: 0.5, fontFamily: 'monospace' }}>
                  {project.metric}
                </span>
              </>
            )}
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, color: '#F8F8F7', letterSpacing: '-2px', lineHeight: 1.05, fontFamily: 'sans-serif' }}>
            {project.title}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
