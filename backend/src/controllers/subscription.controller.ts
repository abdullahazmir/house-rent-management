import type { Request, Response } from 'express';
import { getOwnersCollection, getPlansCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError, ValidationError } from '../utils/errors';
import { stripe } from '../services/stripe.service';
import { env } from '../config/env';
import type { CreateCheckoutSessionInput } from '../validators/subscription.validators';

export async function getSubscription(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const owner = await getOwnersCollection().findOne({ _id: ownerId });
  if (!owner) throw new NotFoundError('Owner not found');

  const plan = owner.subscription.planId
    ? await getPlansCollection().findOne({ _id: owner.subscription.planId })
    : null;

  res.status(200).json({ ...owner.subscription, plan });
}

export async function createCheckoutSession(
  req: Request<unknown, unknown, CreateCheckoutSessionInput>,
  res: Response,
): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const planId = parseObjectId(req.body.planId, 'Plan not found');

  const owner = await getOwnersCollection().findOne({ _id: ownerId });
  if (!owner) throw new NotFoundError('Owner not found');
  if (!owner.stripeCustomerId) throw new ValidationError('Owner has no Stripe customer on file');

  const plan = await getPlansCollection().findOne({ _id: planId, isActive: true });
  if (!plan) throw new NotFoundError('Plan not found');

  const alreadyHadSubscription = owner.subscription.stripeSubscriptionId !== null;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: owner.stripeCustomerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    subscription_data: alreadyHadSubscription ? undefined : { trial_period_days: env.DEFAULT_TRIAL_DAYS },
    success_url: `${env.CLIENT_APP_URL}/dashboard/billing?checkout=success`,
    cancel_url: `${env.CLIENT_APP_URL}/dashboard/billing?checkout=cancelled`,
    metadata: { ownerId: ownerId.toHexString(), planId: planId.toHexString() },
  });

  res.status(200).json({ url: session.url });
}

export async function createPortalSession(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const owner = await getOwnersCollection().findOne({ _id: ownerId });
  if (!owner) throw new NotFoundError('Owner not found');
  if (!owner.stripeCustomerId) throw new ValidationError('Owner has no Stripe customer on file');

  const session = await stripe.billingPortal.sessions.create({
    customer: owner.stripeCustomerId,
    return_url: `${env.CLIENT_APP_URL}/dashboard/billing`,
  });

  res.status(200).json({ url: session.url });
}
