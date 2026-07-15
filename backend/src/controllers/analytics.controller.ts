import type { Request, Response } from 'express';
import { getPropertiesCollection, getUnitsCollection, getPaymentsCollection, getOwnersCollection, getPlansCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';

const TREND_MONTHS = 6;

/** Builds the last `count` UTC month buckets (oldest first), each `{ year, month, label }`. */
function buildMonthBuckets(now: Date, count: number): { year: number; month: number; label: string }[] {
  const buckets = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1, // 1-indexed to match Mongo's $month
      label: d.toLocaleString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
    });
  }
  return buckets;
}

export async function getOwnerAnalytics(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const trendStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (TREND_MONTHS - 1), 1));

  const [totalProperties, totalUnits, occupiedUnits, monthPayments, outstanding, occupancyRaw, rentTrendRaw] =
    await Promise.all([
      getPropertiesCollection().countDocuments({ ownerId }),
      getUnitsCollection().countDocuments({ ownerId }),
      getUnitsCollection().countDocuments({ ownerId, status: 'occupied' }),
      getPaymentsCollection().find({ ownerId, dueDate: { $gte: monthStart, $lt: monthEnd } }).toArray(),
      getPaymentsCollection()
        .find({ ownerId, status: { $in: ['pending', 'late', 'partial'] } })
        .toArray(),
      getUnitsCollection()
        .aggregate<{ _id: string; count: number }>([{ $match: { ownerId } }, { $group: { _id: '$status', count: { $sum: 1 } } }])
        .toArray(),
      getPaymentsCollection()
        .aggregate<{ _id: { year: number; month: number }; due: number; collected: number }>([
          { $match: { ownerId, dueDate: { $gte: trendStart, $lt: monthEnd } } },
          {
            $group: {
              _id: { year: { $year: '$dueDate' }, month: { $month: '$dueDate' } },
              due: { $sum: { $add: ['$amountDue', '$lateFeeApplied'] } },
              collected: { $sum: '$amountPaid' },
            },
          },
        ])
        .toArray(),
    ]);

  const rentDueThisMonth = monthPayments.reduce((sum, p) => sum + p.amountDue + p.lateFeeApplied, 0);
  const rentCollectedThisMonth = monthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const outstandingBalance = outstanding.reduce((sum, p) => sum + (p.amountDue + p.lateFeeApplied - p.amountPaid), 0);

  const occupancyByStatus = new Map(occupancyRaw.map((r) => [r._id, r.count]));
  const occupancyBreakdown = ['vacant', 'occupied', 'maintenance'].map((status) => ({
    status,
    count: occupancyByStatus.get(status) ?? 0,
  }));

  const trendByMonth = new Map(rentTrendRaw.map((r) => [`${r._id.year}-${r._id.month}`, r]));
  const rentTrend = buildMonthBuckets(now, TREND_MONTHS).map(({ year, month, label }) => {
    const bucket = trendByMonth.get(`${year}-${month}`);
    return { month: label, due: bucket?.due ?? 0, collected: bucket?.collected ?? 0 };
  });

  res.status(200).json({
    totalProperties,
    totalUnits,
    occupiedUnits,
    occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
    rentDueThisMonth,
    rentCollectedThisMonth,
    outstandingBalance,
    occupancyBreakdown,
    rentTrend,
  });
}

export async function getAdminAnalytics(_req: Request, res: Response): Promise<void> {
  const owners = getOwnersCollection();

  const [totalOwners, activeSubs, trialingCount, allOwners, billableOwners, plans] = await Promise.all([
    owners.countDocuments({}),
    owners.countDocuments({ 'subscription.status': 'active' }),
    owners.countDocuments({ 'subscription.status': 'trialing' }),
    owners.find({}, { projection: { subscription: 1 } }).toArray(),
    owners.find({ 'subscription.status': { $in: ['active', 'past_due'] } }, { projection: { subscription: 1 } }).toArray(),
    getPlansCollection().find({}).toArray(),
  ]);

  const priceByPlanId = new Map(plans.map((p) => [p._id!.toHexString(), p.price]));
  const nameByPlanId = new Map(plans.map((p) => [p._id!.toHexString(), p.name]));
  const mrr = billableOwners.reduce((sum, o) => {
    const planId = o.subscription.planId?.toHexString();
    return sum + (planId ? (priceByPlanId.get(planId) ?? 0) : 0);
  }, 0);

  // No historical MRR snapshots are stored, so a true MRR-over-time trend isn't available yet —
  // these two breakdowns are real, current-state charts instead of a fabricated history.
  const mrrByPlanTotals = new Map<string, number>();
  for (const o of billableOwners) {
    const planId = o.subscription.planId?.toHexString();
    if (!planId) continue;
    const planName = nameByPlanId.get(planId) ?? 'Unknown plan';
    mrrByPlanTotals.set(planName, (mrrByPlanTotals.get(planName) ?? 0) + (priceByPlanId.get(planId) ?? 0));
  }
  const mrrByPlan = Array.from(mrrByPlanTotals, ([plan, amount]) => ({ plan, amount }));

  const statusCounts = new Map<string, number>();
  for (const o of allOwners) {
    statusCounts.set(o.subscription.status, (statusCounts.get(o.subscription.status) ?? 0) + 1);
  }
  const subscriptionStatusBreakdown = Array.from(statusCounts, ([status, count]) => ({ status, count }));

  res.status(200).json({
    totalOwners,
    activeSubscriptions: activeSubs,
    trialingCount,
    mrr,
    mrrByPlan,
    subscriptionStatusBreakdown,
  });
}
