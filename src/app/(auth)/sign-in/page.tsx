import { Suspense } from 'react';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GitBranch } from 'lucide-react';
import { RegisteredToast } from '@/components/shared/RegisteredToast';

interface Props {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Invalid email or password.',
  default: 'Something went wrong. Please try again.',
};

export default async function SignInPage({ searchParams }: Props) {
  const { error, callbackUrl = '/dashboard' } = await searchParams;

  async function credentialsAction(formData: FormData) {
    'use server';
    try {
      await signIn('credentials', {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        redirectTo: callbackUrl,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        const params = new URLSearchParams({ error: 'invalid' });
        if (callbackUrl !== '/dashboard') params.set('callbackUrl', callbackUrl);
        redirect(`/sign-in?${params}`);
      }
      throw err;
    }
  }

  async function githubAction() {
    'use server';
    await signIn('github', { redirectTo: callbackUrl });
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <Suspense>
        <RegisteredToast />
      </Suspense>
      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          S
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Sign in to DevStash</h1>
      </div>

      {/* GitHub OAuth */}
      <form action={githubAction}>
        <Button type="submit" variant="outline" className="w-full">
          <GitBranch className="mr-2 h-4 w-4" />
          Sign in with GitHub
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-background px-2">or continue with email</span>
        </div>
      </div>

      {/* Email/Password form */}
      <form action={credentialsAction} className="space-y-3">
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
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default}
          </p>
        )}

        <Button type="submit" className="w-full">Sign in</Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-foreground underline underline-offset-4 hover:text-primary">
          Register
        </Link>
      </p>
    </div>
  );
}
