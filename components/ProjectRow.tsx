import { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Mark from '@/components/Mark';
import { Project } from '@/lib/data';

interface ProjectRowProps {
  p: Project;
  first?: boolean;
  /** Row position — the top rows are above the fold, so they load eagerly. */
  index?: number;
}

// Each tag gets a hue (as an "r, g, b" triple for the tint and edge) and a text
// colour for each theme; .tag-chip in globals.css turns these into the chip.
type ChipVars = CSSProperties & Record<'--tc' | '--tt' | '--tt-d', string>;
const TAG_CHIP_STYLES: ChipVars[] = [
  { '--tc': '61, 90, 128',   '--tt': '#2F4766', '--tt-d': '#A9C0E0' },
  { '--tc': '52, 120, 118',  '--tt': '#1F5250', '--tt-d': '#8FCFCB' },
  { '--tc': '110, 92, 160',  '--tt': '#4A3D78', '--tt-d': '#C3B6EA' },
  { '--tc': '70, 76, 92',    '--tt': '#363C4A', '--tt-d': '#C2C8D3' },
  { '--tc': '72, 110, 92',   '--tt': '#2E4E40', '--tt-d': '#9FCBB4' },
  { '--tc': '60, 110, 150',  '--tt': '#24506E', '--tt-d': '#9BC7E8' },
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
          <span key={t} className="chip tag-chip" style={getTagChipStyle(t)}>
            {t}
          </span>
        ))}
      </div>

      <span className="btn proj-row-btn">
        View <Mark />
      </span>
    </Link>
  );
}
