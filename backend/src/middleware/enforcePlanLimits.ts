import type { NextFunction, Request, Response } from 'express';
import { getOwnersCollection, getPlansCollection, getPropertiesCollection, getUnitsCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError, PlanLimitError } from '../utils/errors';

type LimitResource = 'properties' | 'units';

export function enforcePlanLimits(resource: LimitResource) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = parseObjectId(req.ownerId!);
      const owner = await getOwnersCollection().findOne({ _id: ownerId });
      if (!owner) throw new NotFoundError('Owner not found');

      // No plan selected yet (still on a bare trial) — allow a generous default rather than blocking signup flow.
      if (!owner.subscription.planId) {
        next();
        return;
      }

      const plan = await getPlansCollection().findOne({ _id: owner.subscription.planId });
      if (!plan) {
        next();
        return;
      }

      if (resource === 'properties') {
        const count = await getPropertiesCollection().countDocuments({ ownerId });
        if (count >= plan.limits.maxProperties) {
          throw new PlanLimitError(
            `Your plan allows up to ${plan.limits.maxProperties} properties. Upgrade to add more.`,
          );
        }
      } else {
        const count = await getUnitsCollection().countDocuments({ ownerId });
        if (count >= plan.limits.maxUnits) {
          throw new PlanLimitError(`Your plan allows up to ${plan.limits.maxUnits} units. Upgrade to add more.`);
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
