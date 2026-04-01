import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRecentCollections, getSidebarCollections, createCollection, getUserCollections, getAllCollections, getCollectionById } from './collections';
import { prisma } from '@/lib/prisma';

const mockCollectionFindMany = vi.mocked(prisma.collection.findMany);
const mockCollectionCreate = vi.mocked(prisma.collection.create);
const mockCollectionFindFirst = vi.mocked(prisma.collection.findFirst);

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

describe('createCollection', () => {
  it('creates a collection with name and description', async () => {
    const created = {
      id: 'col-new',
      name: 'My Collection',
      description: 'A test collection',
      isFavorite: false,
      createdAt: new Date(),
    };
    mockCollectionCreate.mockResolvedValue(created as never);

    const result = await createCollection('user-1', {
      name: 'My Collection',
      description: 'A test collection',
    });

    expect(result).toEqual(created);
    expect(mockCollectionCreate).toHaveBeenCalledWith({
      data: {
        name: 'My Collection',
        description: 'A test collection',
        userId: 'user-1',
      },
      select: {
        id: true,
        name: true,
        description: true,
        isFavorite: true,
        createdAt: true,
      },
    });
  });

  it('creates collection with null description', async () => {
    const created = {
      id: 'col-new',
      name: 'No Desc',
      description: null,
      isFavorite: false,
      createdAt: new Date(),
    };
    mockCollectionCreate.mockResolvedValue(created as never);

    const result = await createCollection('user-1', {
      name: 'No Desc',
      description: null,
    });

    expect(result.description).toBeNull();
  });
});

describe('getUserCollections', () => {
  it('returns collections with id and name sorted by name', async () => {
    mockCollectionFindMany.mockResolvedValue([
      { id: 'col-1', name: 'Alpha' },
      { id: 'col-2', name: 'Beta' },
    ] as never);

    const result = await getUserCollections('user-1');

    expect(result).toEqual([
      { id: 'col-1', name: 'Alpha' },
      { id: 'col-2', name: 'Beta' },
    ]);
    expect(mockCollectionFindMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  });

  it('returns empty array when user has no collections', async () => {
    mockCollectionFindMany.mockResolvedValue([] as never);

    const result = await getUserCollections('user-1');

    expect(result).toEqual([]);
  });
});

describe('getAllCollections', () => {
  it('returns all collections without take limit', async () => {
    mockCollectionFindMany.mockResolvedValue([
      makeCollection({ id: 'col-1', name: 'First' }),
      makeCollection({ id: 'col-2', name: 'Second' }),
    ] as never);

    const result = await getAllCollections('user-1');

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('First');
    expect(result[1].name).toBe('Second');
    expect(mockCollectionFindMany).toHaveBeenCalledWith(
      expect.not.objectContaining({ take: expect.any(Number) }),
    );
  });

  it('computes type metadata the same as getRecentCollections', async () => {
    mockCollectionFindMany.mockResolvedValue([makeCollection()] as never);

    const result = await getAllCollections('user-1');

    expect(result[0].itemCount).toBe(3);
    expect(result[0].dominantColor).toBe('#3b82f6');
    expect(result[0].types[0].name).toBe('snippet');
  });

  it('returns empty array when user has no collections', async () => {
    mockCollectionFindMany.mockResolvedValue([] as never);

    const result = await getAllCollections('user-1');

    expect(result).toEqual([]);
  });
});

describe('getCollectionById', () => {
  it('returns collection when found and owned by user', async () => {
    mockCollectionFindFirst.mockResolvedValue({
      id: 'col-1',
      name: 'React Patterns',
      description: 'Useful patterns',
      isFavorite: true,
    } as never);

    const result = await getCollectionById('user-1', 'col-1');

    expect(result).toEqual({
      id: 'col-1',
      name: 'React Patterns',
      description: 'Useful patterns',
      isFavorite: true,
    });
    expect(mockCollectionFindFirst).toHaveBeenCalledWith({
      where: { id: 'col-1', userId: 'user-1' },
      select: { id: true, name: true, description: true, isFavorite: true },
    });
  });

  it('returns null when collection not found', async () => {
    mockCollectionFindFirst.mockResolvedValue(null);

    const result = await getCollectionById('user-1', 'nonexistent');

    expect(result).toBeNull();
  });
});
