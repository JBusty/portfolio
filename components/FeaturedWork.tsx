import Image from 'next/image';
import Link from 'next/link';
import { FEATURED_PROJECTS, type Project } from '@/lib/data';

export default function FeaturedWork() {
  return (
    <section style={{ background: 'var(--bone)' }}>
      <div className="container sp-large" style={{ padding: '112px 32px 120px' }}>
        <div className="featured-head">
          <h2
            className="tight"
            style={{
              margin: 0,
              fontSize: 'clamp(36px, 5vw, 80px)',
              lineHeight: 0.96,
              letterSpacing: '-0.04em',
              fontWeight: 700,
              maxWidth: '18ch',
            }}
          >
            Selected work<span className="accent">.</span>
          </h2>
          <Link href="/work" className="btn ghost featured-head-cta">
            All 7 case studies <span className="arr">→</span>
          </Link>
        </div>

        <div className="featured-grid">
          {FEATURED_PROJECTS.map((project) => (
            <FeaturedCard key={project.slug} p={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ p }: { p: Project }) {
  return (
    <Link href={`/work/${p.slug}`} className="featured-card">
      <div className="featured-card-media">
        <Image
          src={p.thumb}
          alt={`${p.title} — ${p.company}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
          style={{ objectFit: 'cover', objectPosition: p.thumbPosition ?? 'top center' }}
        />
      </div>

      <div className="featured-card-body">
        <div className="mono upper featured-card-company">{p.company}</div>
        <h3 className="tight featured-card-title">{p.title}</h3>

        <div className="featured-card-metric">
          <span aria-hidden className="featured-card-rule" />
          <span>{p.metric}</span>
        </div>

        <div className="featured-card-foot">
          <div className="featured-card-tags">
            {p.tags.map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>
          <span className="mono upper featured-card-more">
            Read <span className="arr">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
