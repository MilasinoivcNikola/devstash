import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCollection, getUserCollections, updateCollection, deleteCollection, toggleFavoriteCollection } from './collections';
import { auth } from '@/auth';
import {
  createCollection as createCollectionDb,
  updateCollection as updateCollectionDb,
  deleteCollection as deleteCollectionDb,
  getUserCollections as getUserCollectionsDb,
  toggleFavoriteCollection as toggleFavoriteCollectionDb,
} from '@/lib/db/collections';

vi.mock('@/lib/db/collections', () => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  getUserCollections: vi.fn(),
  toggleFavoriteCollection: vi.fn(),
}));

const mockAuth = vi.mocked(auth);
const mockCreateDb = vi.mocked(createCollectionDb);
const mockUpdateDb = vi.mocked(updateCollectionDb);
const mockDeleteDb = vi.mocked(deleteCollectionDb);
const mockGetUserCollectionsDb = vi.mocked(getUserCollectionsDb);
const mockToggleFavoriteDb = vi.mocked(toggleFavoriteCollectionDb);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUserCollections action', () => {
  it('returns empty array when not logged in', async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await getUserCollections();

    expect(result).toEqual([]);
    expect(mockGetUserCollectionsDb).not.toHaveBeenCalled();
  });

  it('returns collections for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockGetUserCollectionsDb.mockResolvedValue([
      { id: 'col-1', name: 'React Patterns' },
      { id: 'col-2', name: 'Python Scripts' },
    ]);

    const result = await getUserCollections();

    expect(result).toEqual([
      { id: 'col-1', name: 'React Patterns' },
      { id: 'col-2', name: 'Python Scripts' },
    ]);
    expect(mockGetUserCollectionsDb).toHaveBeenCalledWith('user-1');
  });
});

describe('createCollection action', () => {
  it('returns unauthorized when not logged in', async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await createCollection({ name: 'Test' });

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockCreateDb).not.toHaveBeenCalled();
  });

  it('returns validation error for empty name', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);

    const result = await createCollection({ name: '' });

    expect(result).toEqual({ success: false, error: 'Name is required' });
    expect(mockCreateDb).not.toHaveBeenCalled();
  });

  it('returns validation error for whitespace-only name', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);

    const result = await createCollection({ name: '   ' });

    expect(result).toEqual({ success: false, error: 'Name is required' });
  });

  it('creates collection successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockCreateDb.mockResolvedValue({
      id: 'col-1',
      name: 'React Patterns',
      description: 'React design patterns',
      isFavorite: false,
      createdAt: new Date(),
    } as never);

    const result = await createCollection({
      name: 'React Patterns',
      description: 'React design patterns',
    });

    expect(result).toEqual({
      success: true,
      data: { id: 'col-1', name: 'React Patterns' },
    });
    expect(mockCreateDb).toHaveBeenCalledWith('user-1', {
      name: 'React Patterns',
      description: 'React design patterns',
    });
  });

  it('passes null description when omitted', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockCreateDb.mockResolvedValue({
      id: 'col-2',
      name: 'Quick Notes',
      description: null,
      isFavorite: false,
      createdAt: new Date(),
    } as never);

    const result = await createCollection({ name: 'Quick Notes' });

    expect(result.success).toBe(true);
    expect(mockCreateDb).toHaveBeenCalledWith('user-1', {
      name: 'Quick Notes',
      description: null,
    });
  });
});

describe('updateCollection action', () => {
  it('returns unauthorized when not logged in', async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await updateCollection({ id: 'col-1', name: 'Test' });

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockUpdateDb).not.toHaveBeenCalled();
  });

  it('returns validation error for empty name', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);

    const result = await updateCollection({ id: 'col-1', name: '' });

    expect(result).toEqual({ success: false, error: 'Name is required' });
    expect(mockUpdateDb).not.toHaveBeenCalled();
  });

  it('updates collection successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockUpdateDb.mockResolvedValue({
      id: 'col-1',
      name: 'Updated',
      description: 'New desc',
    } as never);

    const result = await updateCollection({
      id: 'col-1',
      name: 'Updated',
      description: 'New desc',
    });

    expect(result).toEqual({
      success: true,
      data: { id: 'col-1', name: 'Updated' },
    });
    expect(mockUpdateDb).toHaveBeenCalledWith('user-1', 'col-1', {
      name: 'Updated',
      description: 'New desc',
    });
  });

  it('returns error when collection not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockUpdateDb.mockRejectedValue(new Error('Record not found'));

    const result = await updateCollection({ id: 'nonexistent', name: 'Test' });

    expect(result).toEqual({ success: false, error: 'Collection not found' });
  });
});

describe('toggleFavoriteCollection action', () => {
  it('returns unauthorized when not logged in', async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await toggleFavoriteCollection('col-1');

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockToggleFavoriteDb).not.toHaveBeenCalled();
  });

  it('returns error when collection not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockToggleFavoriteDb.mockResolvedValue(null);

    const result = await toggleFavoriteCollection('col-99');

    expect(result).toEqual({ success: false, error: 'Collection not found' });
  });

  it('returns success with new isFavorite value', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockToggleFavoriteDb.mockResolvedValue(true);

    const result = await toggleFavoriteCollection('col-1');

    expect(result).toEqual({ success: true, isFavorite: true });
    expect(mockToggleFavoriteDb).toHaveBeenCalledWith('user-1', 'col-1');
  });
});

describe('deleteCollection action', () => {
  it('returns unauthorized when not logged in', async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await deleteCollection('col-1');

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockDeleteDb).not.toHaveBeenCalled();
  });

  it('deletes collection successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockDeleteDb.mockResolvedValue({ id: 'col-1' } as never);

    const result = await deleteCollection('col-1');

    expect(result).toEqual({ success: true, data: { id: 'col-1' } });
    expect(mockDeleteDb).toHaveBeenCalledWith('user-1', 'col-1');
  });

  it('returns error when collection not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockDeleteDb.mockRejectedValue(new Error('Record not found'));

    const result = await deleteCollection('nonexistent');

    expect(result).toEqual({ success: false, error: 'Collection not found' });
  });
});
