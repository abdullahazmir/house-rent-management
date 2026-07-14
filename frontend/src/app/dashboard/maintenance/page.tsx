'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import type { MaintenanceRequest, MaintenanceStatus } from '../../../types/maintenance';
import { Button } from '../../../components/ui/Button';

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  open: 'bg-muted text-brown',
  in_progress: 'bg-highlight/40 text-secondary',
  resolved: 'bg-secondary/10 text-secondary',
  cancelled: 'bg-gray-100 text-gray-600',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-secondary',
  high: 'font-semibold text-primary',
  urgent: 'font-bold text-brown',
};

export default function DashboardMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<MaintenanceRequest[]>('/maintenance-requests');
    setRequests(res.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    void load();
  }, [load]);

  const setStatus = async (id: string, status: MaintenanceStatus) => {
    setBusyId(id);
    try {
      await api.patch(`/maintenance-requests/${id}`, { status });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-xl font-semibold text-secondary">Maintenance requests</h1>

      {requests === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-500">No maintenance requests yet.</p>
      ) : (
        <ul className="divide-y divide-muted rounded-md border border-muted">
          {requests.map((r) => (
            <li key={r._id} className="p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {r.title} <span className={`text-xs font-normal ${PRIORITY_STYLES[r.priority]}`}>({r.priority})</span>
                  </p>
                  <p className="text-sm text-gray-500">{r.description}</p>
                </div>
                <span className={`self-start rounded-full px-2 py-1 text-xs font-medium sm:self-auto ${STATUS_STYLES[r.status]}`}>
                  {r.status.replace('_', ' ')}
                </span>
              </div>
              {r.status !== 'resolved' && r.status !== 'cancelled' ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === 'open' ? (
                    <Button variant="secondary" disabled={busyId === r._id} onClick={() => setStatus(r._id, 'in_progress')}>
                      Mark in progress
                    </Button>
                  ) : null}
                  <Button disabled={busyId === r._id} onClick={() => setStatus(r._id, 'resolved')}>
                    Mark resolved
                  </Button>
                  <Button variant="secondary" disabled={busyId === r._id} onClick={() => setStatus(r._id, 'cancelled')}>
                    Cancel
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
