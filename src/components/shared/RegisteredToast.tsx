'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function RegisteredToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      toast.success('Account created! You can now sign in.', { id: 'registered' });
    }
  }, [searchParams]);

  return null;
}
