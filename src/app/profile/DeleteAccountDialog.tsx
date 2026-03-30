'use client';

import { useState, useTransition } from 'react';
import { deleteAccountAction } from './actions';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result) {
        setError(result);
        setOpen(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger render={
          <Button variant="destructive" className="self-start">
            Delete Account
          </Button>
        } />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data — items,
              collections, and tags. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={handleDelete}
              disabled={pending}
              variant="destructive"
            >
              {pending ? 'Deleting…' : 'Delete Account'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
