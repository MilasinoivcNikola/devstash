import { prisma } from '@/lib/prisma';

type ItemWithType = { item: { itemTypeId: string; itemType: { id: string; name: string; icon: string; color: string } } };

function computeDominantColor(items: ItemWithType[]): string {
  const counts = new Map<string, { color: string; count: number }>();
  for (const { item } of items) {
    const existing = counts.get(item.itemTypeId);
    if (existing) existing.count++;
    else counts.set(item.itemTypeId, { color: item.itemType.color, count: 1 });
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count)[0]?.color ?? '#6b7280';
}

export type CollectionWithMeta = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  types: Array<{ id: string; name: string; icon: string; color: string }>;
  dominantColor: string;
};

export async function getRecentCollections(userId: string): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    include: {
      items: {
        take: 50,
        include: {
          item: {
            include: {
              itemType: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 6,
  });

  return collections.map((collection) => {
    const itemCount = collection.items.length;

    const typeCounts = new Map<
      string,
      { id: string; name: string; icon: string; color: string; count: number }
    >();

    for (const { item } of collection.items) {
      const key = item.itemTypeId;
      const existing = typeCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        typeCounts.set(key, {
          id: item.itemType.id,
          name: item.itemType.name,
          icon: item.itemType.icon,
          color: item.itemType.color,
          count: 1,
        });
      }
    }

    const types = Array.from(typeCounts.values())
      .sort((a, b) => b.count - a.count)
      .map(({ id, name, icon, color }) => ({ id, name, icon, color }));

    const dominantColor = types[0]?.color ?? '#6b7280';

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      itemCount,
      types,
      dominantColor,
    };
  });
}

export async function getCollectionStats(userId: string) {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);
  return { total, favorites };
}

export type SidebarCollection = {
  id: string;
  name: string;
  isFavorite: boolean;
  dominantColor: string;
};

export async function getSidebarCollections(userId: string): Promise<{
  favorites: SidebarCollection[];
  recent: SidebarCollection[];
}> {
  const itemsInclude = {
    take: 50,
    include: { item: { include: { itemType: true } } },
  } as const;

  const [favorites, recent] = await Promise.all([
    prisma.collection.findMany({
      where: { userId, isFavorite: true },
      take: 10,
      include: { items: itemsInclude },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.collection.findMany({
      where: { userId, isFavorite: false },
      take: 5,
      include: { items: itemsInclude },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const mapCollection = (c: (typeof favorites)[number]): SidebarCollection => ({
    id: c.id,
    name: c.name,
    isFavorite: c.isFavorite,
    dominantColor: computeDominantColor(c.items),
  });

  return {
    favorites: favorites.map(mapCollection),
    recent: recent.map(mapCollection),
  };
}
