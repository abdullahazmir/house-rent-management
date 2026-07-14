import type { Request, Response } from 'express';
import { getPaymentsCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError, ValidationError } from '../utils/errors';
import type { RecordManualPaymentInput } from '../validators/payment.validators';

export async function listPayments(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const filter: Record<string, unknown> = { ownerId };

  if (typeof req.query.leaseId === 'string') filter.leaseId = parseObjectId(req.query.leaseId);
  if (typeof req.query.tenantId === 'string') filter.tenantIds = parseObjectId(req.query.tenantId);
  if (typeof req.query.status === 'string') filter.status = req.query.status;

  const payments = await getPaymentsCollection().find(filter).sort({ dueDate: -1 }).toArray();
  res.status(200).json(payments);
}

export async function getPayment(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Payment not found');

  const payment = await getPaymentsCollection().findOne({ _id, ownerId });
  if (!payment) throw new NotFoundError('Payment not found');

  res.status(200).json(payment);
}

export async function recordManualPayment(
  req: Request<unknown, unknown, RecordManualPaymentInput>,
  res: Response,
): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.body.paymentId, 'Payment not found');

  const payment = await getPaymentsCollection().findOne({ _id, ownerId });
  if (!payment) throw new NotFoundError('Payment not found');
  if (payment.status === 'paid') throw new ValidationError('This payment has already been recorded as paid');

  const now = new Date();
  const isFullyPaid = req.body.amountPaid >= payment.amountDue - payment.lateFeeApplied;

  const result = await getPaymentsCollection().findOneAndUpdate(
    { _id },
    {
      $set: {
        amountPaid: req.body.amountPaid,
        method: req.body.method,
        status: isFullyPaid ? 'paid' : 'partial',
        paidDate: now,
        recordedByUserId: parseObjectId(req.user!.id),
        notes: req.body.notes ?? null,
        updatedAt: now,
      },
    },
    { returnDocument: 'after' },
  );

  res.status(200).json(result);
}

export async function getPaymentReceipt(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Payment not found');

  const payment = await getPaymentsCollection().findOne({ _id, ownerId });
  if (!payment) throw new NotFoundError('Payment not found');

  if (payment.receiptUrl) {
    res.redirect(payment.receiptUrl);
    return;
  }

  res.status(200).json(payment);
}
