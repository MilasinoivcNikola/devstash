import { prisma } from '@/lib/prisma';

export type ItemWithMeta = {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  tags: string[];
  itemType: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
};

function mapItem(item: {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  tags: Array<{ name: string }>;
  itemType: { id: string; name: string; icon: string; color: string };
}): ItemWithMeta {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    tags: item.tags.map((t) => t.name),
    itemType: item.itemType,
  };
}

const itemInclude = {
  itemType: true,
  tags: { select: { name: true } },
} as const;

export async function getPinnedItems(): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { isPinned: true },
    include: itemInclude,
    orderBy: { createdAt: 'desc' },
  });
  return items.map(mapItem);
}

export async function getRecentItems(limit = 10): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    include: itemInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return items.map(mapItem);
}

export async function getItemStats() {
  const [total, favorites] = await Promise.all([
    prisma.item.count(),
    prisma.item.count({ where: { isFavorite: true } }),
  ]);
  return { total, favorites };
}
