'use client';

import { useCallback, useEffect, useState, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../../lib/api';
import { getApiErrorMessage } from '../../../../lib/auth-context';
import type { Property, Unit } from '../../../../types/models';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';

const unitFormSchema = z.object({
  unitNumber: z.string().min(1, 'Unit number is required'),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().min(0),
  marketRent: z.coerce.number().positive('Rent must be greater than 0'),
});

type UnitFormValues = z.infer<typeof unitFormSchema>;

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof unitFormSchema>, unknown, UnitFormValues>({ resolver: zodResolver(unitFormSchema) });

  const load = useCallback(async () => {
    const [propertyRes, unitsRes] = await Promise.all([
      api.get<Property>(`/properties/${id}`),
      api.get<Unit[]>(`/properties/${id}/units`),
    ]);
    setProperty(propertyRes.data);
    setUnits(unitsRes.data);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount, reused after mutations below
    void load();
  }, [load]);

  const onSubmit = async (values: UnitFormValues) => {
    setError(null);
    try {
      await api.post(`/properties/${id}/units`, values);
      reset();
      setShowForm(false);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create unit'));
    }
  };

  if (!property || units === null) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-secondary">{property.name}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {property.addressLine1}, {property.city}, {property.state} {property.zip}
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-secondary">Units</h2>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Add unit'}</Button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 grid max-w-xl grid-cols-1 gap-4 rounded-md border border-muted p-4 sm:grid-cols-2"
        >
          <Input label="Unit number" {...register('unitNumber')} error={errors.unitNumber?.message} />
          <Input label="Monthly rent ($)" type="number" step="0.01" {...register('marketRent')} error={errors.marketRent?.message} />
          <Input label="Bedrooms" type="number" {...register('bedrooms')} error={errors.bedrooms?.message} />
          <Input label="Bathrooms" type="number" step="0.5" {...register('bathrooms')} error={errors.bathrooms?.message} />
          {error ? <p className="text-sm text-brown sm:col-span-2">{error}</p> : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save unit'}
            </Button>
          </div>
        </form>
      ) : null}

      {units.length === 0 ? (
        <p className="text-sm text-gray-500">No units yet. Add one above.</p>
      ) : (
        <ul className="divide-y divide-muted rounded-md border border-muted">
          {units.map((unit) => (
            <li key={unit._id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Unit {unit.unitNumber}</p>
                <p className="text-sm text-gray-500">
                  {unit.bedrooms} bed / {unit.bathrooms} bath — ${unit.marketRent}/mo
                </p>
              </div>
              <span
                className={`self-start rounded-full px-2 py-1 text-xs font-medium sm:self-auto ${
                  unit.status === 'vacant'
                    ? 'bg-secondary/10 text-secondary'
                    : unit.status === 'occupied'
                      ? 'bg-highlight/40 text-secondary'
                      : 'bg-muted text-brown'
                }`}
              >
                {unit.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
