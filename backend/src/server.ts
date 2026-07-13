import { env } from './config/env';
import { connectDB } from './db/connection';
import app from './app';

async function main(): Promise<void> {
  await connectDB();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${env.PORT}`);
  });
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});
