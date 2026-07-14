import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { ObjectId } from 'mongodb';
import { stripe } from '../services/stripe.service';
import { env } from '../config/env';
import {
  getWebhookEventsCollection,
  getOwnersCollection,
  getPlansCollection,
  getPaymentsCollection,
} from '../db/collections';
import { notifyTenantsPaymentReceipt } from '../services/payment.service';
import type { SubscriptionStatus } from '../models/Owner';

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    res.status(400).send('Missing Stripe-Signature header');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send(`Webhook signature verification failed: ${(err as Error).message}`);
    return;
  }

  const webhookEvents = getWebhookEventsCollection();
  const alreadyProcessed = await webhookEvents.findOne({ stripeEventId: event.id });
  if (alreadyProcessed) {
    res.status(200).json({ received: true, deduped: true });
    return;
  }

  await routeEvent(event);
  await webhookEvents.insertOne({ stripeEventId: event.id, type: event.type, processedAt: new Date() });

  res.status(200).json({ received: true });
}

async function routeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await syncSubscription(event.data.object as Stripe.Subscription, 'canceled');
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    case 'account.updated':
      await syncConnectAccount(event.data.object as Stripe.Account);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    default:
      break;
  }
}

async function syncSubscription(subscription: Stripe.Subscription, forcedStatus?: SubscriptionStatus): Promise<void> {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const owners = getOwnersCollection();
  const owner = await owners.findOne({ stripeCustomerId: customerId });
  if (!owner) return;

  const item = subscription.items.data[0];
  const priceId = item?.price.id;
  const plan = priceId ? await getPlansCollection().findOne({ stripePriceId: priceId }) : null;

  await owners.updateOne(
    { _id: owner._id },
    {
      $set: {
        'subscription.stripeSubscriptionId': subscription.id,
        'subscription.status': forcedStatus ?? (subscription.status as SubscriptionStatus),
        'subscription.planId': plan?._id ?? owner.subscription.planId,
        'subscription.currentPeriodEnd': item ? new Date(item.current_period_end * 1000) : null,
        'subscription.trialEndsAt': subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
        updatedAt: new Date(),
      },
    },
  );
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  await getOwnersCollection().updateOne(
    { stripeCustomerId: customerId },
    { $set: { 'subscription.status': 'past_due', updatedAt: new Date() } },
  );
}

async function syncConnectAccount(account: Stripe.Account): Promise<void> {
  await getOwnersCollection().updateOne(
    { stripeConnectAccountId: account.id },
    {
      $set: {
        stripeConnectChargesEnabled: account.charges_enabled ?? false,
        stripeConnectPayoutsEnabled: account.payouts_enabled ?? false,
        stripeConnectOnboardingComplete: Boolean(account.details_submitted),
        updatedAt: new Date(),
      },
    },
  );
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const paymentId = paymentIntent.metadata?.paymentId;
  if (!paymentId) return;

  const payments = getPaymentsCollection();
  const payment = await payments.findOne({ _id: new ObjectId(paymentId) });
  if (!payment) return;

  const latestCharge = paymentIntent.latest_charge;
  const chargeId = typeof latestCharge === 'string' ? latestCharge : (latestCharge?.id ?? null);
  const receiptUrl = typeof latestCharge === 'string' ? null : (latestCharge?.receipt_url ?? null);

  const result = await payments.findOneAndUpdate(
    { _id: payment._id },
    {
      $set: {
        status: 'paid',
        amountPaid: paymentIntent.amount / 100,
        paidDate: new Date(),
        method: 'stripe_online',
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: chargeId,
        receiptUrl,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' },
  );

  if (result) {
    await notifyTenantsPaymentReceipt(result);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const paymentId = paymentIntent.metadata?.paymentId;
  if (!paymentId) return;

  await getPaymentsCollection().updateOne(
    { _id: new ObjectId(paymentId) },
    { $set: { status: 'failed', updatedAt: new Date() } },
  );
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  await getPaymentsCollection().updateOne(
    { stripeChargeId: charge.id },
    { $set: { status: 'refunded', updatedAt: new Date() } },
  );
}
