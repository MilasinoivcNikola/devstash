import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSearchData } from './search';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const mockAuth = vi.mocked(auth);
const mockItemFindMany = vi.mocked(prisma.item.findMany);
const mockCollectionFindMany = vi.mocked(prisma.collection.findMany);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchSearchData', () => {
  it('returns empty arrays when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await fetchSearchData();

    expect(result).toEqual({ items: [], collections: [] });
    expect(mockItemFindMany).not.toHaveBeenCalled();
    expect(mockCollectionFindMany).not.toHaveBeenCalled();
  });

  it('returns items and collections for authenticated user', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
      expires: '',
    } as never);

    mockItemFindMany.mockResolvedValue([
      {
        id: 'item-1',
        title: 'My Snippet',
        itemType: { name: 'snippet', icon: 'Code', color: '#3b82f6' },
      },
    ] as never);

    mockCollectionFindMany.mockResolvedValue([
      {
        id: 'col-1',
        name: 'React Patterns',
        _count: { items: 5 },
      },
    ] as never);

    const result = await fetchSearchData();

    expect(result.items).toEqual([
      {
        id: 'item-1',
        title: 'My Snippet',
        typeName: 'snippet',
        typeIcon: 'Code',
        typeColor: '#3b82f6',
      },
    ]);
    expect(result.collections).toEqual([
      { id: 'col-1', name: 'React Patterns', itemCount: 5 },
    ]);
  });

  it('scopes queries to the authenticated user', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-42', name: 'Test', email: 'test@test.com' },
      expires: '',
    } as never);

    mockItemFindMany.mockResolvedValue([] as never);
    mockCollectionFindMany.mockResolvedValue([] as never);

    await fetchSearchData();

    expect(mockItemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-42' } })
    );
    expect(mockCollectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-42' } })
    );
  });
});
