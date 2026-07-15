'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import type { Property, Unit } from '../../types/models';

interface MyLease {
  _id: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  rentDueDayOfMonth: number;
  status: string;
  property: Property | null;
  unit: Unit | null;
}

export default function PortalHomePage() {
  const [lease, setLease] = useState<MyLease | null | undefined>(undefined);

  useEffect(() => {
    // A self-registered renter with no lease yet gets a 403 from scopeToOwner (ownerId is
    // still null) rather than a 200 { null } — both cases mean "no active lease" here.
    void api
      .get<MyLease | null>('/tenants/me/lease')
      .then((res) => setLease(res.data))
      .catch(() => setLease(null));
  }, []);

  if (lease === undefined) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  if (!lease) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-md rounded-md border border-muted p-6 text-center">
          <p className="text-sm text-gray-500">You don&apos;t have an active lease yet.</p>
          <Link href="/listings" className="mt-4 inline-block">
            <Button>Browse available houses</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-xl font-semibold text-secondary">My lease</h1>
      <div className="max-w-md rounded-md border border-muted p-6">
        <p className="text-lg font-medium">{lease.property?.name}</p>
        <p className="text-sm text-gray-500">
          {lease.property?.addressLine1}, {lease.property?.city}, {lease.property?.state} {lease.property?.zip}
        </p>
        {lease.unit ? <p className="mt-1 text-sm text-gray-500">Unit {lease.unit.unitNumber}</p> : null}

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Monthly rent</dt>
            <dd className="font-medium">${lease.rentAmount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Due day of month</dt>
            <dd>{lease.rentDueDayOfMonth}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Lease term</dt>
            <dd>
              {new Date(lease.startDate).toLocaleDateString()} – {new Date(lease.endDate).toLocaleDateString()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Status</dt>
            <dd className="capitalize">{lease.status}</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
