'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

interface OwnerAnalytics {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  rentDueThisMonth: number;
  rentCollectedThisMonth: number;
  outstandingBalance: number;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OwnerAnalytics | null>(null);

  useEffect(() => {
    void api.get<OwnerAnalytics>('/analytics/owner').then((res) => setStats(res.data));
  }, []);

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <h1 className="mb-2 text-xl font-semibold">Welcome{user ? `, ${user.email}` : ''}</h1>
      <p className="mb-6 text-sm text-gray-600">Manage your properties, leases, and tenants.</p>

      {stats ? (
        <div className="mb-8 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Occupancy" value={`${stats.occupancyRate}%`} />
          <StatTile label="Units occupied" value={`${stats.occupiedUnits} / ${stats.totalUnits}`} />
          <StatTile label="Collected this month" value={`$${stats.rentCollectedThisMonth}`} />
          <StatTile label="Outstanding balance" value={`$${stats.outstandingBalance}`} />
        </div>
      ) : null}

      <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
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
