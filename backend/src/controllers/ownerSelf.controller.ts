import type { Request, Response } from 'express';
import { getOwnersCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError, ValidationError } from '../utils/errors';
import { stripe } from '../services/stripe.service';
import { env } from '../config/env';

export async function getMe(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const owner = await getOwnersCollection().findOne({ _id: ownerId });
  if (!owner) throw new NotFoundError('Owner not found');
  res.status(200).json(owner);
}

export async function getConnectStatus(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const owner = await getOwnersCollection().findOne({ _id: ownerId });
  if (!owner) throw new NotFoundError('Owner not found');

  res.status(200).json({
    connected: owner.stripeConnectAccountId !== null,
    onboardingComplete: owner.stripeConnectOnboardingComplete,
    chargesEnabled: owner.stripeConnectChargesEnabled,
    payoutsEnabled: owner.stripeConnectPayoutsEnabled,
  });
}

export async function startConnectOnboarding(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const owners = getOwnersCollection();
  const owner = await owners.findOne({ _id: ownerId });
  if (!owner) throw new NotFoundError('Owner not found');

  let accountId = owner.stripeConnectAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: owner.contactEmail,
      capabilities: { transfers: { requested: true } },
      business_type: 'individual',
    });
    accountId = account.id;
    await owners.updateOne({ _id: ownerId }, { $set: { stripeConnectAccountId: accountId, updatedAt: new Date() } });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${env.CLIENT_APP_URL}/dashboard/settings/payments?refresh=1`,
    return_url: `${env.CLIENT_APP_URL}/dashboard/settings/payments?onboarding=complete`,
    type: 'account_onboarding',
  });

  res.status(200).json({ url: accountLink.url });
}

export async function getConnectDashboardLink(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const owner = await getOwnersCollection().findOne({ _id: ownerId });
  if (!owner) throw new NotFoundError('Owner not found');
  if (!owner.stripeConnectAccountId) throw new ValidationError('Connect onboarding has not been started yet');

  const loginLink = await stripe.accounts.createLoginLink(owner.stripeConnectAccountId);
  res.status(200).json({ url: loginLink.url });
}
