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

  await database.collection('owners').createIndexes([
    { key: { stripeCustomerId: 1 }, unique: true, sparse: true, name: 'uniq_stripe_customer' },
    { key: { stripeConnectAccountId: 1 }, unique: true, sparse: true, name: 'uniq_stripe_connect' },
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
}
