'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import type { Owner } from '../../../types/models';
import { Button } from '../../../components/ui/Button';

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<Owner[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOwners = async () => {
    const res = await api.get<Owner[]>('/owners');
    setOwners(res.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount, reused after mutations below
    void loadOwners();
  }, []);

  const toggleStatus = async (owner: Owner) => {
    setBusyId(owner._id);
    try {
      const action = owner.status === 'active' ? 'suspend' : 'activate';
      await api.patch(`/owners/${owner._id}/${action}`);
      await loadOwners();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="flex-1 p-8">
      <h1 className="mb-6 text-xl font-semibold">Real estate owners</h1>

      {owners === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : owners.length === 0 ? (
        <p className="text-sm text-gray-500">No owners have signed up yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
          {owners.map((owner) => (
            <li key={owner._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{owner.companyName}</p>
                <p className="text-sm text-gray-500">
                  {owner.contactEmail} · subscription: {owner.subscription.status}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    owner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {owner.status}
                </span>
                <Button
                  variant="secondary"
                  disabled={busyId === owner._id}
                  onClick={() => toggleStatus(owner)}
                >
                  {owner.status === 'active' ? 'Suspend' : 'Activate'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
