import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getItemById } from './items';
import { prisma } from '@/lib/prisma';

const mockFindFirst = vi.mocked(prisma.item.findFirst);

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
