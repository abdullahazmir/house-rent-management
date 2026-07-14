'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';
import { getApiErrorMessage } from '../../../../lib/auth-context';
import { Button } from '../../../../components/ui/Button';

interface ConnectStatus {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

export default function ConnectPaymentsSettingsPage() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await api.get<ConnectStatus>('/owners/me/connect/status');
    setStatus(res.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    void load();
  }, []);

  const startOnboarding = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<{ url: string }>('/owners/me/connect/onboard');
      window.location.href = res.data.url;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not start Stripe onboarding'));
      setBusy(false);
    }
  };

  const openDashboard = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<{ url: string }>('/owners/me/connect/dashboard-link');
      window.open(res.data.url, '_blank');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not open your Stripe dashboard'));
    } finally {
      setBusy(false);
    }
  };

  if (!status) {
    return (
      <main className="flex-1 p-8">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8">
      <h1 className="mb-2 text-xl font-semibold">Rent collection</h1>
      <p className="mb-6 text-sm text-gray-600">
        Connect a Stripe account to accept rent payments online from your tenants. Payouts go directly to your bank
        account.
      </p>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <div className="max-w-md rounded-md border border-gray-200 p-6">
        <dl className="mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Onboarding</dt>
            <dd>{status.onboardingComplete ? 'Complete' : 'Not started'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Accepting payments</dt>
            <dd>{status.chargesEnabled ? 'Yes' : 'No'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Payouts enabled</dt>
            <dd>{status.payoutsEnabled ? 'Yes' : 'No'}</dd>
          </div>
        </dl>

        {!status.chargesEnabled ? (
          <Button onClick={startOnboarding} disabled={busy}>
            {status.connected ? 'Finish Stripe onboarding' : 'Enable rent collection'}
          </Button>
        ) : (
          <Button variant="secondary" onClick={openDashboard} disabled={busy}>
            Open Stripe dashboard
          </Button>
        )}
      </div>
    </main>
  );
}
