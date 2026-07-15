import type { ObjectId } from 'mongodb';

export type UserRole = 'super_admin' | 'owner' | 'staff' | 'renter';

export interface UserDoc {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  role: UserRole;
  /** Self-referencing Owner._id for role='owner'; the employing/managing Owner._id for staff/renter; null for super_admin and for a self-registered renter until they rent a unit. */
  ownerId: ObjectId | null;
  /** Set for self-registered renters (captured at registration, used to populate their Tenant doc at rent time). Null for owner/staff/admin, whose name lives on Owner.contactName. */
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
