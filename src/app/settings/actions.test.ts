import { describe, it, expect, vi, beforeEach } from 'vitest';
import { changePasswordAction, deleteAccountAction } from './actions';
import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

const mockAuth = vi.mocked(auth);
const mockSignOut = vi.mocked(signOut);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockUpdate = vi.mocked(prisma.user.update);
const mockDelete = vi.mocked(prisma.user.delete);
const mockCompare = vi.mocked(bcrypt.compare);
const mockHash = vi.mocked(bcrypt.hash);

const session = { user: { id: 'user-1', email: 'test@test.com' } };

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('changePasswordAction', () => {
  it('redirects to sign-in when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null as never);
    const fd = makeFormData({ currentPassword: 'a', newPassword: 'b', confirmPassword: 'b' });
    await expect(changePasswordAction(null, fd)).rejects.toThrow('NEXT_REDIRECT:/sign-in');
  });

  it('returns error when passwords do not match', async () => {
    mockAuth.mockResolvedValue(session as never);
    const fd = makeFormData({ currentPassword: 'old', newPassword: 'newpass1!', confirmPassword: 'different' });
    const result = await changePasswordAction(null, fd);
    expect(result).toBe('New passwords do not match.');
  });

  it('returns error when new password is too short', async () => {
    mockAuth.mockResolvedValue(session as never);
    const fd = makeFormData({ currentPassword: 'old', newPassword: 'short', confirmPassword: 'short' });
    const result = await changePasswordAction(null, fd);
    expect(result).toBe('New password must be at least 8 characters.');
  });

  it('returns error when user has no password (OAuth account)', async () => {
    mockAuth.mockResolvedValue(session as never);
    mockFindUnique.mockResolvedValue({ password: null } as never);
    const fd = makeFormData({ currentPassword: 'old', newPassword: 'newpass1!', confirmPassword: 'newpass1!' });
    const result = await changePasswordAction(null, fd);
    expect(result).toBe('Password change is not available for this account.');
  });

  it('returns error when current password is incorrect', async () => {
    mockAuth.mockResolvedValue(session as never);
    mockFindUnique.mockResolvedValue({ password: 'hashed' } as never);
    mockCompare.mockResolvedValue(false as never);
    const fd = makeFormData({ currentPassword: 'wrong', newPassword: 'newpass1!', confirmPassword: 'newpass1!' });
    const result = await changePasswordAction(null, fd);
    expect(result).toBe('Current password is incorrect.');
  });

  it('updates password and redirects on success', async () => {
    mockAuth.mockResolvedValue(session as never);
    mockFindUnique.mockResolvedValue({ password: 'hashed' } as never);
    mockCompare.mockResolvedValue(true as never);
    mockHash.mockResolvedValue('newhash' as never);
    mockUpdate.mockResolvedValue({} as never);

    const fd = makeFormData({ currentPassword: 'oldpass1!', newPassword: 'newpass1!', confirmPassword: 'newpass1!' });
    await expect(changePasswordAction(null, fd)).rejects.toThrow('NEXT_REDIRECT:/settings?passwordChanged=1');

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { password: 'newhash' },
    });
  });

  it('returns error when DB update fails', async () => {
    mockAuth.mockResolvedValue(session as never);
    mockFindUnique.mockResolvedValue({ password: 'hashed' } as never);
    mockCompare.mockResolvedValue(true as never);
    mockHash.mockResolvedValue('newhash' as never);
    mockUpdate.mockRejectedValue(new Error('DB error'));

    const fd = makeFormData({ currentPassword: 'oldpass1!', newPassword: 'newpass1!', confirmPassword: 'newpass1!' });
    const result = await changePasswordAction(null, fd);
    expect(result).toBe('Something went wrong. Please try again.');
  });
});

describe('deleteAccountAction', () => {
  it('redirects to sign-in when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null as never);
    await expect(deleteAccountAction()).rejects.toThrow('NEXT_REDIRECT:/sign-in');
  });

  it('deletes user and signs out on success', async () => {
    mockAuth.mockResolvedValue(session as never);
    mockDelete.mockResolvedValue({} as never);
    mockSignOut.mockResolvedValue(undefined as never);

    const result = await deleteAccountAction();
    expect(result).toBeNull();
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/' });
  });

  it('returns error when DB delete fails', async () => {
    mockAuth.mockResolvedValue(session as never);
    mockDelete.mockRejectedValue(new Error('DB error'));

    const result = await deleteAccountAction();
    expect(result).toBe('Something went wrong. Please try again.');
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
