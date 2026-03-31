import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateItem } from './items';
import { auth } from '@/auth';
import * as itemsDb from '@/lib/db/items';

const mockAuth = vi.mocked(auth);
const mockUpdateItemDb = vi.spyOn(itemsDb, 'updateItem');

const session = { user: { id: 'user-1', email: 'user@test.com' } };

const updatedItemDetail: itemsDb.ItemDetail = {
  id: 'item-1',
  title: 'Updated Title',
  description: 'desc',
  isFavorite: false,
  isPinned: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-02-01'),
  tags: ['react'],
  itemType: { id: 'type-1', name: 'snippet', icon: 'Code', color: '#3b82f6' },
  content: 'code here',
  contentType: 'TEXT',
  language: 'typescript',
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  collections: [],
};

const validInput = {
  title: 'Updated Title',
  description: 'desc',
  content: 'code here',
  url: null,
  language: 'typescript',
  tags: ['react'],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('updateItem server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateItem('item-1', validInput);

    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toBe('Unauthorized');
  });

  it('returns error when title is empty', async () => {
    mockAuth.mockResolvedValue(session as never);

    const result = await updateItem('item-1', { ...validInput, title: '' });

    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/title/i);
  });

  it('returns error when URL is invalid', async () => {
    mockAuth.mockResolvedValue(session as never);

    const result = await updateItem('item-1', { ...validInput, url: 'not-a-url' });

    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/url/i);
  });

  it('returns error when item not found or not owned', async () => {
    mockAuth.mockResolvedValue(session as never);
    mockUpdateItemDb.mockResolvedValue(null);

    const result = await updateItem('item-99', validInput);

    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toBe('Item not found');
  });

  it('returns success with updated item on happy path', async () => {
    mockAuth.mockResolvedValue(session as never);
    mockUpdateItemDb.mockResolvedValue(updatedItemDetail);

    const result = await updateItem('item-1', validInput);

    expect(result.success).toBe(true);
    expect((result as { success: true; data: itemsDb.ItemDetail }).data.title).toBe('Updated Title');
  });

  it('passes trimmed title and null optional fields to db query', async () => {
    mockAuth.mockResolvedValue(session as never);
    mockUpdateItemDb.mockResolvedValue(updatedItemDetail);

    await updateItem('item-1', { ...validInput, title: '  My Title  ', description: null, content: null });

    expect(mockUpdateItemDb).toHaveBeenCalledWith(
      'user-1',
      'item-1',
      expect.objectContaining({
        title: 'My Title',
        description: null,
        content: null,
      })
    );
  });

  it('converts empty string url to null', async () => {
    mockAuth.mockResolvedValue(session as never);
    mockUpdateItemDb.mockResolvedValue(updatedItemDetail);

    await updateItem('item-1', { ...validInput, url: '' });

    expect(mockUpdateItemDb).toHaveBeenCalledWith(
      'user-1',
      'item-1',
      expect.objectContaining({ url: null })
    );
  });
});
