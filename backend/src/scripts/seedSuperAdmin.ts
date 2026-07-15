/**
 * Usage: npm run seed:admin -- --email=admin@example.com --password=changeme123
 */
import { connectDB, disconnectDB } from '../db/connection';
import { getUsersCollection } from '../db/collections';
import { hashPassword } from '../utils/password';

function parseArg(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg?.slice(`--${name}=`.length);
}

async function main(): Promise<void> {
  const email = parseArg('email')?.toLowerCase();
  const password = parseArg('password');

  if (!email || !password) {
    console.error('Usage: npm run seed:admin -- --email=admin@example.com --password=yourpassword');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  await connectDB();
  const users = getUsersCollection();

  const existing = await users.findOne({ email });
  if (existing) {
    console.error(`A user with email "${email}" already exists (role: ${existing.role})`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  await users.insertOne({
    email,
    passwordHash,
    role: 'super_admin',
    ownerId: null,
    firstName: null,
    lastName: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Super admin created: ${email}`);
}

main()
  .catch((err: unknown) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
