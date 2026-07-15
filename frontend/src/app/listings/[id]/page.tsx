'use client';

import { useCallback, useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth, getApiErrorMessage } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/Button';
import { ListingCard } from '../../../components/ui/ListingCard';
import type { AuthUser } from '../../../types/auth';
import type { PublicUnitListing, PublicUnitListPage } from '../../../types/listing';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"%3E%3Crect width="800" height="400" fill="%23DDAD9C"/%3E%3Cpath d="M400 160l140 120v100h-80v-90h-120v90h-80v-100z" fill="%23304C53" opacity="0.4"/%3E%3C/svg%3E';

interface RentResponse {
  accessToken: string;
  user: AuthUser;
  leaseId: string;
  firstPaymentId: string | null;
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, applySession } = useAuth();

  const [listing, setListing] = useState<PublicUnitListing | null | undefined>(undefined);
  const [related, setRelated] = useState<PublicUnitListing[]>([]);
  const [renting, setRenting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api.get<PublicUnitListing>(`/public/units/${id}`);
    setListing(res.data);

    const relatedRes = await api.get<PublicUnitListPage>('/public/units', {
      params: { city: res.data.property.city, limit: 4 },
    });
    setRelated(relatedRes.data.items.filter((item) => item._id !== id));
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    void load().catch(() => setListing(null));
  }, [load]);

  const handleRent = async () => {
    setError(null);
    setRenting(true);
    try {
      const res = await api.post<RentResponse>(`/public/units/${id}/rent`);
      applySession(res.data.accessToken, res.data.user);
      router.push('/portal/payments');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not complete the rental'));
      setRenting(false);
    }
  };

  if (listing === undefined) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-gray-500">
          This listing is no longer available.{' '}
          <Link href="/listings" className="underline">
            Browse other houses
          </Link>
          .
        </p>
      </main>
    );
  }

  const image = listing.imageUrl ?? listing.property.imageUrl ?? PLACEHOLDER_IMAGE;

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="relative h-64 w-full overflow-hidden rounded-md bg-muted sm:h-80">
          <Image src={image} alt={listing.property.name} fill unoptimized className="object-cover" />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-secondary">
              {listing.property.name} — Unit {listing.unitNumber}
            </h1>
            <p className="text-gray-500">
              {listing.property.addressLine1}, {listing.property.city}, {listing.property.state}{' '}
              {listing.property.zip}
            </p>
          </div>
          <p className="text-2xl font-semibold text-secondary">${listing.marketRent}/mo</p>
        </div>

        <section className="mt-8">
          <h2 className="mb-2 text-lg font-medium text-secondary">Overview</h2>
          <p className="text-sm text-gray-700">
            {listing.marketingDescription ?? 'No additional description provided for this listing.'}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="mb-2 text-lg font-medium text-secondary">Key information</h2>
          <dl className="grid grid-cols-2 gap-4 rounded-md border border-muted p-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-gray-500">Bedrooms</dt>
              <dd className="font-medium">{listing.bedrooms}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Bathrooms</dt>
              <dd className="font-medium">{listing.bathrooms}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Square feet</dt>
              <dd className="font-medium">{listing.squareFeet ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Property type</dt>
              <dd className="font-medium capitalize">{listing.property.type.replace('_', ' ')}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-8 rounded-md border border-muted p-6">
          {error ? <p className="mb-3 text-sm text-brown">{error}</p> : null}
          {!user ? (
            <Link href={`/register?role=renter&unitId=${id}`}>
              <Button>Rent this house</Button>
            </Link>
          ) : user.role === 'renter' ? (
            <Button onClick={handleRent} disabled={renting}>
              {renting ? 'Processing…' : 'Rent this house'}
            </Button>
          ) : (
            <p className="text-sm text-gray-500">Renting is available to renter accounts only.</p>
          )}
        </section>

        {related.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-medium text-secondary">More in {listing.property.city}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ListingCard key={item._id} listing={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
