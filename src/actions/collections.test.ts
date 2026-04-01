import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCollection } from './collections';
import { auth } from '@/auth';
import { createCollection as createCollectionDb } from '@/lib/db/collections';

vi.mock('@/lib/db/collections', () => ({
  createCollection: vi.fn(),
}));

const mockAuth = vi.mocked(auth);
const mockCreateDb = vi.mocked(createCollectionDb);

beforeEach(() => {
  vi.clearAllMocks();
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
