'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../lib/api';
import { getApiErrorMessage } from '../../../lib/auth-context';
import type { Payment, PaymentStatus } from '../../../types/payment';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  late: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-600',
};

const recordFormSchema = z.object({
  amountPaid: z.coerce.number().positive('Amount must be greater than 0'),
  method: z.enum(['manual_cash', 'manual_check', 'manual_other']),
  notes: z.string().optional(),
});

type RecordFormValues = z.infer<typeof recordFormSchema>;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof recordFormSchema>, unknown, RecordFormValues>({
    resolver: zodResolver(recordFormSchema),
  });

  const load = useCallback(async () => {
    const query = statusFilter ? `?status=${statusFilter}` : '';
    const res = await api.get<Payment[]>(`/payments${query}`);
    setPayments(res.data);
  }, [statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount/filter-change
    void load();
  }, [load]);

  const onSubmitManualPayment = async (values: RecordFormValues) => {
    if (!recordingId) return;
    setError(null);
    try {
      await api.post('/payments/manual', { paymentId: recordingId, ...values });
      reset();
      setRecordingId(null);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not record payment'));
    }
  };

  return (
    <main className="flex-1 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Payments</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="late">Late</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {payments === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="text-sm text-gray-500">No payments found.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
          {payments.map((payment) => (
            <li key={payment._id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    ${payment.amountDue}{' '}
                    {payment.lateFeeApplied > 0 ? (
                      <span className="text-sm text-red-600">+ ${payment.lateFeeApplied} late fee</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-gray-500">Due {new Date(payment.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[payment.status]}`}>
                    {payment.status}
                  </span>
                  {payment.status === 'paid' ? (
                    <Link href={`/dashboard/payments/${payment._id}/receipt`} className="text-sm underline">
                      Receipt
                    </Link>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setRecordingId(recordingId === payment._id ? null : payment._id);
                        setError(null);
                      }}
                    >
                      {recordingId === payment._id ? 'Cancel' : 'Record payment'}
                    </Button>
                  )}
                </div>
              </div>

              {recordingId === payment._id ? (
                <form
                  onSubmit={handleSubmit(onSubmitManualPayment)}
                  className="mt-4 grid grid-cols-2 gap-4 rounded-md border border-gray-200 p-4"
                >
                  <Input
                    label="Amount paid ($)"
                    type="number"
                    step="0.01"
                    {...register('amountPaid')}
                    error={errors.amountPaid?.message}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Method</label>
                    <select {...register('method')} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                      <option value="manual_cash">Cash</option>
                      <option value="manual_check">Check</option>
                      <option value="manual_other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input label="Notes (optional)" {...register('notes')} />
                  </div>
                  {error ? <p className="col-span-2 text-sm text-red-600">{error}</p> : null}
                  <div className="col-span-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving…' : 'Save payment'}
                    </Button>
                  </div>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
