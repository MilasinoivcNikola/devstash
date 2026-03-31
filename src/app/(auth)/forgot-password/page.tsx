import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimit, getIp, rateLimiters } from '@/lib/rate-limit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  searchParams: Promise<{ sent?: string; error?: string; retry?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { sent, error, retry } = await searchParams;

  async function forgotPasswordAction(formData: FormData) {
    'use server';
    const email = (formData.get('email') as string).trim().toLowerCase();

    if (!email) {
      redirect('/forgot-password');
    }

    const ip = getIp(await headers());
    const { limited, retryAfterMinutes } = await checkRateLimit(
      rateLimiters.forgotPassword,
      `forgot-password:${ip}`,
    );
    if (limited) {
      redirect(`/forgot-password?error=rate_limited&retry=${retryAfterMinutes}`);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    // Always redirect to prevent email enumeration
    if (user?.password) {
      const token = randomBytes(32).toString('hex');
      const identifier = `reset:${email}`;

      // Remove any existing reset token for this email
      await prisma.verificationToken.deleteMany({ where: { identifier } });

      await prisma.verificationToken.create({
        data: {
          identifier,
          token,
          expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      await sendPasswordResetEmail(email, token);
    }

    redirect('/forgot-password?sent=1');
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            S
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account with that email exists, we&apos;ve sent a password reset link. Check your inbox.
          </p>
        </div>
        <Link
          href="/sign-in"
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary text-primary-foreground px-2.5 h-9 text-sm font-medium transition-all hover:bg-primary/80"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          S
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground text-center">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form action={forgotPasswordAction} className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        {error === 'rate_limited' && (
          <p className="text-sm text-destructive">
            Too many attempts. Please try again in {retry ?? '?'} minute{retry === '1' ? '' : 's'}.
          </p>
        )}

        <Button type="submit" className="w-full">Send reset link</Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-primary">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
