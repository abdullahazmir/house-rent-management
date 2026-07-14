'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../lib/api';
import { getApiErrorMessage } from '../../../lib/auth-context';
import type { Property, PropertyType } from '../../../types/models';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const PROPERTY_TYPES: PropertyType[] = ['single_family', 'multi_family', 'apartment_complex', 'condo', 'commercial'];

const propertyFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  addressLine1: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP is required'),
  type: z.enum(PROPERTY_TYPES as [PropertyType, ...PropertyType[]]),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
  });

  const loadProperties = async () => {
    const res = await api.get<Property[]>('/properties');
    setProperties(res.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount, reused after mutations below
    void loadProperties();
  }, []);

  const onSubmit = async (values: PropertyFormValues) => {
    setError(null);
    try {
      await api.post('/properties', { ...values, country: 'US' });
      reset();
      setShowForm(false);
      await loadProperties();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create property'));
    }
  };

  return (
    <main className="flex-1 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Properties</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Add property'}</Button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 grid max-w-2xl grid-cols-2 gap-4 rounded-md border border-gray-200 p-4"
        >
          <Input label="Property name" {...register('name')} error={errors.name?.message} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Type</label>
            <select {...register('type')} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <Input label="Address" {...register('addressLine1')} error={errors.addressLine1?.message} />
          <Input label="City" {...register('city')} error={errors.city?.message} />
          <Input label="State" {...register('state')} error={errors.state?.message} />
          <Input label="ZIP" {...register('zip')} error={errors.zip?.message} />
          {error ? <p className="col-span-2 text-sm text-red-600">{error}</p> : null}
          <div className="col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save property'}
            </Button>
          </div>
        </form>
      ) : null}

      {properties === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : properties.length === 0 ? (
        <p className="text-sm text-gray-500">No properties yet. Add your first one above.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
          {properties.map((property) => (
            <li key={property._id} className="p-4 hover:bg-gray-50">
              <Link href={`/dashboard/properties/${property._id}`} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{property.name}</p>
                  <p className="text-sm text-gray-500">
                    {property.addressLine1}, {property.city}, {property.state} {property.zip}
                  </p>
                </div>
                <span className="text-sm text-gray-400">{property.type.replace('_', ' ')}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
