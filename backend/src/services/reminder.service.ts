import { getPaymentsCollection, getTenantsCollection } from '../db/collections';
import { sendPaymentReminderEmail } from './email.service';

const REMINDER_WINDOW_DAYS = 3;

/** Sends a reminder for payments due within the next few days. Not idempotent-tracked
 * (fine for a once-daily best-effort reminder — duplicate sends aren't harmful). */
export async function runPaymentReminderSweep(): Promise<number> {
  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + REMINDER_WINDOW_DAYS);

  const upcoming = await getPaymentsCollection()
    .find({ status: 'pending', dueDate: { $gte: now, $lte: windowEnd } })
    .toArray();

  let sent = 0;
  for (const payment of upcoming) {
    const tenants = await getTenantsCollection()
      .find({ _id: { $in: payment.tenantIds } })
      .toArray();
    await Promise.all(
      tenants.map((tenant) => sendPaymentReminderEmail(tenant.email, payment.amountDue, payment.dueDate)),
    );
    sent += tenants.length;
  }

  return sent;
}
