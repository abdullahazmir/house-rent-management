'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../lib/api';
import { getApiErrorMessage } from '../../../lib/auth-context';
import type { MaintenanceRequest, MaintenanceStatus } from '../../../types/maintenance';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const requestFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function PortalMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormValues>({ resolver: zodResolver(requestFormSchema), defaultValues: { priority: 'medium' } });

  const load = useCallback(async () => {
    const res = await api.get<MaintenanceRequest[]>('/maintenance-requests/me');
    setRequests(res.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    void load();
  }, [load]);

  const onSubmit = async (values: RequestFormValues) => {
    setError(null);
    try {
      await api.post('/maintenance-requests/me', values);
      reset();
      setShowForm(false);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit request'));
    }
  };

  return (
    <main className="flex-1 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Maintenance requests</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'New request'}</Button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 grid max-w-xl grid-cols-2 gap-4 rounded-md border border-gray-200 p-4"
        >
          <div className="col-span-2">
            <Input label="Title" {...register('title')} error={errors.title?.message} />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea {...register('description')} rows={3} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            {errors.description ? <p className="text-xs text-red-600">{errors.description.message}</p> : null}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <select {...register('priority')} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          {error ? <p className="col-span-2 text-sm text-red-600">{error}</p> : null}
          <div className="col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit request'}
            </Button>
          </div>
        </form>
      ) : null}

      {requests === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-500">No maintenance requests yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
          {requests.map((r) => (
            <li key={r._id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-gray-500">{r.description}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                {r.status.replace('_', ' ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
