import type { Request, Response } from 'express';
import { getPropertiesCollection, getUnitsCollection, getPaymentsCollection, getOwnersCollection, getPlansCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';

export async function getOwnerAnalytics(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [totalProperties, totalUnits, occupiedUnits, monthPayments, outstanding] = await Promise.all([
    getPropertiesCollection().countDocuments({ ownerId }),
    getUnitsCollection().countDocuments({ ownerId }),
    getUnitsCollection().countDocuments({ ownerId, status: 'occupied' }),
    getPaymentsCollection().find({ ownerId, dueDate: { $gte: monthStart, $lt: monthEnd } }).toArray(),
    getPaymentsCollection()
      .find({ ownerId, status: { $in: ['pending', 'late', 'partial'] } })
      .toArray(),
  ]);

  const rentDueThisMonth = monthPayments.reduce((sum, p) => sum + p.amountDue + p.lateFeeApplied, 0);
  const rentCollectedThisMonth = monthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const outstandingBalance = outstanding.reduce((sum, p) => sum + (p.amountDue + p.lateFeeApplied - p.amountPaid), 0);

  res.status(200).json({
    totalProperties,
    totalUnits,
    occupiedUnits,
    occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
    rentDueThisMonth,
    rentCollectedThisMonth,
    outstandingBalance,
  });
}

export async function getAdminAnalytics(_req: Request, res: Response): Promise<void> {
  const owners = getOwnersCollection();

  const [totalOwners, activeSubs, trialingCount, allOwners, plans] = await Promise.all([
    owners.countDocuments({}),
    owners.countDocuments({ 'subscription.status': 'active' }),
    owners.countDocuments({ 'subscription.status': 'trialing' }),
    owners.find({ 'subscription.status': { $in: ['active', 'past_due'] } }, { projection: { subscription: 1 } }).toArray(),
    getPlansCollection().find({}).toArray(),
  ]);

  const priceByPlanId = new Map(plans.map((p) => [p._id!.toHexString(), p.price]));
  const mrr = allOwners.reduce((sum, o) => {
    const planId = o.subscription.planId?.toHexString();
    return sum + (planId ? (priceByPlanId.get(planId) ?? 0) : 0);
  }, 0);

  res.status(200).json({
    totalOwners,
    activeSubscriptions: activeSubs,
    trialingCount,
    mrr,
  });
}
