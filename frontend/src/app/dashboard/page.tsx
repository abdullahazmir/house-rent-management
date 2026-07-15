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
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { CATEGORICAL_CHART_COLORS, CHART_GRID_COLOR, CHART_TEXT_COLOR, colorForIndex } from '../../lib/chartColors';

interface OccupancyBreakdownItem {
  status: 'vacant' | 'occupied' | 'maintenance';
  count: number;
}

interface RentTrendPoint {
  month: string;
  due: number;
  collected: number;
}

interface OwnerAnalytics {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  rentDueThisMonth: number;
  rentCollectedThisMonth: number;
  outstandingBalance: number;
  occupancyBreakdown: OccupancyBreakdownItem[];
  rentTrend: RentTrendPoint[];
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-muted p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-secondary">{value}</p>
    </div>
  );
}

const OCCUPANCY_LABELS: Record<OccupancyBreakdownItem['status'], string> = {
  vacant: 'Vacant',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
};

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OwnerAnalytics | null>(null);

  useEffect(() => {
    void api.get<OwnerAnalytics>('/analytics/owner').then((res) => setStats(res.data));
  }, []);

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <h1 className="mb-2 text-xl font-semibold text-secondary">Welcome{user ? `, ${user.email}` : ''}</h1>
      <p className="mb-6 text-sm text-gray-600">Manage your properties, leases, and tenants.</p>

      {stats ? (
        <>
          <div className="mb-8 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Occupancy" value={`${stats.occupancyRate}%`} />
            <StatTile label="Units occupied" value={`${stats.occupiedUnits} / ${stats.totalUnits}`} />
            <StatTile label="Collected this month" value={`$${stats.rentCollectedThisMonth}`} />
            <StatTile label="Outstanding balance" value={`$${stats.outstandingBalance}`} />
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-md border border-muted p-4">
              <h2 className="mb-4 text-sm font-medium text-secondary">Unit occupancy</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={stats.occupancyBreakdown}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {stats.occupancyBreakdown.map((entry, index) => (
                      <Cell key={entry.status} fill={colorForIndex(index)} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => [
                      value,
                      OCCUPANCY_LABELS[item.payload.status as OccupancyBreakdownItem['status']],
                    ]}
                  />
                  <Legend formatter={(value) => OCCUPANCY_LABELS[value as OccupancyBreakdownItem['status']] ?? value} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-md border border-muted p-4">
              <h2 className="mb-4 text-sm font-medium text-secondary">Rent due vs. collected (6 months)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.rentTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} strokeOpacity={0.3} />
                  <XAxis dataKey="month" tick={{ fill: CHART_TEXT_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: CHART_TEXT_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Bar dataKey="due" name="Due" fill={CATEGORICAL_CHART_COLORS[1]} radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="collected" name="Collected" fill={CATEGORICAL_CHART_COLORS[0]} radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}

      <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/dashboard/properties" className="rounded-md border border-muted p-4 hover:bg-muted/30">
          <p className="font-medium">Properties</p>
          <p className="text-sm text-gray-500">Manage properties &amp; units</p>
        </Link>
        <Link href="/dashboard/leases" className="rounded-md border border-muted p-4 hover:bg-muted/30">
          <p className="font-medium">Leases</p>
          <p className="text-sm text-gray-500">Create &amp; track leases</p>
        </Link>
        <Link href="/dashboard/tenants" className="rounded-md border border-muted p-4 hover:bg-muted/30">
          <p className="font-medium">Tenants</p>
          <p className="text-sm text-gray-500">Invite &amp; manage renters</p>
        </Link>
      </div>
    </main>
  );
}
