import type { Request, Response } from 'express';
import { getPaymentsCollection, getTenantsCollection, getOwnersCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError, ValidationError } from '../utils/errors';
import { stripe } from '../services/stripe.service';
import { notifyTenantsPaymentReceipt } from '../services/payment.service';
import { env } from '../config/env';
import type { CreateSelfCheckoutSessionInput } from '../validators/payment.validators';

async function findTenantForUser(req: Pick<Request, 'ownerId' | 'user'>) {
  const ownerId = parseObjectId(req.ownerId!);
  const userId = parseObjectId(req.user!.id);
  const tenant = await getTenantsCollection().findOne({ ownerId, userId });
  if (!tenant) throw new NotFoundError('Tenant profile not found');
  return tenant;
}

export async function listMyPayments(req: Request, res: Response): Promise<void> {
  const tenant = await findTenantForUser(req);
  const payments = await getPaymentsCollection()
    .find({ tenantIds: tenant._id })
    .sort({ dueDate: -1 })
    .toArray();
  res.status(200).json(payments);
}

export async function getMyPaymentReceipt(req: Request, res: Response): Promise<void> {
  const tenant = await findTenantForUser(req);
  const paymentId = parseObjectId(req.params.id, 'Payment not found');

  const payment = await getPaymentsCollection().findOne({ _id: paymentId, tenantIds: tenant._id });
  if (!payment) throw new NotFoundError('Payment not found');

  if (payment.receiptUrl) {
    res.redirect(payment.receiptUrl);
    return;
  }

  res.status(200).json(payment);
}

/**
 * Dev/demo convenience: marks a payment as paid without touching Stripe at all.
 * Stand-in for real online payment while Connect isn't fully onboarded (Express/Standard
 * accounts require the Stripe-hosted onboarding step — it can't be done via API).
 */
export async function simulateMyPayment(req: Request, res: Response): Promise<void> {
  const tenant = await findTenantForUser(req);
  const paymentId = parseObjectId(req.params.id, 'Payment not found');

  const payments = getPaymentsCollection();
  const payment = await payments.findOne({ _id: paymentId, tenantIds: tenant._id });
  if (!payment) throw new NotFoundError('Payment not found');
  if (payment.status === 'paid') throw new ValidationError('This payment has already been paid');

  const amountOwed = payment.amountDue + payment.lateFeeApplied - payment.amountPaid;
  if (amountOwed <= 0) throw new ValidationError('Nothing owed on this payment');

  const now = new Date();
  const result = await payments.findOneAndUpdate(
    { _id: paymentId },
    {
      $set: {
        status: 'paid',
        amountPaid: payment.amountDue + payment.lateFeeApplied,
        paidDate: now,
        method: 'stripe_simulated',
        notes: 'Simulated payment — no real money moved (Stripe Connect not fully onboarded).',
        updatedAt: now,
      },
    },
    { returnDocument: 'after' },
  );

  if (result) {
    await notifyTenantsPaymentReceipt(result);
  }

  res.status(200).json(result);
}

export async function createMyCheckoutSession(
  req: Request<unknown, unknown, CreateSelfCheckoutSessionInput>,
  res: Response,
): Promise<void> {
  const tenant = await findTenantForUser(req);
  const paymentId = parseObjectId(req.body.paymentId, 'Payment not found');

  const payments = getPaymentsCollection();
  const payment = await payments.findOne({ _id: paymentId, tenantIds: tenant._id });
  if (!payment) throw new NotFoundError('Payment not found');
  if (payment.status === 'paid') throw new ValidationError('This payment has already been paid');

  const owner = await getOwnersCollection().findOne({ _id: tenant.ownerId });
  if (!owner?.stripeConnectAccountId || !owner.stripeConnectChargesEnabled) {
    throw new ValidationError('Online payments are not yet enabled for this property manager');
  }

  const amountOwed = payment.amountDue + payment.lateFeeApplied - payment.amountPaid;
  if (amountOwed <= 0) throw new ValidationError('Nothing owed on this payment');

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(amountOwed * 100),
          product_data: { name: `Rent payment due ${payment.dueDate.toISOString().slice(0, 10)}` },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      transfer_data: { destination: owner.stripeConnectAccountId },
      metadata: { paymentId: payment._id!.toHexString() },
    },
    success_url: `${env.CLIENT_APP_URL}/portal/payments?paid=success`,
    cancel_url: `${env.CLIENT_APP_URL}/portal/payments?paid=cancelled`,
  });

  res.status(200).json({ url: session.url });
}
