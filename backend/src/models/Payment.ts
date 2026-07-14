import type { ObjectId } from 'mongodb';

export type PaymentMethod = 'stripe_online' | 'manual_cash' | 'manual_check' | 'manual_other' | 'stripe_simulated';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'late' | 'failed' | 'refunded';

export interface PaymentDoc {
  _id?: ObjectId;
  ownerId: ObjectId;
  leaseId: ObjectId;
  tenantIds: ObjectId[];
  amountDue: number;
  amountPaid: number;
  lateFeeApplied: number;
  dueDate: Date;
  paidDate: Date | null;
  method: PaymentMethod | null;
  status: PaymentStatus;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  stripeApplicationFeeAmount: number | null;
  receiptUrl: string | null;
  recordedByUserId: ObjectId | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
