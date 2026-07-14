import { MongoClient, type Db } from 'mongodb';
import { env } from '../config/env';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  db = client.db(env.MONGODB_DB_NAME);

  await createIndexes(db);

  console.log(`Connected to MongoDB Atlas database "${env.MONGODB_DB_NAME}"`);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected — call connectDB() before getDb()');
  }
  return db;
}

export async function disconnectDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

async function createIndexes(database: Db): Promise<void> {
  await database.collection('users').createIndexes([
    { key: { email: 1 }, unique: true, name: 'uniq_email' },
    { key: { ownerId: 1 }, name: 'by_owner' },
  ]);

  // stripeCustomerId/stripeConnectAccountId are stored as explicit `null` until Stripe is
  // wired up (Phase 2/3), so a `sparse` index won't help — sparse only skips *missing* fields,
  // not `null` values. A partial index scoped to actual strings is what we need instead.
  await database.collection('owners').createIndexes([
    {
      key: { stripeCustomerId: 1 },
      unique: true,
      partialFilterExpression: { stripeCustomerId: { $type: 'string' } },
      name: 'uniq_stripe_customer',
    },
    {
      key: { stripeConnectAccountId: 1 },
      unique: true,
      partialFilterExpression: { stripeConnectAccountId: { $type: 'string' } },
      name: 'uniq_stripe_connect',
    },
  ]);

  await database.collection('properties').createIndexes([{ key: { ownerId: 1, createdAt: -1 }, name: 'by_owner' }]);

  await database
    .collection('units')
    .createIndexes([{ key: { ownerId: 1, propertyId: 1 }, name: 'by_owner_property' }]);

  await database.collection('leases').createIndexes([
    { key: { ownerId: 1, unitId: 1 }, name: 'by_owner_unit' },
    { key: { ownerId: 1, tenantIds: 1 }, name: 'by_owner_tenant' },
  ]);

  await database.collection('tenants').createIndexes([
    { key: { ownerId: 1, createdAt: -1 }, name: 'by_owner' },
    { key: { ownerId: 1, email: 1 }, unique: true, name: 'uniq_owner_email' },
  ]);

  await database.collection('plans').createIndexes([{ key: { sortOrder: 1 }, name: 'by_sort_order' }]);

  await database
    .collection('webhookEvents')
    .createIndexes([{ key: { stripeEventId: 1 }, unique: true, name: 'uniq_stripe_event' }]);

  await database.collection('payments').createIndexes([
    { key: { ownerId: 1, leaseId: 1, dueDate: 1 }, name: 'by_owner_lease_due' },
    { key: { ownerId: 1, status: 1 }, name: 'by_owner_status' },
    { key: { tenantIds: 1 }, name: 'by_tenant' },
  ]);

  await database.collection('maintenanceRequests').createIndexes([
    { key: { ownerId: 1, status: 1, createdAt: -1 }, name: 'by_owner_status' },
    { key: { tenantId: 1, createdAt: -1 }, name: 'by_tenant' },
  ]);

  await database
    .collection('auditLogs')
    .createIndexes([{ key: { ownerId: 1, createdAt: -1 }, name: 'by_owner' }]);
}
