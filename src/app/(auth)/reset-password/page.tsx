import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ResetPasswordForm } from './ResetPasswordForm';

interface Props {
  searchParams: Promise<{ token?: string; error?: string }>;
}

const TERMINAL_ERRORS: Record<string, string> = {
  invalid_token: 'This reset link is invalid or has already been used.',
  expired_token: 'This reset link has expired. Please request a new one.',
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, error } = await searchParams;

  // Terminal error state from the server action (token not in URL)
  if (!token && error) {
    const message = TERMINAL_ERRORS[error] ?? 'Something went wrong. Please try again.';
    return <Result success={false} message={message} />;
  }

  if (!token) {
    redirect('/forgot-password');
  }

  // Validate token before rendering the form
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || !record.identifier.startsWith('reset:')) {
    return <Result success={false} message={TERMINAL_ERRORS.invalid_token} />;
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return <Result success={false} message={TERMINAL_ERRORS.expired_token} />;
  }

  return <ResetPasswordForm token={token} />;
}

function Result({ success, message }: { success: boolean; message: string }) {
  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${success ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
          {success
            ? <CheckCircle className="h-6 w-6 text-emerald-500" />
            : <XCircle className="h-6 w-6 text-destructive" />}
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          {success ? 'Password reset' : 'Reset failed'}
        </h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      <Link
        href={success ? '/sign-in' : '/forgot-password'}
        className="inline-flex w-full items-center justify-center rounded-lg bg-primary text-primary-foreground px-2.5 h-9 text-sm font-medium transition-all hover:bg-primary/80"
      >
        {success ? 'Sign in' : 'Request new link'}
      </Link>
    </div>
  );
}
