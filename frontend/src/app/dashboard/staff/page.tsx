'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../lib/api';
import { getApiErrorMessage } from '../../../lib/auth-context';
import type { StaffMember } from '../../../types/staff';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const staffFormSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({ resolver: zodResolver(staffFormSchema) });

  const load = useCallback(async () => {
    const res = await api.get<StaffMember[]>('/staff');
    setStaff(res.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    void load();
  }, [load]);

  const onSubmit = async (values: StaffFormValues) => {
    setError(null);
    try {
      await api.post('/staff', values);
      reset();
      setShowForm(false);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create staff account'));
    }
  };

  const toggleActive = async (member: StaffMember) => {
    setBusyId(member._id);
    try {
      await api.patch(`/staff/${member._id}/${member.isActive ? 'deactivate' : 'activate'}`);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="flex-1 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Staff</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Add staff member'}</Button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 grid max-w-md grid-cols-1 gap-4 rounded-md border border-gray-200 p-4"
        >
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Temporary password" type="password" {...register('password')} error={errors.password?.message} />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create account'}
          </Button>
        </form>
      ) : null}

      {staff === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : staff.length === 0 ? (
        <p className="text-sm text-gray-500">No staff accounts yet. Staff can manage properties, leases, and tenants, but never billing.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
          {staff.map((member) => (
            <li key={member._id} className="flex items-center justify-between p-4">
              <span className="font-medium">{member.email}</span>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {member.isActive ? 'active' : 'inactive'}
                </span>
                <Button variant="secondary" disabled={busyId === member._id} onClick={() => toggleActive(member)}>
                  {member.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
