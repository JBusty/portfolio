import type { CSSProperties } from 'react';
import Link from 'next/link';
import Mark from '@/components/Mark';
import CoverKeys from '@/components/deep-dive/CoverKeys';
import { COVER_LEDE, DECKS, countPlaceholders, coverHref, isPlaceholder } from '@/lib/deepDive';
import type { Deck } from '@/lib/deepDive/types';
import c from '@/components/deep-dive/cover.module.css';

export default function DeepDiveCover() {
  // A talk given from a link is there if there is time, so it is not counted.
  const minutes = DECKS.filter((deck) => !deck.link).reduce((sum, deck) => sum + deck.minutes, 0);

  return (
    <main id="main-content" tabIndex={-1} className={c.root}>
      <CoverKeys hrefs={DECKS.map(coverHref)} />

      <div className={c.top}>
        <span>Joshua Bussey</span>
        <Link href="/" className={c.leave}>
          <Mark dir="left" />
          Back to the site
        </Link>
      </div>

      <div className={c.main}>
        <h1 className={c.title}>Project deep dives</h1>
        <p className={c.lede}>
          <Copy text={COVER_LEDE} />
        </p>

        <ol className={c.list}>
          {DECKS.map((deck, i) => (
            <li key={deck.slug}>
              {deck.link ? (
                <a
                  href={deck.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={c.row}
                  style={{ '--row-tint': deck.tint } as CSSProperties}
                >
                  <Row deck={deck} n={i + 1} />
                </a>
              ) : (
                <Link href={coverHref(deck)} className={c.row} style={{ '--row-tint': deck.tint } as CSSProperties}>
                  <Row deck={deck} n={i + 1} />
                </Link>
              )}
            </li>
          ))}
        </ol>
        <p className={c.total}>About {minutes} minutes, with time left for questions.</p>
      </div>

      <div className={c.keys}>
        <span><kbd className={c.kbd}>1</kbd><kbd className={c.kbd}>2</kbd> Open a deck</span>
        <span><kbd className={c.kbd}>→</kbd> Next</span>
        <span><kbd className={c.kbd}>F</kbd> Full screen</span>
        <span><kbd className={c.kbd}>?</kbd> Every shortcut</span>
      </div>
    </main>
  );
}

function Row({ deck, n }: { deck: Deck; n: number }) {
  const remaining = deck.link ? 0 : countPlaceholders(deck);
  const backup = deck.appendix?.length ?? 0;

  return (
    <>
      <span className={c.num} aria-hidden>{n}</span>
      <span>
        <span className={c.rowTitle}>{deck.title}</span>
        <span className={c.rowSummary}>
          <Copy text={deck.summary} />
        </span>
        {/* What to watch for — named up front so the room evaluates the
            thing the project is actually evidence of. */}
        {deck.shows.length > 0 && (
          <span className={c.shows}>
            {deck.shows.map((item) => (
              <span key={item} className={c.show}>
                <Copy text={item} />
              </span>
            ))}
          </span>
        )}
      </span>
      <span className={c.rowMeta}>
        {deck.status && <span className={c.todo}>{deck.status}</span>}
        <span>{deck.company}, {deck.year}</span>
        {deck.link ? (
          <span>{deck.link.label} ↗</span>
        ) : (
          <>
            <span>About {deck.minutes} min</span>
            <span>{deck.slides.length} slides{backup > 0 && ` + ${backup} backup`}</span>
          </>
        )}
        {remaining > 0 && <span className={c.todo}>{remaining} to fill</span>}
      </span>
      <Mark />
    </>
  );
}

function Copy({ text }: { text: string }) {
  return isPlaceholder(text) ? <span className={c.ph}>{text}</span> : <>{text}</>;
}
