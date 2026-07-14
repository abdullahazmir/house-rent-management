export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'late' | 'failed' | 'refunded';

export interface Payment {
  _id: string;
  ownerId: string;
  leaseId: string;
  tenantIds: string[];
  amountDue: number;
  amountPaid: number;
  lateFeeApplied: number;
  dueDate: string;
  paidDate: string | null;
  method: string | null;
  status: PaymentStatus;
  receiptUrl: string | null;
  notes: string | null;
}
