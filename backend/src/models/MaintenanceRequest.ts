import type { ObjectId } from 'mongodb';

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

export interface MaintenanceRequestDoc {
  _id?: ObjectId;
  ownerId: ObjectId;
  propertyId: ObjectId;
  unitId: ObjectId;
  leaseId: ObjectId | null;
  tenantId: ObjectId;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  resolutionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}
