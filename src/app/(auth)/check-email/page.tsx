'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CheckEmailPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setErrorMsg(data.error ?? 'Too many attempts. Please try again later.');
        setStatus('error');
        return;
      }

      setStatus('sent');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

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

      {status === 'sent' ? (
        <p className="text-sm text-emerald-500">Verification email resent. Check your inbox.</p>
      ) : (
        <form onSubmit={handleResend} className="space-y-2 text-left">
          <p className="text-xs text-muted-foreground text-center">Didn&apos;t receive it? Resend below.</p>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {status === 'error' && (
            <p className="text-sm text-destructive">{errorMsg}</p>
          )}
          <Button type="submit" variant="outline" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending…' : 'Resend verification email'}
          </Button>
        </form>
      )}

      <Link
        href="/sign-in"
        className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium transition-all hover:bg-muted"
      >
        Back to sign in
      </Link>
    </div>
  );
}
