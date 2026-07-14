import type { NextFunction, Request, Response } from 'express';
import { getOwnersCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { ForbiddenError, NotFoundError } from '../utils/errors';

const BLOCKED_STATUSES = new Set(['past_due', 'canceled', 'unpaid']);

export async function requireActiveSubscription(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = parseObjectId(req.ownerId!);
    const owner = await getOwnersCollection().findOne({ _id: ownerId });
    if (!owner) throw new NotFoundError('Owner not found');

    if (BLOCKED_STATUSES.has(owner.subscription.status)) {
      throw new ForbiddenError(
        `Your subscription is ${owner.subscription.status.replace('_', ' ')} — update your billing to continue.`,
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
