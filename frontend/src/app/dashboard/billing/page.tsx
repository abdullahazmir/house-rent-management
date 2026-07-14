'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { getApiErrorMessage } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/Button';

interface Plan {
  _id: string;
  name: string;
  price: number;
  billingInterval: string;
  features: string[];
}

interface Subscription {
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  plan: Plan | null;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [subRes, plansRes] = await Promise.all([
      api.get<Subscription>('/subscriptions'),
      api.get<Plan[]>('/plans'),
    ]);
    setSubscription(subRes.data);
    setPlans(plansRes.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    void load();
  }, []);

  const subscribe = async (planId: string) => {
    setError(null);
    setBusyPlanId(planId);
    try {
      const res = await api.post<{ url: string }>('/subscriptions/checkout-session', { planId });
      // eslint-disable-next-line react-hooks/immutability -- full-page redirect to Stripe-hosted Checkout, not React state
      window.location.href = res.data.url;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not start checkout'));
      setBusyPlanId(null);
    }
  };

  const openPortal = async () => {
    setError(null);
    setPortalBusy(true);
    try {
      const res = await api.post<{ url: string }>('/subscriptions/portal-session');
      window.location.href = res.data.url;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not open billing portal'));
      setPortalBusy(false);
    }
  };

  if (!subscription) {
    return (
      <main className="flex-1 p-8">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8">
      <h1 className="mb-2 text-xl font-semibold">Billing</h1>
      <p className="mb-6 text-sm text-gray-600">
        Current status: <span className="font-medium">{subscription.status.replace('_', ' ')}</span>
        {subscription.plan ? ` — ${subscription.plan.name}` : ''}
      </p>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {subscription.plan ? (
        <Button variant="secondary" onClick={openPortal} disabled={portalBusy}>
          {portalBusy ? 'Opening…' : 'Manage billing (Stripe portal)'}
        </Button>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = subscription.plan?._id === plan._id;
          return (
            <div key={plan._id} className="flex flex-col rounded-md border border-gray-200 p-6">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="mt-2 text-2xl font-bold">
                ${plan.price}
                <span className="text-base font-normal text-gray-500">/{plan.billingInterval}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-1 text-sm text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <Button
                className="mt-6"
                disabled={isCurrent || busyPlanId === plan._id}
                onClick={() => subscribe(plan._id)}
              >
                {isCurrent ? 'Current plan' : busyPlanId === plan._id ? 'Redirecting…' : 'Choose plan'}
              </Button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
