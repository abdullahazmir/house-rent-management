/**
 * Usage: npm run seed:demo
 *
 * Creates a demo owner (with sample properties + publicly-listed vacant units)
 * and a demo super_admin, for the rubric's "Demo login" button and the final
 * submission's required credentials. Idempotent — safe to run more than once.
 */
import { ObjectId } from 'mongodb';
import { connectDB, disconnectDB } from '../db/connection';
import {
  getUsersCollection,
  getOwnersCollection,
  getPropertiesCollection,
  getUnitsCollection,
} from '../db/collections';
import { hashPassword } from '../utils/password';
import { stripe } from '../services/stripe.service';
import { env } from '../config/env';
import type { PropertyType } from '../models/Property';

const DEMO_OWNER_EMAIL = 'demo.owner@houserent.dev';
const DEMO_OWNER_PASSWORD = 'DemoOwner123!';
const DEMO_ADMIN_EMAIL = 'demo.admin@houserent.dev';
const DEMO_ADMIN_PASSWORD = 'DemoAdmin123!';

async function ensureDemoAdmin(): Promise<void> {
  const users = getUsersCollection();
  const existing = await users.findOne({ email: DEMO_ADMIN_EMAIL });
  if (existing) {
    console.log(`Demo admin already exists: ${DEMO_ADMIN_EMAIL}`);
    return;
  }

  const passwordHash = await hashPassword(DEMO_ADMIN_PASSWORD);
  const now = new Date();
  await users.insertOne({
    email: DEMO_ADMIN_EMAIL,
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
  console.log(`Demo admin created: ${DEMO_ADMIN_EMAIL}`);
}

/** Mirrors auth.controller.ts#register (User + Owner + real Stripe customer) so the
 *  demo account's billing state is realistic instead of a stripped-down fake. */
async function ensureDemoOwner(): Promise<ObjectId> {
  const users = getUsersCollection();
  const owners = getOwnersCollection();

  const existingUser = await users.findOne({ email: DEMO_OWNER_EMAIL });
  if (existingUser?.ownerId) {
    console.log(`Demo owner already exists: ${DEMO_OWNER_EMAIL}`);
    return existingUser.ownerId;
  }

  const passwordHash = await hashPassword(DEMO_OWNER_PASSWORD);
  const now = new Date();
  const userId = new ObjectId();
  const ownerId = new ObjectId();

  await users.insertOne({
    _id: userId,
    email: DEMO_OWNER_EMAIL,
    passwordHash,
    role: 'owner',
    ownerId,
    firstName: null,
    lastName: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const trialEndsAt = new Date(now.getTime() + env.DEFAULT_TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const stripeCustomer = await stripe.customers.create({
    email: DEMO_OWNER_EMAIL,
    name: 'Demo Property Co.',
    metadata: { ownerId: ownerId.toHexString() },
  });

  await owners.insertOne({
    _id: ownerId,
    companyName: 'Demo Property Co.',
    contactName: 'Demo Owner',
    contactEmail: DEMO_OWNER_EMAIL,
    contactPhone: null,
    userId,
    stripeCustomerId: stripeCustomer.id,
    stripeConnectAccountId: null,
    stripeConnectOnboardingComplete: false,
    stripeConnectChargesEnabled: false,
    stripeConnectPayoutsEnabled: false,
    subscription: {
      planId: null,
      stripeSubscriptionId: null,
      status: 'trialing',
      currentPeriodEnd: null,
      trialEndsAt,
      cancelAtPeriodEnd: false,
    },
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Demo owner created: ${DEMO_OWNER_EMAIL}`);
  return ownerId;
}

interface UnitSeed {
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  marketRent: number;
  marketingDescription: string;
}

interface PropertySeed {
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  type: PropertyType;
  units: UnitSeed[];
}

const PROPERTY_SEEDS: PropertySeed[] = [
  {
    name: 'Maple Grove Apartments',
    addressLine1: '120 Maple Grove Ave',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    type: 'apartment_complex',
    units: [
      {
        unitNumber: '1A',
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: 650,
        marketRent: 1350,
        marketingDescription: 'Bright 1-bed with a private balcony, steps from downtown.',
      },
      {
        unitNumber: '2B',
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 950,
        marketRent: 1850,
        marketingDescription: 'Spacious 2-bed, 2-bath with in-unit laundry and a walk-in closet.',
      },
    ],
  },
  {
    name: 'Riverside Duplex',
    addressLine1: '48 Riverside Dr',
    city: 'Austin',
    state: 'TX',
    zip: '78704',
    type: 'multi_family',
    units: [
      {
        unitNumber: 'A',
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1400,
        marketRent: 2400,
        marketingDescription: 'Renovated 3-bed duplex unit with a fenced backyard.',
      },
    ],
  },
  {
    name: 'Downtown Lofts',
    addressLine1: '900 Congress Ave',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    type: 'condo',
    units: [
      {
        unitNumber: '5F',
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: 720,
        marketRent: 1600,
        marketingDescription: 'Modern loft with floor-to-ceiling windows and skyline views.',
      },
    ],
  },
];

async function seedPropertiesAndUnits(ownerId: ObjectId): Promise<void> {
  const properties = getPropertiesCollection();
  const units = getUnitsCollection();

  for (const seed of PROPERTY_SEEDS) {
    const existing = await properties.findOne({ ownerId, name: seed.name });
    if (existing) {
      console.log(`Property "${seed.name}" already exists — skipping`);
      continue;
    }

    const now = new Date();
    const propertyId = new ObjectId();
    await properties.insertOne({
      _id: propertyId,
      ownerId,
      name: seed.name,
      addressLine1: seed.addressLine1,
      addressLine2: null,
      city: seed.city,
      state: seed.state,
      zip: seed.zip,
      country: 'US',
      type: seed.type,
      yearBuilt: null,
      notes: null,
      imageUrl: null,
      createdAt: now,
      updatedAt: now,
    });

    for (const unit of seed.units) {
      await units.insertOne({
        ownerId,
        propertyId,
        unitNumber: unit.unitNumber,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        squareFeet: unit.squareFeet,
        marketRent: unit.marketRent,
        status: 'vacant',
        imageUrl: null,
        marketingDescription: unit.marketingDescription,
        isPubliclyListed: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log(`Created property "${seed.name}" with ${seed.units.length} public unit(s)`);
  }
}

async function main(): Promise<void> {
  await connectDB();

  await ensureDemoAdmin();
  const ownerId = await ensureDemoOwner();
  await seedPropertiesAndUnits(ownerId);

  console.log('\nDemo credentials:');
  console.log(`  Owner — email: ${DEMO_OWNER_EMAIL}  password: ${DEMO_OWNER_PASSWORD}`);
  console.log(`  Admin — email: ${DEMO_ADMIN_EMAIL}  password: ${DEMO_ADMIN_PASSWORD}`);
}

main()
  .catch((err: unknown) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
