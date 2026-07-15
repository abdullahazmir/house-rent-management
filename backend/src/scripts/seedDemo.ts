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
  {
    name: 'Cedar Park Townhomes',
    addressLine1: '312 Cedar Park Ln',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    type: 'multi_family',
    units: [
      { unitNumber: '1', bedrooms: 2, bathrooms: 1.5, squareFeet: 1050, marketRent: 1750, marketingDescription: 'Two-story townhome with an attached garage and small patio.' },
      { unitNumber: '2', bedrooms: 3, bathrooms: 2.5, squareFeet: 1450, marketRent: 2250, marketingDescription: 'End-unit townhome with extra windows and a finished basement.' },
      { unitNumber: '3', bedrooms: 2, bathrooms: 1, squareFeet: 900, marketRent: 1600, marketingDescription: 'Cozy 2-bed with updated kitchen appliances and hardwood floors.' },
    ],
  },
  {
    name: 'Highland Terrace',
    addressLine1: '77 Highland Ave',
    city: 'Dallas',
    state: 'TX',
    zip: '75204',
    type: 'apartment_complex',
    units: [
      { unitNumber: '101', bedrooms: 1, bathrooms: 1, squareFeet: 600, marketRent: 1250, marketingDescription: 'Ground-floor 1-bed with direct patio access to the courtyard.' },
      { unitNumber: '204', bedrooms: 1, bathrooms: 1, squareFeet: 640, marketRent: 1300, marketingDescription: 'Corner unit with extra natural light and a breakfast nook.' },
      { unitNumber: '310', bedrooms: 2, bathrooms: 2, squareFeet: 1000, marketRent: 1900, marketingDescription: 'Top-floor 2-bed with vaulted ceilings and a private balcony.' },
      { unitNumber: '412', bedrooms: 2, bathrooms: 1, squareFeet: 880, marketRent: 1700, marketingDescription: 'Freshly painted 2-bed near the community pool and gym.' },
    ],
  },
  {
    name: 'Bayou City Flats',
    addressLine1: '5601 Bayou Bend Rd',
    city: 'Houston',
    state: 'TX',
    zip: '77002',
    type: 'apartment_complex',
    units: [
      { unitNumber: 'A101', bedrooms: 1, bathrooms: 1, squareFeet: 620, marketRent: 1150, marketingDescription: 'Efficient 1-bed layout with a walk-in closet and covered parking.' },
      { unitNumber: 'B205', bedrooms: 2, bathrooms: 2, squareFeet: 980, marketRent: 1650, marketingDescription: 'Split 2-bed floor plan, ideal for roommates, with double vanities.' },
      { unitNumber: 'C301', bedrooms: 3, bathrooms: 2, squareFeet: 1300, marketRent: 2100, marketingDescription: 'Large 3-bed with an open-concept kitchen and dining area.' },
    ],
  },
  {
    name: 'Heights Historic Bungalow',
    addressLine1: '1420 Heights Blvd',
    city: 'Houston',
    state: 'TX',
    zip: '77008',
    type: 'single_family',
    units: [
      { unitNumber: 'Main', bedrooms: 3, bathrooms: 2, squareFeet: 1550, marketRent: 2600, marketingDescription: 'Restored 1920s bungalow with original hardwood floors and a wraparound porch.' },
    ],
  },
  {
    name: 'Mile High Commons',
    addressLine1: '900 17th St',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    type: 'apartment_complex',
    units: [
      { unitNumber: '1A', bedrooms: 1, bathrooms: 1, squareFeet: 680, marketRent: 1550, marketingDescription: '1-bed with mountain views from a private balcony.' },
      { unitNumber: '2C', bedrooms: 2, bathrooms: 2, squareFeet: 1020, marketRent: 2150, marketingDescription: 'Modern 2-bed with quartz countertops and stainless appliances.' },
      { unitNumber: '3B', bedrooms: 2, bathrooms: 1, squareFeet: 900, marketRent: 1950, marketingDescription: 'Sunny 2-bed on a high floor with in-unit washer/dryer.' },
      { unitNumber: '4D', bedrooms: 3, bathrooms: 2, squareFeet: 1350, marketRent: 2600, marketingDescription: 'Spacious 3-bed close to light rail, with a dedicated office nook.' },
    ],
  },
  {
    name: 'Rockies View Condos',
    addressLine1: '2200 Broadway',
    city: 'Denver',
    state: 'CO',
    zip: '80205',
    type: 'condo',
    units: [
      { unitNumber: '5F', bedrooms: 1, bathrooms: 1, squareFeet: 700, marketRent: 1600, marketingDescription: 'Top-floor condo with unobstructed Rockies views.' },
      { unitNumber: '6A', bedrooms: 2, bathrooms: 2, squareFeet: 1100, marketRent: 2300, marketingDescription: 'Corner 2-bed condo with floor-to-ceiling windows.' },
    ],
  },
  {
    name: 'Pearl District Lofts',
    addressLine1: '1200 NW Pearl St',
    city: 'Portland',
    state: 'OR',
    zip: '97209',
    type: 'condo',
    units: [
      { unitNumber: 'L1', bedrooms: 1, bathrooms: 1, squareFeet: 750, marketRent: 1700, marketingDescription: 'Industrial-style loft with exposed brick and high ceilings.' },
      { unitNumber: 'L2', bedrooms: 2, bathrooms: 2, squareFeet: 1080, marketRent: 2250, marketingDescription: 'Two-story loft with a rooftop deck shared by residents.' },
      { unitNumber: 'L3', bedrooms: 1, bathrooms: 1, squareFeet: 680, marketRent: 1600, marketingDescription: 'Compact 1-bed loft two blocks from the streetcar line.' },
    ],
  },
  {
    name: 'Willamette Row Houses',
    addressLine1: '830 SE Division St',
    city: 'Portland',
    state: 'OR',
    zip: '97202',
    type: 'multi_family',
    units: [
      { unitNumber: 'Unit 1', bedrooms: 2, bathrooms: 1.5, squareFeet: 950, marketRent: 1850, marketingDescription: 'Row house unit with a small private yard and bike storage.' },
      { unitNumber: 'Unit 2', bedrooms: 3, bathrooms: 2, squareFeet: 1400, marketRent: 2400, marketingDescription: 'Three-level row house with a finished basement office.' },
    ],
  },
  {
    name: 'Emerald City Apartments',
    addressLine1: '400 Pike St',
    city: 'Seattle',
    state: 'WA',
    zip: '98101',
    type: 'apartment_complex',
    units: [
      { unitNumber: '2E', bedrooms: 1, bathrooms: 1, squareFeet: 640, marketRent: 1750, marketingDescription: '1-bed near Pike Place with an updated bathroom.' },
      { unitNumber: '3G', bedrooms: 2, bathrooms: 2, squareFeet: 1000, marketRent: 2400, marketingDescription: '2-bed with a view of the Sound and in-unit laundry.' },
      { unitNumber: '5A', bedrooms: 1, bathrooms: 1, squareFeet: 600, marketRent: 1700, marketingDescription: 'Efficient 1-bed with a Murphy bed setup for extra space.' },
      { unitNumber: '7C', bedrooms: 2, bathrooms: 1, squareFeet: 920, marketRent: 2200, marketingDescription: 'Bright corner 2-bed close to the monorail.' },
    ],
  },
  {
    name: 'Capitol Hill Studios',
    addressLine1: '1500 E Pine St',
    city: 'Seattle',
    state: 'WA',
    zip: '98122',
    type: 'apartment_complex',
    units: [
      { unitNumber: 'S1', bedrooms: 1, bathrooms: 1, squareFeet: 480, marketRent: 1400, marketingDescription: 'Efficient studio-style 1-bed, walkable to everything on the Hill.' },
      { unitNumber: 'S2', bedrooms: 1, bathrooms: 1, squareFeet: 500, marketRent: 1450, marketingDescription: 'Renovated studio-style unit with built-in shelving.' },
      { unitNumber: 'S3', bedrooms: 2, bathrooms: 1, squareFeet: 850, marketRent: 1950, marketingDescription: '2-bed with a shared rooftop terrace and city views.' },
    ],
  },
  {
    name: 'Wrigleyville Flats',
    addressLine1: '3600 N Clark St',
    city: 'Chicago',
    state: 'IL',
    zip: '60613',
    type: 'apartment_complex',
    units: [
      { unitNumber: '2F', bedrooms: 1, bathrooms: 1, squareFeet: 650, marketRent: 1500, marketingDescription: '1-bed a few blocks from Wrigley Field, laundry in building.' },
      { unitNumber: '3R', bedrooms: 2, bathrooms: 1, squareFeet: 950, marketRent: 2000, marketingDescription: 'Classic Chicago 2-flat unit with bay windows.' },
      { unitNumber: '4F', bedrooms: 3, bathrooms: 2, squareFeet: 1300, marketRent: 2450, marketingDescription: 'Top-floor 3-bed with a private roof deck.' },
    ],
  },
  {
    name: 'Lincoln Park Brownstone',
    addressLine1: '2100 N Halsted St',
    city: 'Chicago',
    state: 'IL',
    zip: '60614',
    type: 'multi_family',
    units: [
      { unitNumber: 'Garden', bedrooms: 1, bathrooms: 1, squareFeet: 700, marketRent: 1600, marketingDescription: 'Garden-level unit with a private entrance and exposed brick.' },
      { unitNumber: 'Upper', bedrooms: 3, bathrooms: 2, squareFeet: 1500, marketRent: 2700, marketingDescription: 'Upper duplex unit with original crown molding and a sunroom.' },
    ],
  },
  {
    name: 'Peachtree Commons',
    addressLine1: '1100 Peachtree St NE',
    city: 'Atlanta',
    state: 'GA',
    zip: '30309',
    type: 'apartment_complex',
    units: [
      { unitNumber: '210', bedrooms: 1, bathrooms: 1, squareFeet: 660, marketRent: 1350, marketingDescription: '1-bed with a home office nook and Midtown skyline views.' },
      { unitNumber: '315', bedrooms: 2, bathrooms: 2, squareFeet: 1000, marketRent: 1900, marketingDescription: '2-bed, 2-bath split floor plan with a large kitchen island.' },
      { unitNumber: '408', bedrooms: 2, bathrooms: 1, squareFeet: 880, marketRent: 1750, marketingDescription: 'Renovated 2-bed steps from the Beltline.' },
    ],
  },
  {
    name: 'Old Fourth Ward Lofts',
    addressLine1: '675 Ponce De Leon Ave',
    city: 'Atlanta',
    state: 'GA',
    zip: '30308',
    type: 'condo',
    units: [
      { unitNumber: '3B', bedrooms: 1, bathrooms: 1, squareFeet: 720, marketRent: 1500, marketingDescription: 'Loft-style condo with polished concrete floors and tall windows.' },
      { unitNumber: '5D', bedrooms: 2, bathrooms: 2, squareFeet: 1050, marketRent: 2050, marketingDescription: '2-bed loft with a dedicated parking spot and storage unit.' },
    ],
  },
  {
    name: 'South Beach Suites',
    addressLine1: '210 Ocean Dr',
    city: 'Miami',
    state: 'FL',
    zip: '33139',
    type: 'condo',
    units: [
      { unitNumber: '6A', bedrooms: 1, bathrooms: 1, squareFeet: 620, marketRent: 1900, marketingDescription: 'Art Deco building 1-bed, one block from the beach.' },
      { unitNumber: '8B', bedrooms: 2, bathrooms: 2, squareFeet: 950, marketRent: 2600, marketingDescription: '2-bed with a shared pool deck and ocean-view balcony.' },
      { unitNumber: '12C', bedrooms: 1, bathrooms: 1, squareFeet: 640, marketRent: 2000, marketingDescription: 'High-floor 1-bed with sunrise views over the water.' },
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
