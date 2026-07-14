'use client';

import { useEffect, useState, use } from 'react';
import { api } from '../../../../../lib/api';
import type { Payment } from '../../../../../types/payment';
import { Button } from '../../../../../components/ui/Button';

export default function PaymentReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    void api.get<Payment>(`/payments/${id}/receipt`).then((res) => setPayment(res.data));
  }, [id]);

  if (!payment) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-md rounded-md border border-gray-200 p-8 print:border-none">
        <h1 className="mb-6 text-xl font-semibold">Payment receipt</h1>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Amount paid</dt>
            <dd className="font-medium">${payment.amountPaid}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Due date</dt>
            <dd>{new Date(payment.dueDate).toLocaleDateString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Paid date</dt>
            <dd>{payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Method</dt>
            <dd>{payment.method ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Status</dt>
            <dd className="capitalize">{payment.status}</dd>
          </div>
          {payment.notes ? (
            <div className="flex justify-between">
              <dt className="text-gray-500">Notes</dt>
              <dd>{payment.notes}</dd>
            </div>
          ) : null}
        </dl>
        <Button variant="secondary" className="mt-6 print:hidden" onClick={() => window.print()}>
          Print
        </Button>
      </div>
    </main>
  );
}
