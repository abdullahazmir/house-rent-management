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
  imageUrl: z.union([z.literal(''), z.string().url('Enter a valid URL')]).optional(),
  marketingDescription: z.string().max(2000).optional(),
  isPubliclyListed: z.boolean().optional(),
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
      await api.post(`/properties/${id}/units`, { ...values, imageUrl: values.imageUrl || undefined });
      reset();
      setShowForm(false);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create unit'));
    }
  };

  const togglePublicListing = async (unit: Unit) => {
    setError(null);
    try {
      await api.patch(`/properties/${id}/units/${unit._id}`, { isPubliclyListed: !unit.isPubliclyListed });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update listing status'));
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
          <Input
            label="Image URL (optional)"
            placeholder="https://…"
            {...register('imageUrl')}
            error={errors.imageUrl?.message}
          />
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-secondary">Marketing description (optional)</label>
            <textarea
              {...register('marketingDescription')}
              rows={3}
              className="rounded-md border border-secondary/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Shown on the public listing page"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-secondary sm:col-span-2">
            <input type="checkbox" {...register('isPubliclyListed')} className="h-4 w-4" />
            List this unit publicly on /listings once it&apos;s vacant
          </label>
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
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    unit.status === 'vacant'
                      ? 'bg-secondary/10 text-secondary'
                      : unit.status === 'occupied'
                        ? 'bg-highlight/40 text-secondary'
                        : 'bg-muted text-brown'
                  }`}
                >
                  {unit.status}
                </span>
                {unit.isPubliclyListed ? (
                  <span className="rounded-full bg-highlight/50 px-2 py-1 text-xs font-medium text-secondary">
                    Public listing
                  </span>
                ) : null}
                <Button variant="secondary" onClick={() => togglePublicListing(unit)}>
                  {unit.isPubliclyListed ? 'Unlist' : 'List publicly'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
