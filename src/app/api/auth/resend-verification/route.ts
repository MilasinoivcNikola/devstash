import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { EMAIL_VERIFICATION_ENABLED } from '@/lib/config';
import { checkRateLimit, getIp, rateLimiters } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = getIp(request.headers);

  const body = await request.json();
  const email = (body.email as string | undefined)?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const { limited, retryAfterMinutes } = await checkRateLimit(
    rateLimiters.resendVerification,
    `resend-verification:${ip}:${email}`,
  );

  if (limited) {
    return NextResponse.json(
      { error: `Too many attempts. Please try again in ${retryAfterMinutes} minute${retryAfterMinutes === 1 ? '' : 's'}.` },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterMinutes * 60) },
      },
    );
  }

  // Silent success — don't reveal whether the email exists
  if (!EMAIL_VERIFICATION_ENABLED) {
    return NextResponse.json({ success: true });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (user && !user.emailVerified) {
    // Delete any existing verification token for this email
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    const token = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, token);
  }

  return NextResponse.json({ success: true });
}
