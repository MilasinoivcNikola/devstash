import Link from 'next/link';
import { MailOpen } from 'lucide-react';

export default function CheckEmailPage() {
  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <MailOpen className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent you a verification link. Click it to activate your account.
          The link expires in 24 hours.
        </p>
      </div>

      <Link
        href="/sign-in"
        className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium transition-all hover:bg-muted"
      >
        Back to sign in
      </Link>
    </div>
  );
}
