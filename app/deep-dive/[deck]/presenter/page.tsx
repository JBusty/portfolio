import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Presenter from '@/components/deep-dive/Presenter';
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
  return deck ? { title: { absolute: `Presenter view: ${deck.title}` } } : {};
}

export default async function PresenterPage({ params }: { params: Promise<{ deck: string }> }) {
  const { deck: slug } = await params;
  const deck = getDeck(slug);
  if (!deck) notFound();

  const next = getNextDeck(slug);

  return (
    <Presenter
      deck={deck}
      nextDeck={next && { slug: next.slug, title: next.title }}
    />
  );
}
