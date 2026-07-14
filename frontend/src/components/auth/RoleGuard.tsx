'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { ROLE_HOME, type Role } from '../../types/auth';

export function RoleGuard({ allowedRoles, children }: { allowedRoles: Role[]; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [isLoading, user, allowedRoles, router]);

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return (
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  return <>{children}</>;
}
