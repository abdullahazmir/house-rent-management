import Link from 'next/link';
import { Button } from '../../../components/ui/Button';

interface PublicPlan {
  _id: string;
  name: string;
  price: number;
  billingInterval: string;
  features: string[];
}

async function getPlans(): Promise<PublicPlan[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  const res = await fetch(`${apiUrl}/plans`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function PricingPage() {
  const plans = await getPlans();

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <h1 className="mb-8 text-center text-3xl font-semibold">Simple, transparent pricing</h1>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan._id} className="flex flex-col rounded-md border border-gray-200 p-6">
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold">
              ${plan.price}
              <span className="text-base font-normal text-gray-500">/{plan.billingInterval}</span>
            </p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-600">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <Link href="/register" className="mt-6">
              <Button className="w-full">Get started</Button>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
