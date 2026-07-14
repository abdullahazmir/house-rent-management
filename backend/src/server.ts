import cron from 'node-cron';
import { env } from './config/env';
import { connectDB } from './db/connection';
import { runLateFeeSweep } from './services/lateFee.service';
import { runPaymentReminderSweep } from './services/reminder.service';
import app from './app';

async function main(): Promise<void> {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });

  // Daily at 02:00 — flip pending payments past their grace period to 'late' and apply the fee.
  cron.schedule('0 2 * * *', () => {
    runLateFeeSweep()
      .then((count) => console.log(`Late fee sweep: flagged ${count} payment(s) as late`))
      .catch((err: unknown) => console.error('Late fee sweep failed:', err));
  });

  // Daily at 09:00 — remind tenants of rent due within the next few days.
  cron.schedule('0 9 * * *', () => {
    runPaymentReminderSweep()
      .then((count) => console.log(`Payment reminder sweep: sent ${count} reminder(s)`))
      .catch((err: unknown) => console.error('Payment reminder sweep failed:', err));
  });
}

main().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
