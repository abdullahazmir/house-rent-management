import type { ObjectId } from 'mongodb';

export type TenantStatus = 'invited' | 'active' | 'past' | 'inactive';

export interface TenantDoc {
  _id?: ObjectId;
  ownerId: ObjectId;
  userId: ObjectId | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  currentLeaseId: ObjectId | null;
  status: TenantStatus;
  inviteTokenHash: string | null;
  inviteTokenExpiresAt: Date | null;
  invitedAt: Date | null;
  activatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
