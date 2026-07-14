import { connectDB, disconnectDB } from '../db/connection';
import { getPlansCollection } from '../db/collections';
import { stripe } from '../services/stripe.service';

interface PlanSeed {
  name: string;
  price: number;
  limits: { maxProperties: number; maxUnits: number; maxStaff: number };
  features: string[];
  sortOrder: number;
}

const PLAN_SEEDS: PlanSeed[] = [
  {
    name: 'Starter',
    price: 29,
    limits: { maxProperties: 3, maxUnits: 15, maxStaff: 1 },
    features: ['Up to 3 properties', 'Up to 15 units', 'Online rent collection', 'Email support'],
    sortOrder: 0,
  },
  {
    name: 'Pro',
    price: 79,
    limits: { maxProperties: 15, maxUnits: 100, maxStaff: 5 },
    features: ['Up to 15 properties', 'Up to 100 units', 'Online rent collection', 'Priority support'],
    sortOrder: 1,
  },
  {
    name: 'Enterprise',
    price: 199,
    limits: { maxProperties: 1000, maxUnits: 10000, maxStaff: 50 },
    features: ['Unlimited properties*', 'Unlimited units*', 'Online rent collection', 'Dedicated support'],
    sortOrder: 2,
  },
];

async function main(): Promise<void> {
  await connectDB();
  const plans = getPlansCollection();

  for (const seed of PLAN_SEEDS) {
    const existing = await plans.findOne({ name: seed.name });
    if (existing) {
      console.log(`Plan "${seed.name}" already exists — skipping`);
      continue;
    }

    const product = await stripe.products.create({ name: `House Rent Management — ${seed.name}` });
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: seed.price * 100,
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    const now = new Date();
    await plans.insertOne({
      name: seed.name,
      stripePriceId: stripePrice.id,
      stripeProductId: product.id,
      price: seed.price,
      billingInterval: 'month',
      limits: seed.limits,
      features: seed.features,
      isActive: true,
      sortOrder: seed.sortOrder,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`Created plan "${seed.name}" (price: ${stripePrice.id})`);
  }
}

main()
  .catch((err: unknown) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
