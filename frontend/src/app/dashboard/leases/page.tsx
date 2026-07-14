'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../lib/api';
import { getApiErrorMessage } from '../../../lib/auth-context';
import type { Lease, Property, Unit, Tenant } from '../../../types/models';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const leaseFormSchema = z.object({
  propertyId: z.string().min(1, 'Select a property'),
  unitId: z.string().min(1, 'Select a unit'),
  tenantIds: z.array(z.string()).min(1, 'Select at least one tenant'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  rentAmount: z.coerce.number().positive('Rent must be greater than 0'),
  rentDueDayOfMonth: z.coerce.number().int().min(1).max(28),
});

type LeaseFormValues = z.infer<typeof leaseFormSchema>;

const STATUS_STYLES: Record<Lease['status'], string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-secondary/10 text-secondary',
  ended: 'bg-gray-100 text-gray-600',
  terminated: 'bg-primary/10 text-brown',
};

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[] | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof leaseFormSchema>, unknown, LeaseFormValues>({
    resolver: zodResolver(leaseFormSchema),
    defaultValues: { rentDueDayOfMonth: 1 },
  });

  const selectedPropertyId = watch('propertyId');

  const loadBaseData = async () => {
    const [leasesRes, propertiesRes, tenantsRes] = await Promise.all([
      api.get<Lease[]>('/leases'),
      api.get<Property[]>('/properties'),
      api.get<Tenant[]>('/tenants'),
    ]);
    setLeases(leasesRes.data);
    setProperties(propertiesRes.data);
    setTenants(tenantsRes.data);
  };

  useEffect(() => {
    void loadBaseData();
  }, []);

  useEffect(() => {
    if (!selectedPropertyId) {
      setUnits([]);
      return;
    }
    void api.get<Unit[]>(`/properties/${selectedPropertyId}/units`).then((res) => setUnits(res.data));
  }, [selectedPropertyId]);

  const onSubmit = async (values: LeaseFormValues) => {
    setError(null);
    try {
      await api.post('/leases', values);
      reset();
      setShowForm(false);
      await loadBaseData();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create lease'));
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-secondary">Leases</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Create lease'}</Button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 grid max-w-2xl grid-cols-1 gap-4 rounded-md border border-muted p-4 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-secondary">Property</label>
            <select {...register('propertyId')} className="rounded-md border border-secondary/30 px-3 py-2 text-sm">
              <option value="">Select a property…</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.propertyId ? <p className="text-xs text-brown">{errors.propertyId.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-secondary">Unit</label>
            <select {...register('unitId')} className="rounded-md border border-secondary/30 px-3 py-2 text-sm" disabled={!selectedPropertyId}>
              <option value="">Select a unit…</option>
              {units.map((u) => (
                <option key={u._id} value={u._id}>
                  Unit {u.unitNumber} ({u.status})
                </option>
              ))}
            </select>
            {errors.unitId ? <p className="text-xs text-brown">{errors.unitId.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-secondary">Tenants</label>
            <Controller
              control={control}
              name="tenantIds"
              render={({ field }) => (
                <div className="flex flex-wrap gap-3 rounded-md border border-secondary/30 p-2">
                  {tenants.length === 0 ? (
                    <span className="text-sm text-gray-500">No tenants yet — invite one from the Tenants tab first.</span>
                  ) : (
                    tenants.map((t) => (
                      <label key={t._id} className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={field.value?.includes(t._id) ?? false}
                          onChange={(e) => {
                            const current = field.value ?? [];
                            field.onChange(e.target.checked ? [...current, t._id] : current.filter((id) => id !== t._id));
                          }}
                        />
                        {t.firstName} {t.lastName}
                      </label>
                    ))
                  )}
                </div>
              )}
            />
            {errors.tenantIds ? <p className="text-xs text-brown">{errors.tenantIds.message}</p> : null}
          </div>

          <Input label="Start date" type="date" {...register('startDate')} error={errors.startDate?.message} />
          <Input label="End date" type="date" {...register('endDate')} error={errors.endDate?.message} />
          <Input label="Monthly rent ($)" type="number" step="0.01" {...register('rentAmount')} error={errors.rentAmount?.message} />
          <Input label="Rent due day of month" type="number" {...register('rentDueDayOfMonth')} error={errors.rentDueDayOfMonth?.message} />

          {error ? <p className="text-sm text-brown sm:col-span-2">{error}</p> : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Create lease'}
            </Button>
          </div>
        </form>
      ) : null}

      {leases === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : leases.length === 0 ? (
        <p className="text-sm text-gray-500">No leases yet. Create one above.</p>
      ) : (
        <ul className="divide-y divide-muted rounded-md border border-muted">
          {leases.map((lease) => {
            const property = properties.find((p) => p._id === lease.propertyId);
            const unit = units.find((u) => u._id === lease.unitId);
            return (
              <li key={lease._id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {property?.name ?? 'Property'} {unit ? `— Unit ${unit.unitNumber}` : ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    ${lease.rentAmount}/mo · {new Date(lease.startDate).toLocaleDateString()} –{' '}
                    {new Date(lease.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`self-start rounded-full px-2 py-1 text-xs font-medium sm:self-auto ${STATUS_STYLES[lease.status]}`}>
                  {lease.status}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
