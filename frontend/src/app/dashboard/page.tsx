'use client';

import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';

export default function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <main className="flex-1 p-8">
      <h1 className="mb-2 text-xl font-semibold">Welcome{user ? `, ${user.email}` : ''}</h1>
      <p className="mb-6 text-sm text-gray-600">Manage your properties, leases, and tenants.</p>
      <div className="grid max-w-2xl grid-cols-3 gap-4">
        <Link href="/dashboard/properties" className="rounded-md border border-gray-200 p-4 hover:bg-gray-50">
          <p className="font-medium">Properties</p>
          <p className="text-sm text-gray-500">Manage properties &amp; units</p>
        </Link>
        <Link href="/dashboard/leases" className="rounded-md border border-gray-200 p-4 hover:bg-gray-50">
          <p className="font-medium">Leases</p>
          <p className="text-sm text-gray-500">Create &amp; track leases</p>
        </Link>
        <Link href="/dashboard/tenants" className="rounded-md border border-gray-200 p-4 hover:bg-gray-50">
          <p className="font-medium">Tenants</p>
          <p className="text-sm text-gray-500">Invite &amp; manage renters</p>
        </Link>
      </div>
    </main>
  );
}
