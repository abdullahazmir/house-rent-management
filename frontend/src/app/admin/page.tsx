'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

interface AdminAnalytics {
  totalOwners: number;
  activeSubscriptions: number;
  trialingCount: number;
  mrr: number;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-muted p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-secondary">{value}</p>
    </div>
  );
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminAnalytics | null>(null);

  useEffect(() => {
    void api.get<AdminAnalytics>('/analytics/admin').then((res) => setStats(res.data));
  }, []);

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-xl font-semibold text-secondary">Super Admin</h1>

      {stats ? (
        <div className="mb-8 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Total owners" value={String(stats.totalOwners)} />
          <StatTile label="Active subscriptions" value={String(stats.activeSubscriptions)} />
          <StatTile label="On trial" value={String(stats.trialingCount)} />
          <StatTile label="MRR" value={`$${stats.mrr}`} />
        </div>
      ) : null}

      <Link href="/admin/owners" className="inline-block rounded-md border border-muted p-4 hover:bg-muted/30">
        <p className="font-medium">Real estate owners</p>
        <p className="text-sm text-gray-500">View, suspend, and activate owner accounts</p>
      </Link>
    </main>
  );
}
