import type { ObjectId } from 'mongodb';

export interface PlanLimits {
  maxProperties: number;
  maxUnits: number;
  maxStaff: number;
}

export interface PlanDoc {
  _id?: ObjectId;
  name: string;
  stripePriceId: string;
  stripeProductId: string;
  price: number;
  billingInterval: 'month' | 'year';
  limits: PlanLimits;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
