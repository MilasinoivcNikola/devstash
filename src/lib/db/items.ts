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

export async function getPinnedItems(userId: string): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    include: itemInclude,
    orderBy: { createdAt: 'desc' },
  });
  return items.map(mapItem);
}

export async function getRecentItems(userId: string, limit = 10): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    include: itemInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return items.map(mapItem);
}

export async function getItemStats(userId: string) {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);
  return { total, favorites };
}

export type SidebarItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
};

export async function getItemsByType(userId: string, typeName: string): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { userId, itemType: { name: typeName } },
    include: itemInclude,
    orderBy: { createdAt: 'desc' },
  });
  return items.map(mapItem);
}

export type ItemDetail = ItemWithMeta & {
  content: string | null;
  contentType: string;
  language: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  updatedAt: Date;
  collections: Array<{ id: string; name: string }>;
};

export async function getItemById(userId: string, id: string): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id, userId },
    include: {
      ...itemInclude,
      collections: {
        include: { collection: { select: { id: true, name: true } } },
      },
    },
  });
  if (!item) return null;
  return {
    ...mapItem(item),
    content: item.content,
    contentType: item.contentType,
    language: item.language,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    updatedAt: item.updatedAt,
    collections: item.collections.map((ic) => ic.collection),
  };
}

const CONTENT_TYPE_MAP: Record<string, 'TEXT' | 'FILE' | 'URL'> = {
  snippet: 'TEXT',
  prompt: 'TEXT',
  command: 'TEXT',
  note: 'TEXT',
  link: 'URL',
  file: 'FILE',
  image: 'FILE',
};

export type CreateItemData = {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  tags: string[];
  itemTypeName: string;
};

export async function createItem(userId: string, data: CreateItemData): Promise<ItemDetail | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: data.itemTypeName, isSystem: true },
  });
  if (!itemType) return null;

  const contentType = CONTENT_TYPE_MAP[data.itemTypeName] ?? 'TEXT';

  const created = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      language: data.language,
      contentType,
      userId,
      itemTypeId: itemType.id,
      tags: {
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: {
      ...itemInclude,
      collections: {
        include: { collection: { select: { id: true, name: true } } },
      },
    },
  });

  return {
    ...mapItem(created),
    content: created.content,
    contentType: created.contentType,
    language: created.language,
    url: created.url,
    fileUrl: created.fileUrl,
    fileName: created.fileName,
    fileSize: created.fileSize,
    updatedAt: created.updatedAt,
    collections: created.collections.map((ic) => ic.collection),
  };
}

export type UpdateItemData = {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
};

export async function updateItem(userId: string, id: string, data: UpdateItemData): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({ where: { id, userId } });
  if (!item) return null;

  const updated = await prisma.item.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        set: [],
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: {
      ...itemInclude,
      collections: {
        include: { collection: { select: { id: true, name: true } } },
      },
    },
  });

  return {
    ...mapItem(updated),
    content: updated.content,
    contentType: updated.contentType,
    language: updated.language,
    url: updated.url,
    fileUrl: updated.fileUrl,
    fileName: updated.fileName,
    fileSize: updated.fileSize,
    updatedAt: updated.updatedAt,
    collections: updated.collections.map((ic) => ic.collection),
  };
}

export async function deleteItem(
  userId: string,
  id: string
): Promise<{ deleted: boolean; fileUrl: string | null }> {
  const item = await prisma.item.findFirst({ where: { id, userId } });
  if (!item) return { deleted: false, fileUrl: null };
  await prisma.item.delete({ where: { id } });
  return { deleted: true, fileUrl: item.fileUrl };
}

export async function getSidebarItemTypes(userId: string): Promise<SidebarItemType[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    include: { _count: { select: { items: { where: { userId } } } } },
  });
  return types.map((t) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    color: t.color,
    count: t._count.items,
  }));
}
