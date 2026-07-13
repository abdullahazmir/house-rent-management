import type { ObjectId } from 'mongodb';

export type UserRole = 'super_admin' | 'owner' | 'staff' | 'renter';

export interface UserDoc {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  role: UserRole;
  /** Self-referencing Owner._id for role='owner'; the employing/managing Owner._id for staff/renter; null for super_admin. */
  ownerId: ObjectId | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
