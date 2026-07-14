'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { getApiErrorMessage } from '../../../lib/auth-context';
import type { Payment, PaymentStatus } from '../../../types/payment';
import { Button } from '../../../components/ui/Button';

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  late: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-600',
};

export default function PortalPaymentsPage() {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<Payment[]>('/payments/me');
    setPayments(res.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    void load();
  }, [load]);

  const payNow = async (paymentId: string) => {
    setError(null);
    setBusyId(paymentId);
    try {
      const res = await api.post<{ url: string }>('/payments/me/checkout-session', { paymentId });
      // eslint-disable-next-line react-hooks/immutability -- full-page redirect to Stripe-hosted Checkout, not React state
      window.location.href = res.data.url;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not start payment'));
      setBusyId(null);
    }
  };

  return (
    <main className="flex-1 p-8">
      <h1 className="mb-6 text-xl font-semibold">Payments</h1>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {payments === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="text-sm text-gray-500">No payments yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
          {payments.map((payment) => {
            const owed = payment.amountDue + payment.lateFeeApplied - payment.amountPaid;
            const canPay = payment.status !== 'paid' && owed > 0;
            return (
              <li key={payment._id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">
                    ${payment.amountDue}
                    {payment.lateFeeApplied > 0 ? (
                      <span className="text-sm text-red-600"> + ${payment.lateFeeApplied} late fee</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-gray-500">Due {new Date(payment.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[payment.status]}`}>
                    {payment.status}
                  </span>
                  {payment.status === 'paid' ? (
                    <Link href={`/portal/payments/${payment._id}/receipt`} className="text-sm underline">
                      Receipt
                    </Link>
                  ) : canPay ? (
                    <Button onClick={() => payNow(payment._id)} disabled={busyId === payment._id}>
                      {busyId === payment._id ? 'Redirecting…' : `Pay $${owed}`}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
