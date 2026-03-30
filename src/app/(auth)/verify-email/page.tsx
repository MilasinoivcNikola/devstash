import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    redirect('/sign-in');
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return <Result success={false} message="This verification link is invalid." />;
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return <Result success={false} message="This verification link has expired. Please register again." />;
  }

  await prisma.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({ where: { token } });

  return <Result success message="Your email has been verified. You can now sign in." />;
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
          {success ? 'Email verified' : 'Verification failed'}
        </h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      <Link
        href="/sign-in"
        className="inline-flex w-full items-center justify-center rounded-lg bg-primary text-primary-foreground px-2.5 h-8 text-sm font-medium transition-all hover:bg-primary/80"
      >
        {success ? 'Sign in' : 'Back to sign in'}
      </Link>
    </div>
  );
}
