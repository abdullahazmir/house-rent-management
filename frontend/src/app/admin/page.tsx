'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../../lib/api';
import { CHART_GRID_COLOR, CHART_TEXT_COLOR, colorForIndex } from '../../lib/chartColors';

interface MrrByPlanItem {
  plan: string;
  amount: number;
}

interface SubscriptionStatusItem {
  status: string;
  count: number;
}

interface AdminAnalytics {
  totalOwners: number;
  activeSubscriptions: number;
  trialingCount: number;
  mrr: number;
  mrrByPlan: MrrByPlanItem[];
  subscriptionStatusBreakdown: SubscriptionStatusItem[];
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
        <>
          <div className="mb-8 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Total owners" value={String(stats.totalOwners)} />
            <StatTile label="Active subscriptions" value={String(stats.activeSubscriptions)} />
            <StatTile label="On trial" value={String(stats.trialingCount)} />
            <StatTile label="MRR" value={`$${stats.mrr}`} />
          </div>

          {stats.mrrByPlan.length > 0 || stats.subscriptionStatusBreakdown.length > 0 ? (
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {stats.mrrByPlan.length > 0 ? (
                <div className="rounded-md border border-muted p-4">
                  <h2 className="mb-4 text-sm font-medium text-secondary">MRR by plan</h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stats.mrrByPlan} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} strokeOpacity={0.3} />
                      <XAxis dataKey="plan" tick={{ fill: CHART_TEXT_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: CHART_TEXT_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Bar dataKey="amount" name="MRR" radius={[4, 4, 0, 0]} barSize={32}>
                        {stats.mrrByPlan.map((entry, index) => (
                          <Cell key={entry.plan} fill={colorForIndex(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}

              {stats.subscriptionStatusBreakdown.length > 0 ? (
                <div className="rounded-md border border-muted p-4">
                  <h2 className="mb-4 text-sm font-medium text-secondary">Subscription status</h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={stats.subscriptionStatusBreakdown}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {stats.subscriptionStatusBreakdown.map((entry, index) => (
                          <Cell key={entry.status} fill={colorForIndex(index)} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend formatter={(value) => (typeof value === 'string' ? value.replace('_', ' ') : value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      <Link href="/admin/owners" className="inline-block rounded-md border border-muted p-4 hover:bg-muted/30">
        <p className="font-medium">Real estate owners</p>
        <p className="text-sm text-gray-500">View, suspend, and activate owner accounts</p>
      </Link>
    </main>
  );
}
