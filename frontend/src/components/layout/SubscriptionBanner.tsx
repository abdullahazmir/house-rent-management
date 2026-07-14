'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

const RESTRICTED_STATUSES = new Set(['past_due', 'canceled', 'unpaid']);

export function SubscriptionBanner() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api
      .get<{ status: string }>('/subscriptions')
      .then((res) => {
        if (!cancelled) setStatus(res.data.status);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status || !RESTRICTED_STATUSES.has(status)) return null;

  return (
    <div className="bg-primary/10 px-4 py-2 text-center text-sm text-brown">
      Your subscription is {status.replace('_', ' ')}.{' '}
      <Link href="/dashboard/billing" className="font-medium underline">
        Update billing
      </Link>{' '}
      to keep adding properties and units.
    </div>
  );
}
