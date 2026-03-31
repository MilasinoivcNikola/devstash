import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getItemById, updateItem, deleteItem } from './items';
import { prisma } from '@/lib/prisma';

const mockFindFirst = vi.mocked(prisma.item.findFirst);
const mockUpdate = vi.mocked(prisma.item.update);
const mockDelete = vi.mocked(prisma.item.delete);

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
    });

    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('checks ownership with userId and id', async () => {
    mockFindFirst.mockResolvedValue(baseItem as never);
    mockUpdate.mockResolvedValue(updatedItem as never);

    await updateItem('user-1', 'item-1', {
      title: 'Title',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: 'item-1', userId: 'user-1' },
    });
  });

  it('calls update with correct fields and tag pattern', async () => {
    mockFindFirst.mockResolvedValue(baseItem as never);
    mockUpdate.mockResolvedValue(updatedItem as never);

    await updateItem('user-1', 'item-1', {
      title: 'Updated Title',
      description: 'Updated desc',
      content: 'updated content',
      url: null,
      language: 'javascript',
      tags: ['react', 'new-tag'],
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
        data: expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated desc',
          content: 'updated content',
          language: 'javascript',
          tags: {
            set: [],
            connectOrCreate: [
              { where: { name: 'react' }, create: { name: 'react' } },
              { where: { name: 'new-tag' }, create: { name: 'new-tag' } },
            ],
          },
        }),
      })
    );
  });

  it('returns mapped ItemDetail on success', async () => {
    mockFindFirst.mockResolvedValue(baseItem as never);
    mockUpdate.mockResolvedValue(updatedItem as never);

    const result = await updateItem('user-1', 'item-1', {
      title: 'Updated Title',
      description: 'Updated desc',
      content: 'updated content',
      url: null,
      language: 'javascript',
      tags: ['react', 'hooks'],
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
  it('returns false when item does not belong to user', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await deleteItem('user-1', 'item-99');

    expect(result).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('deletes item and returns true when ownership check passes', async () => {
    mockFindFirst.mockResolvedValue(baseItem as never);
    mockDelete.mockResolvedValue(baseItem as never);

    const result = await deleteItem('user-1', 'item-1');

    expect(result).toBe(true);
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
