import type { ObjectId } from 'mongodb';

export interface WebhookEventDoc {
  _id?: ObjectId;
  stripeEventId: string;
  type: string;
  processedAt: Date;
}
