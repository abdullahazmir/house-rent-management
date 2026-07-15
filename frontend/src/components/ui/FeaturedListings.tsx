'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { ListingCard } from './ListingCard';
import { ListingCardSkeleton } from './Skeleton';
import { Button } from './Button';
import type { PublicUnitListPage } from '../../types/listing';

export default function FeaturedListings() {
  const [data, setData] = useState<PublicUnitListPage | null>(null);

  useEffect(() => {
    void api
      .get<PublicUnitListPage>('/public/units', { params: { limit: 4, sort: 'newest' } })
      .then((res) => setData(res.data))
      .catch(() => setData({ items: [], total: 0, page: 1, pageSize: 4 }));
  }, []);

  if (data !== null && data.items.length === 0) return null;

  return (
    <section className="w-full bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">Available now</span>
            <h2 className="mt-3 text-3xl font-bold text-secondary sm:text-4xl">Homes ready to rent today</h2>
          </div>
          <Link href="/listings">
            <Button variant="secondary">Browse all listings</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data === null
            ? Array.from({ length: 4 }, (_, i) => <ListingCardSkeleton key={i} />)
            : data.items.map((listing) => <ListingCard key={listing._id} listing={listing} />)}
        </div>
      </div>
    </section>
  );
}
