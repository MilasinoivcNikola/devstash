'use client';

import { useActionState, useState } from 'react';
import { changePasswordAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [error, action, pending] = useActionState(changePasswordAction, null);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
      >
        Change Password
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <form action={action} className="px-4 pb-4 flex flex-col gap-3 border-t border-border pt-4">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="currentPassword" className="text-xs text-muted-foreground">
              Current Password
            </label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="newPassword" className="text-xs text-muted-foreground">
              New Password
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-xs text-muted-foreground">
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? 'Saving…' : 'Save Password'}
          </Button>
        </form>
      )}
    </div>
  );
}
