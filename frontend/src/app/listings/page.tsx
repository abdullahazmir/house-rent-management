'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { ListingCard } from '../../components/ui/ListingCard';
import { ListingCardSkeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { PropertyType } from '../../types/models';
import type { ListingSort, PublicUnitListPage } from '../../types/listing';

const PROPERTY_TYPES: PropertyType[] = ['single_family', 'multi_family', 'apartment_complex', 'condo', 'commercial'];

export default function ListingsPage() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [minBeds, setMinBeds] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [sort, setSort] = useState<ListingSort>('newest');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<PublicUnitListPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const params: Record<string, string | number> = { page, limit: 12, sort };
    if (q) params.q = q;
    if (city) params.city = city;
    if (propertyType) params.propertyType = propertyType;
    if (minBeds) params.minBeds = minBeds;
    if (maxRent) params.maxRent = maxRent;

    void api
      .get<PublicUnitListPage>('/public/units', { params })
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load listings');
      });

    return () => {
      cancelled = true;
    };
  }, [q, city, propertyType, minBeds, maxRent, sort, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-xl font-semibold text-secondary">Browse available houses</h1>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-md border border-muted p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          label="Search"
          placeholder="Name, address, city…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
        <Input
          label="City"
          value={city}
          onChange={(e) => {
            setPage(1);
            setCity(e.target.value);
          }}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-secondary">Property type</label>
          <select
            value={propertyType}
            onChange={(e) => {
              setPage(1);
              setPropertyType(e.target.value as PropertyType | '');
            }}
            className="rounded-md border border-secondary/30 px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Min bedrooms"
          type="number"
          min={0}
          value={minBeds}
          onChange={(e) => {
            setPage(1);
            setMinBeds(e.target.value);
          }}
        />
        <Input
          label="Max rent ($)"
          type="number"
          min={0}
          value={maxRent}
          onChange={(e) => {
            setPage(1);
            setMaxRent(e.target.value);
          }}
        />
      </div>

      <div className="mb-6 flex items-center justify-end gap-2">
        <label className="text-sm text-secondary">Sort by</label>
        <select
          value={sort}
          onChange={(e) => {
            setPage(1);
            setSort(e.target.value as ListingSort);
          }}
          className="rounded-md border border-secondary/30 px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="rent_asc">Rent: low to high</option>
          <option value="rent_desc">Rent: high to low</option>
        </select>
      </div>

      {error ? (
        <p className="text-sm text-brown">{error}</p>
      ) : data === null ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-gray-500">No listings match your search.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.items.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-secondary">
                Page {page} of {totalPages}
              </span>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
