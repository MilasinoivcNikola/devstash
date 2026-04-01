import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRecentCollections, getSidebarCollections } from './collections';
import { prisma } from '@/lib/prisma';

const mockCollectionFindMany = vi.mocked(prisma.collection.findMany);

const snippetType = { id: 'type-1', name: 'snippet', icon: 'Code', color: '#3b82f6' };
const promptType = { id: 'type-2', name: 'prompt', icon: 'Sparkles', color: '#8b5cf6' };

function makeItem(itemType: typeof snippetType) {
  return { item: { itemTypeId: itemType.id, itemType } };
}

function makeCollection(overrides: Record<string, unknown> = {}) {
  return {
    id: 'col-1',
    name: 'React Patterns',
    description: null,
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user-1',
    defaultTypeId: null,
    items: [makeItem(snippetType), makeItem(snippetType), makeItem(promptType)],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getRecentCollections', () => {
  it('maps collections with correct type counts and dominant color', async () => {
    mockCollectionFindMany.mockResolvedValue([makeCollection()] as never);

    const result = await getRecentCollections('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].itemCount).toBe(3);
    expect(result[0].dominantColor).toBe('#3b82f6'); // snippet is dominant (2 vs 1)
    expect(result[0].types).toHaveLength(2);
    expect(result[0].types[0].name).toBe('snippet');
    expect(result[0].types[1].name).toBe('prompt');
  });

  it('returns default gray color for empty collections', async () => {
    mockCollectionFindMany.mockResolvedValue([makeCollection({ items: [] })] as never);

    const result = await getRecentCollections('user-1');

    expect(result[0].dominantColor).toBe('#6b7280');
    expect(result[0].types).toHaveLength(0);
    expect(result[0].itemCount).toBe(0);
  });

  it('passes take: 50 for nested items', async () => {
    mockCollectionFindMany.mockResolvedValue([] as never);

    await getRecentCollections('user-1');

    expect(mockCollectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          items: expect.objectContaining({ take: 50 }),
        }),
      }),
    );
  });
});

describe('getSidebarCollections', () => {
  it('splits favorites and recent into separate queries', async () => {
    const favCollection = makeCollection({ id: 'fav-1', name: 'Favs', isFavorite: true });
    const recentCollection = makeCollection({ id: 'rec-1', name: 'Recent', isFavorite: false });

    mockCollectionFindMany
      .mockResolvedValueOnce([favCollection] as never)
      .mockResolvedValueOnce([recentCollection] as never);

    const result = await getSidebarCollections('user-1');

    expect(result.favorites).toHaveLength(1);
    expect(result.favorites[0].name).toBe('Favs');
    expect(result.favorites[0].isFavorite).toBe(true);
    expect(result.recent).toHaveLength(1);
    expect(result.recent[0].name).toBe('Recent');
    expect(result.recent[0].isFavorite).toBe(false);
  });

  it('computes dominant color from item types', async () => {
    const collection = makeCollection({
      isFavorite: true,
      items: [makeItem(promptType), makeItem(promptType), makeItem(snippetType)],
    });

    mockCollectionFindMany
      .mockResolvedValueOnce([collection] as never)
      .mockResolvedValueOnce([] as never);

    const result = await getSidebarCollections('user-1');

    expect(result.favorites[0].dominantColor).toBe('#8b5cf6'); // prompt dominant
  });

  it('applies take limits to both queries', async () => {
    mockCollectionFindMany
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    await getSidebarCollections('user-1');

    expect(mockCollectionFindMany).toHaveBeenCalledTimes(2);
    // First call: favorites with take: 10
    expect(mockCollectionFindMany.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: { userId: 'user-1', isFavorite: true },
        take: 10,
      }),
    );
    // Second call: recent with take: 5
    expect(mockCollectionFindMany.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        where: { userId: 'user-1', isFavorite: false },
        take: 5,
      }),
    );
  });
});
