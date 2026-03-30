'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function resetPasswordAction(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Validate inputs — return error string (shown inline, no redirect)
  if (password !== confirmPassword) return 'Passwords do not match.';
  if (password.length < 8) return 'Password must be at least 8 characters.';

  // Validate token — redirect to terminal error page (token not re-embedded)
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || !record.identifier.startsWith('reset:')) {
    redirect('/reset-password?error=invalid_token');
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    redirect('/reset-password?error=expired_token');
  }

  const email = record.identifier.replace('reset:', '');
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  } catch {
    return 'Something went wrong. Please try again.';
  }

  await prisma.verificationToken.delete({ where: { token } });

  redirect('/sign-in?reset=1');
}
