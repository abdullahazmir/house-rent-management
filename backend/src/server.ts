import cron from 'node-cron';
import { env } from './config/env';
import { connectDB } from './db/connection';
import { runLateFeeSweep } from './services/lateFee.service';
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
}

main().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
