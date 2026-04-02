import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getItemById, updateItem, deleteItem, createItem, getItemsByCollection, toggleFavoriteItem, toggleItemPin } from './items';
import { prisma } from '@/lib/prisma';

const mockFindFirst = vi.mocked(prisma.item.findFirst);
const mockFindMany = vi.mocked(prisma.item.findMany);
const mockCount = vi.mocked(prisma.item.count);
const mockUpdate = vi.mocked(prisma.item.update);
const mockDelete = vi.mocked(prisma.item.delete);
const mockTransaction = vi.mocked(prisma.$transaction);
const mockItemCreate = vi.mocked(prisma.item.create);
const mockItemTypeFindFirst = vi.mocked(prisma.itemType.findFirst);

const baseItem = {
  id: 'item-1',
  title: 'useAuth Hook',
  description: 'Custom auth hook',
  isFavorite: true,
  isPinned: false,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  content: 'export function useAuth() {}',
  contentType: 'TEXT' as const,
  language: 'typescript',
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  tags: [{ name: 'react' }, { name: 'hooks' }],
  itemType: { id: 'type-1', name: 'snippet', icon: 'Code', color: '#3b82f6' },
  collections: [
    { collection: { id: 'col-1', name: 'React Patterns' } },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

const updatedItem = {
  ...baseItem,
  title: 'Updated Title',
  description: 'Updated desc',
  content: 'updated content',
  language: 'javascript',
  updatedAt: new Date('2024-02-01'),
};

describe('createItem', () => {
  it('returns null when item type is not found', async () => {
    mockItemTypeFindFirst.mockResolvedValue(null);

    const result = await createItem('user-1', {
      title: 'Test',
      description: null,
      content: 'code',
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      language: 'typescript',
      tags: [],
      itemTypeName: 'snippet',
      collectionIds: [],
    });

    expect(result).toBeNull();
    expect(mockItemCreate).not.toHaveBeenCalled();
  });

  it('creates item with collection connections', async () => {
    mockItemTypeFindFirst.mockResolvedValue({
      id: 'type-1',
      name: 'snippet',
      icon: 'Code',
      color: '#3b82f6',
      isSystem: true,
      userId: null,
    });
    mockItemCreate.mockResolvedValue(baseItem as never);

    await createItem('user-1', {
      title: 'useAuth Hook',
      description: null,
      content: 'code',
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      language: 'typescript',
      tags: ['react'],
      itemTypeName: 'snippet',
      collectionIds: ['col-1', 'col-2'],
    });

    expect(mockItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: {
            create: [
              { collectionId: 'col-1' },
              { collectionId: 'col-2' },
            ],
          },
        }),
      })
    );
  });

  it('creates item with empty collectionIds', async () => {
    mockItemTypeFindFirst.mockResolvedValue({
      id: 'type-1',
      name: 'snippet',
      icon: 'Code',
      color: '#3b82f6',
      isSystem: true,
      userId: null,
    });
    mockItemCreate.mockResolvedValue({ ...baseItem, collections: [] } as never);

    const result = await createItem('user-1', {
      title: 'Test',
      description: null,
      content: 'code',
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      language: null,
      tags: [],
      itemTypeName: 'snippet',
      collectionIds: [],
    });

    expect(result).not.toBeNull();
    expect(mockItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: { create: [] },
        }),
      })
    );
  });
});

describe('updateItem', () => {
  it('returns null when item does not belong to user', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await updateItem('user-1', 'item-99', {
      title: 'New Title',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      collectionIds: [],
    });

    expect(result).toBeNull();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('checks ownership with userId and id', async () => {
    mockFindFirst.mockResolvedValue(baseItem as never);
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        itemCollection: { deleteMany: vi.fn() },
        item: { update: vi.fn().mockResolvedValue(updatedItem) },
      };
      return (fn as (tx: typeof tx) => Promise<unknown>)(tx);
    });

    await updateItem('user-1', 'item-1', {
      title: 'Title',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      collectionIds: [],
    });

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: 'item-1', userId: 'user-1' },
    });
  });

  it('calls transaction with deleteMany and update', async () => {
    mockFindFirst.mockResolvedValue(baseItem as never);
    const mockTxDeleteMany = vi.fn();
    const mockTxUpdate = vi.fn().mockResolvedValue(updatedItem);
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        itemCollection: { deleteMany: mockTxDeleteMany },
        item: { update: mockTxUpdate },
      };
      return (fn as (tx: typeof tx) => Promise<unknown>)(tx);
    });

    await updateItem('user-1', 'item-1', {
      title: 'Updated Title',
      description: 'Updated desc',
      content: 'updated content',
      url: null,
      language: 'javascript',
      tags: ['react', 'new-tag'],
      collectionIds: ['col-1'],
    });

    expect(mockTxDeleteMany).toHaveBeenCalledWith({ where: { itemId: 'item-1' } });
    expect(mockTxUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
        data: expect.objectContaining({
          title: 'Updated Title',
          collections: {
            create: [{ collectionId: 'col-1' }],
          },
        }),
      })
    );
  });

  it('returns mapped ItemDetail on success', async () => {
    mockFindFirst.mockResolvedValue(baseItem as never);
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        itemCollection: { deleteMany: vi.fn() },
        item: { update: vi.fn().mockResolvedValue(updatedItem) },
      };
      return (fn as (tx: typeof tx) => Promise<unknown>)(tx);
    });

    const result = await updateItem('user-1', 'item-1', {
      title: 'Updated Title',
      description: 'Updated desc',
      content: 'updated content',
      url: null,
      language: 'javascript',
      tags: ['react', 'hooks'],
      collectionIds: [],
    });

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Updated Title');
    expect(result!.description).toBe('Updated desc');
    expect(result!.content).toBe('updated content');
    expect(result!.language).toBe('javascript');
    expect(result!.tags).toEqual(['react', 'hooks']);
    expect(result!.collections).toEqual([{ id: 'col-1', name: 'React Patterns' }]);
  });
});

