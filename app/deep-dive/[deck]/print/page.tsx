import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PrintDeck from '@/components/deep-dive/PrintDeck';
import { DECKS, getDeck } from '@/lib/deepDive';

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
  // The PDF's default filename comes from the title.
  return deck ? { title: { absolute: `${deck.title} — Joshua Bussey` } } : {};
}

export default async function PrintPage({ params }: { params: Promise<{ deck: string }> }) {
  const { deck: slug } = await params;
  const deck = getDeck(slug);
  if (!deck) notFound();

  return <PrintDeck deck={deck} />;
}
