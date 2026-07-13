import type { ObjectId } from 'mongodb';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete';

export interface OwnerSubscription {
  planId: ObjectId | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface OwnerDoc {
  _id?: ObjectId;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  userId: ObjectId;
  stripeCustomerId: string | null;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingComplete: boolean;
  stripeConnectChargesEnabled: boolean;
  stripeConnectPayoutsEnabled: boolean;
  subscription: OwnerSubscription;
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}
