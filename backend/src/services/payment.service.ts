import { ObjectId } from 'mongodb';
import { getPaymentsCollection } from '../db/collections';
import type { LeaseDoc } from '../models/Lease';

const MONTHS_TO_GENERATE = 12;

function dueDateForMonth(year: number, monthIndex: number, dayOfMonth: number): Date {
  // Clamp to the last day of the month if rentDueDayOfMonth exceeds it (e.g. day 31 in February).
  const lastDayOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, lastDayOfMonth);
  return new Date(Date.UTC(year, monthIndex, day));
}

export async function generatePaymentsForLease(lease: LeaseDoc & { _id: ObjectId }): Promise<void> {
  const payments = getPaymentsCollection();
  const now = new Date();

  const start = new Date(lease.startDate);
  const end = new Date(lease.endDate);

  const docs = [];
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth();

  for (let i = 0; i < MONTHS_TO_GENERATE; i++) {
    const dueDate = dueDateForMonth(year, month, lease.rentDueDayOfMonth);
    if (dueDate > end) break;

    docs.push({
      ownerId: lease.ownerId,
      leaseId: lease._id,
      tenantIds: lease.tenantIds,
      amountDue: lease.rentAmount,
      amountPaid: 0,
      lateFeeApplied: 0,
      dueDate,
      paidDate: null,
      method: null,
      status: 'pending' as const,
      stripePaymentIntentId: null,
      stripeChargeId: null,
      stripeApplicationFeeAmount: null,
      receiptUrl: null,
      recordedByUserId: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });

    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  if (docs.length > 0) {
    await payments.insertMany(docs);
  }
}
