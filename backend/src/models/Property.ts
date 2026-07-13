import type { ObjectId } from 'mongodb';

export type PropertyType = 'single_family' | 'multi_family' | 'apartment_complex' | 'condo' | 'commercial';

export interface PropertyDoc {
  _id?: ObjectId;
  ownerId: ObjectId;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  type: PropertyType;
  yearBuilt: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
