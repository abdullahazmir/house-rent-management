'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../lib/api';
import { getApiErrorMessage } from '../../../lib/auth-context';
import type { Tenant } from '../../../types/models';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const inviteFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

const STATUS_STYLES: Record<Tenant['status'], string> = {
  invited: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  past: 'bg-gray-100 text-gray-600',
  inactive: 'bg-gray-100 text-gray-600',
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({ resolver: zodResolver(inviteFormSchema) });

  const loadTenants = async () => {
    const res = await api.get<Tenant[]>('/tenants');
    setTenants(res.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount, reused after mutations below
    void loadTenants();
  }, []);

  const onSubmit = async (values: InviteFormValues) => {
    setError(null);
    setLastInviteLink(null);
    try {
      const res = await api.post<Tenant>('/tenants', values);
      setLastInviteLink(res.data.inviteLink ?? null);
      reset();
      setShowForm(false);
      await loadTenants();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not invite tenant'));
    }
  };

  return (
    <main className="flex-1 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tenants</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Invite tenant'}</Button>
      </div>

      {lastInviteLink ? (
        <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm">
          <p className="font-medium text-blue-900">Invite created — no email provider is wired up yet.</p>
          <p className="mt-1 break-all text-blue-800">
            Share this link with the tenant directly: <span className="font-mono">{lastInviteLink}</span>
          </p>
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 grid max-w-xl grid-cols-2 gap-4 rounded-md border border-gray-200 p-4"
        >
          <Input label="First name" {...register('firstName')} error={errors.firstName?.message} />
          <Input label="Last name" {...register('lastName')} error={errors.lastName?.message} />
          <div className="col-span-2">
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          </div>
          {error ? <p className="col-span-2 text-sm text-red-600">{error}</p> : null}
          <div className="col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending invite…' : 'Send invite'}
            </Button>
          </div>
        </form>
      ) : null}

      {tenants === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : tenants.length === 0 ? (
        <p className="text-sm text-gray-500">No tenants yet. Invite one above.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
          {tenants.map((tenant) => (
            <li key={tenant._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">
                  {tenant.firstName} {tenant.lastName}
                </p>
                <p className="text-sm text-gray-500">{tenant.email}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[tenant.status]}`}>
                {tenant.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
