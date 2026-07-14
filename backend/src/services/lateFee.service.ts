import { getPaymentsCollection, getLeasesCollection } from '../db/collections';

export async function runLateFeeSweep(): Promise<number> {
  const payments = getPaymentsCollection();
  const leases = getLeasesCollection();

  const now = new Date();
  const candidates = await payments.find({ status: 'pending' }).toArray();

  let flagged = 0;

  for (const payment of candidates) {
    const lease = await leases.findOne({ _id: payment.leaseId });
    if (!lease) continue;

    const graceDeadline = new Date(payment.dueDate);
    graceDeadline.setUTCDate(graceDeadline.getUTCDate() + lease.lateFeeGraceDays);

    if (now <= graceDeadline) continue;

    const lateFee =
      lease.lateFeeType === 'percent' ? Math.round(payment.amountDue * (lease.lateFeeAmount / 100)) : lease.lateFeeAmount;

    await payments.updateOne(
      { _id: payment._id },
      { $set: { status: 'late', lateFeeApplied: lateFee, updatedAt: now } },
    );
    flagged += 1;
  }

  return flagged;
}
