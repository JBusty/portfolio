import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DeckPlayer from '@/components/deep-dive/DeckPlayer';
import { DECKS, getDeck, getNextDeck } from '@/lib/deepDive';

export const dynamicParams = false;

export function generateStaticParams() {
  return DECKS.map((deck) => ({ deck: deck.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ deck: string }>;
}): Promise<Metadata> {
  const { deck: slug } = await params;
  const deck = getDeck(slug);
  // The tab is on screen whenever the deck is not full screen, so it names the talk.
  return deck ? { title: { absolute: `${deck.title} — Joshua Bussey` } } : {};
}

export default async function DeckPage({ params }: { params: Promise<{ deck: string }> }) {
  const { deck: slug } = await params;
  const deck = getDeck(slug);
  if (!deck) notFound();

  const next = getNextDeck(slug);

  return (
    <DeckPlayer
      deck={deck}
      nextDeck={next && { slug: next.slug, title: next.title }}
    />
  );
}
