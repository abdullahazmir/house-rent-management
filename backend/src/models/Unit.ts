import type { ObjectId } from 'mongodb';

export type UnitStatus = 'vacant' | 'occupied' | 'maintenance';

export interface UnitDoc {
  _id?: ObjectId;
  ownerId: ObjectId;
  propertyId: ObjectId;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number | null;
  marketRent: number;
  status: UnitStatus;
  imageUrl: string | null;
  marketingDescription: string | null;
  /** Owner opt-in to show this unit on the public `/listings` catalog while vacant. */
  isPubliclyListed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
