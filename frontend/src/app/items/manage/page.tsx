'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';

export default function ItemsManageRedirectPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    router.replace('/dashboard/properties');
  }, [isLoading, user, router]);

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
      <p className="text-sm text-secondary/60">Redirecting…</p>
    </main>
  );
}
