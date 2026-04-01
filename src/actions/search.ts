'use server';

import { auth } from '@/auth';
import { getSearchItems, type SearchItem } from '@/lib/db/items';
import { getSearchCollections, type SearchCollection } from '@/lib/db/collections';

export type SearchData = {
  items: SearchItem[];
  collections: SearchCollection[];
};

export async function fetchSearchData(): Promise<SearchData> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { items: [], collections: [] };

  const [items, collections] = await Promise.all([
    getSearchItems(userId),
    getSearchCollections(userId),
  ]);

  return { items, collections };
}