describe('deleteItem', () => {
  it('returns deleted: false when item does not belong to user', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await deleteItem('user-1', 'item-99');

    expect(result.deleted).toBe(false);
    expect(result.fileUrl).toBeNull();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('deletes item and returns deleted: true when ownership check passes', async () => {
    mockFindFirst.mockResolvedValue(baseItem as never);
    mockDelete.mockResolvedValue(baseItem as never);

    const result = await deleteItem('user-1', 'item-1');

    expect(result.deleted).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
  });

  it('checks ownership with correct userId and id', async () => {
    mockFindFirst.mockResolvedValue(baseItem as never);
    mockDelete.mockResolvedValue(baseItem as never);

    await deleteItem('user-1', 'item-1');

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: 'item-1', userId: 'user-1' },
    });
  });
});

describe('getItemById', () => {
  it('returns null when item is not found', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await getItemById('user-1', 'item-1');

    expect(result).toBeNull();
  });

  it('queries with both userId and id for scoping', async () => {
    mockFindFirst.mockResolvedValue(null);

    await getItemById('user-1', 'item-99');

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-99', userId: 'user-1' },
      })
    );
  });

  it('returns mapped ItemDetail when item is found', async () => {
    mockFindFirst.mockResolvedValue(baseItem as never);

    const result = await getItemById('user-1', 'item-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('item-1');
    expect(result!.title).toBe('useAuth Hook');
    expect(result!.isFavorite).toBe(true);
    expect(result!.tags).toEqual(['react', 'hooks']);
    expect(result!.content).toBe('export function useAuth() {}');
    expect(result!.language).toBe('typescript');
    expect(result!.contentType).toBe('TEXT');
  });

  it('maps collections from join table to flat array', async () => {
    mockFindFirst.mockResolvedValue(baseItem as never);

    const result = await getItemById('user-1', 'item-1');

    expect(result!.collections).toEqual([{ id: 'col-1', name: 'React Patterns' }]);
  });

  it('returns empty collections array when item has none', async () => {
    mockFindFirst.mockResolvedValue({ ...baseItem, collections: [] } as never);

    const result = await getItemById('user-1', 'item-1');

    expect(result!.collections).toEqual([]);
  });

  it('passes through null optional fields', async () => {
    mockFindFirst.mockResolvedValue({
      ...baseItem,
      content: null,
      language: null,
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
    } as never);

    const result = await getItemById('user-1', 'item-1');

    expect(result!.content).toBeNull();
    expect(result!.language).toBeNull();
    expect(result!.url).toBeNull();
  });
});

describe('toggleFavoriteItem', () => {
  it('returns null when item does not belong to user', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await toggleFavoriteItem('user-1', 'item-99');

    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('flips isFavorite from false to true', async () => {
    mockFindFirst.mockResolvedValue({ ...baseItem, isFavorite: false } as never);
    mockUpdate.mockResolvedValue({ isFavorite: true } as never);

    const result = await toggleFavoriteItem('user-1', 'item-1');

    expect(result).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { isFavorite: true },
      select: { isFavorite: true },
    });
  });

  it('flips isFavorite from true to false', async () => {
    mockFindFirst.mockResolvedValue({ ...baseItem, isFavorite: true } as never);
    mockUpdate.mockResolvedValue({ isFavorite: false } as never);

    const result = await toggleFavoriteItem('user-1', 'item-1');

    expect(result).toBe(false);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { isFavorite: false },
      select: { isFavorite: true },
    });
  });
});

describe('toggleItemPin', () => {
  it('returns null when item does not belong to user', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await toggleItemPin('user-1', 'item-99');

    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('flips isPinned from false to true', async () => {
    mockFindFirst.mockResolvedValue({ ...baseItem, isPinned: false } as never);
    mockUpdate.mockResolvedValue({ isPinned: true } as never);

    const result = await toggleItemPin('user-1', 'item-1');

    expect(result).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { isPinned: true },
      select: { isPinned: true },
    });
  });

  it('flips isPinned from true to false', async () => {
    mockFindFirst.mockResolvedValue({ ...baseItem, isPinned: true } as never);
    mockUpdate.mockResolvedValue({ isPinned: false } as never);

    const result = await toggleItemPin('user-1', 'item-1');

    expect(result).toBe(false);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { isPinned: false },
      select: { isPinned: true },
    });
  });
});

describe('getItemsByCollection', () => {
  it('returns items filtered by collection and user', async () => {
    mockFindMany.mockResolvedValue([baseItem] as never);
    mockCount.mockResolvedValue(1 as never);

    const result = await getItemsByCollection('user-1', 'col-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('useAuth Hook');
    expect(result.total).toBe(1);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        collections: { some: { collectionId: 'col-1' } },
      },
      include: expect.objectContaining({
        itemType: true,
        tags: expect.any(Object),
      }),
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 21,
    });
  });

  it('returns empty result when collection has no items', async () => {
    mockFindMany.mockResolvedValue([] as never);
    mockCount.mockResolvedValue(0 as never);

    const result = await getItemsByCollection('user-1', 'col-1');

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
