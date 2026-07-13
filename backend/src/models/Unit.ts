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
  createdAt: Date;
  updatedAt: Date;
}
