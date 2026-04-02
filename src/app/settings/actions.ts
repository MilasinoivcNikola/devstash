'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  updateEditorPreferences,
  type EditorPreferences,
} from '@/lib/db/editor-preferences';

export async function changePasswordAction(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (newPassword !== confirmPassword) return 'New passwords do not match.';
  if (newPassword.length < 8) return 'New password must be at least 8 characters.';

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password) return 'Password change is not available for this account.';

  const passwordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatch) return 'Current password is incorrect.';

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });
  } catch {
    return 'Something went wrong. Please try again.';
  }

  redirect('/settings?passwordChanged=1');
}

const VALID_THEMES = ['vs-dark', 'monokai', 'github-dark'];
const VALID_FONT_SIZES = [10, 12, 14, 16, 18, 20];
const VALID_TAB_SIZES = [2, 4, 8];

export async function updateEditorPreferencesAction(
  preferences: Partial<EditorPreferences>,
): Promise<{ success: boolean; data?: EditorPreferences; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' };

  if (preferences.theme && !VALID_THEMES.includes(preferences.theme)) {
    return { success: false, error: 'Invalid theme' };
  }
  if (preferences.fontSize && !VALID_FONT_SIZES.includes(preferences.fontSize)) {
    return { success: false, error: 'Invalid font size' };
  }
  if (preferences.tabSize && !VALID_TAB_SIZES.includes(preferences.tabSize)) {
    return { success: false, error: 'Invalid tab size' };
  }

  try {
    const updated = await updateEditorPreferences(session.user.id, preferences);
    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

export async function deleteAccountAction(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  try {
    await prisma.user.delete({ where: { id: session.user.id } });
  } catch {
    return 'Something went wrong. Please try again.';
  }

  await signOut({ redirectTo: '/' });
  return null;
}
