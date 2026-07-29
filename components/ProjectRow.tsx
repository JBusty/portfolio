import { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Project } from '@/lib/data';

interface ProjectRowProps {
  p: Project;
  first?: boolean;
  /** Row position — the top rows are above the fold, so they load eagerly. */
  index?: number;
}

const TAG_CHIP_STYLES: CSSProperties[] = [
  { background: 'rgba(110, 129, 97, 0.12)', borderColor: 'rgba(110, 129, 97, 0.22)', color: '#3E4A38' },
  { background: 'rgba(179, 116, 70, 0.12)', borderColor: 'rgba(179, 116, 70, 0.22)', color: '#6B4630' },
  { background: 'rgba(76, 112, 138, 0.12)', borderColor: 'rgba(76, 112, 138, 0.22)', color: '#36566A' },
  { background: 'rgba(156, 101, 125, 0.12)', borderColor: 'rgba(156, 101, 125, 0.22)', color: '#674354' },
  { background: 'rgba(162, 136, 72, 0.12)', borderColor: 'rgba(162, 136, 72, 0.22)', color: '#66552C' },
  { background: 'rgba(94, 120, 116, 0.12)', borderColor: 'rgba(94, 120, 116, 0.22)', color: '#3D514E' },
];

function getTagChipStyle(tag: string): CSSProperties {
  const styleIndex = Array.from(tag).reduce((sum, char) => sum + char.charCodeAt(0), 0) % TAG_CHIP_STYLES.length;
  return TAG_CHIP_STYLES[styleIndex];
}

export default function ProjectRow({ p, first, index = 0 }: ProjectRowProps) {
  return (
    <Link href={`/work/${p.slug}`} className="proj-row" data-first={first ? 'true' : undefined}>
      {/* accent bar — slides down from top on hover */}
      <span aria-hidden className="proj-row-bar" />

      <div className="proj-row-thumb">
        <Image
          src={p.thumb}
          alt={`${p.title} — ${p.company}`}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 980px) 150px, 168px"
          loading={index < 2 ? 'eager' : 'lazy'}
          style={{ objectFit: 'cover', objectPosition: p.thumbPosition ?? 'top center' }}
        />
      </div>

      <div className="proj-row-title">
        <div className="mono upper proj-row-company">{p.company}</div>
        <div className="tight proj-row-name">{p.title}</div>

        {/* result — the outcome, set off from the description by a short rule */}
        <div className="proj-row-metric">
          <span aria-hidden className="proj-row-rule" />
          <span>{p.metric}</span>
        </div>
      </div>

      <div className="proj-row-blurb">{p.blurb}</div>

      <div className="proj-row-tags">
        <span className="chip proj-row-year">{p.year}</span>
        {p.tags.slice(0, 2).map((t) => (
          <span key={t} className="chip" style={getTagChipStyle(t)}>
            {t}
          </span>
        ))}
      </div>

      <span className="btn proj-row-btn">
        View <span className="arr">→</span>
      </span>
    </Link>
  );
}
