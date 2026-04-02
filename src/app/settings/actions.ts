'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';

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
