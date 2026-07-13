import type { ObjectId } from 'mongodb';

export type LateFeeType = 'flat' | 'percent';
export type LeaseStatus = 'draft' | 'active' | 'ended' | 'terminated';

export interface LeaseDoc {
  _id?: ObjectId;
  ownerId: ObjectId;
  propertyId: ObjectId;
  unitId: ObjectId;
  tenantIds: ObjectId[];
  startDate: Date;
  endDate: Date;
  rentAmount: number;
  rentDueDayOfMonth: number;
  lateFeeType: LateFeeType;
  lateFeeAmount: number;
  lateFeeGraceDays: number;
  securityDeposit: number;
  status: LeaseStatus;
  documentUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
