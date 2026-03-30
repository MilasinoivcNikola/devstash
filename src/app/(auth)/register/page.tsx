import { redirect } from 'next/navigation';
import Link from 'next/link';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: 'All fields are required.',
  passwords_mismatch: 'Passwords do not match.',
  password_too_short: 'Password must be at least 8 characters.',
  email_taken: 'An account with this email already exists.',
  default: 'Something went wrong. Please try again.',
};

export default async function RegisterPage({ searchParams }: Props) {
  const { error } = await searchParams;

  async function registerAction(formData: FormData) {
    'use server';
    const name = (formData.get('name') as string) || null;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!email || !password || !confirmPassword) {
      redirect('/register?error=missing_fields');
    }

    if (password !== confirmPassword) {
      redirect('/register?error=passwords_mismatch');
    }

    if (password.length < 8) {
      redirect('/register?error=password_too_short');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      redirect('/register?error=email_taken');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const token = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, token);

    redirect('/check-email');
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          S
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
      </div>

      <form action={registerAction} className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
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
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default}
          </p>
        )}

        <Button type="submit" className="w-full">Create account</Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
