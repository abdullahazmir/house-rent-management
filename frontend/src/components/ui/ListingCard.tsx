import Image from 'next/image';
import Link from 'next/link';
import type { PublicUnitListing } from '../../types/listing';
import { Button } from './Button';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23DDAD9C"/%3E%3Cpath d="M200 110l70 60v70h-40v-45h-60v45h-40v-70z" fill="%23304C53" opacity="0.4"/%3E%3C/svg%3E';

export function ListingCard({ listing }: { listing: PublicUnitListing }) {
  const image = listing.imageUrl ?? listing.property.imageUrl ?? PLACEHOLDER_IMAGE;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-muted bg-white">
      <div className="relative h-40 w-full bg-muted">
        <Image src={image} alt={listing.property.name} fill unoptimized className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-medium text-secondary">
          {listing.property.name} — Unit {listing.unitNumber}
        </p>
        <p className="text-sm text-gray-500">
          {listing.property.addressLine1}, {listing.property.city}, {listing.property.state}
        </p>
        {listing.marketingDescription ? (
          <p className="line-clamp-2 text-sm text-gray-600">{listing.marketingDescription}</p>
        ) : null}
        <p className="text-sm text-brown">
          {listing.bedrooms} bed / {listing.bathrooms} bath
          {listing.squareFeet ? ` · ${listing.squareFeet} sqft` : ''}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-semibold text-secondary">${listing.marketRent}/mo</span>
          <Link href={`/listings/${listing._id}`}>
            <Button variant="secondary">View details</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
