import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEditorPreferences, updateEditorPreferences, DEFAULT_EDITOR_PREFERENCES } from './editor-preferences';
import { prisma } from '@/lib/prisma';

const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockUpdate = vi.mocked(prisma.user.update);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getEditorPreferences', () => {
  it('returns defaults when user has no preferences', async () => {
    mockFindUnique.mockResolvedValue({ editorPreferences: null } as never);
    const result = await getEditorPreferences('user-1');
    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it('returns defaults when user not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await getEditorPreferences('user-1');
    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it('merges stored preferences with defaults', async () => {
    mockFindUnique.mockResolvedValue({
      editorPreferences: { fontSize: 16, theme: 'monokai' },
    } as never);
    const result = await getEditorPreferences('user-1');
    expect(result).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 16,
      theme: 'monokai',
    });
  });
});

describe('updateEditorPreferences', () => {
  it('merges partial update with current preferences and saves', async () => {
    mockFindUnique.mockResolvedValue({ editorPreferences: null } as never);
    mockUpdate.mockResolvedValue({} as never);

    const result = await updateEditorPreferences('user-1', { fontSize: 18 });

    expect(result).toEqual({ ...DEFAULT_EDITOR_PREFERENCES, fontSize: 18 });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { editorPreferences: { ...DEFAULT_EDITOR_PREFERENCES, fontSize: 18 } },
    });
  });
});
