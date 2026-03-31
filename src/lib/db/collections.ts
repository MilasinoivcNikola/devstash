import { prisma } from '@/lib/prisma';

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
  const collections = await prisma.collection.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          item: { include: { itemType: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const mapped: SidebarCollection[] = collections.map((c) => {
    const typeCounts = new Map<string, { color: string; count: number }>();
    for (const { item } of c.items) {
      const key = item.itemTypeId;
      const existing = typeCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        typeCounts.set(key, { color: item.itemType.color, count: 1 });
      }
    }
    const sorted = Array.from(typeCounts.values()).sort((a, b) => b.count - a.count);
    return {
      id: c.id,
      name: c.name,
      isFavorite: c.isFavorite,
      dominantColor: sorted[0]?.color ?? '#6b7280',
    };
  });

  return {
    favorites: mapped.filter((c) => c.isFavorite),
    recent: mapped.filter((c) => !c.isFavorite),
  };
}
