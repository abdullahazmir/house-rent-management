import type { PropertyType } from './models';

export interface PublicUnitListing {
  _id: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number | null;
  marketRent: number;
  imageUrl: string | null;
  marketingDescription: string | null;
  createdAt: string;
  property: {
    _id: string;
    name: string;
    addressLine1: string;
    city: string;
    state: string;
    zip: string;
    type: PropertyType;
    imageUrl: string | null;
  };
}

export interface PublicUnitListPage {
  items: PublicUnitListing[];
  total: number;
  page: number;
  pageSize: number;
}

export type ListingSort = 'rent_asc' | 'rent_desc' | 'newest';

export interface ListingFilters {
  q?: string;
  city?: string;
  minBeds?: number;
  maxRent?: number;
  propertyType?: PropertyType;
  sort?: ListingSort;
  page?: number;
}
