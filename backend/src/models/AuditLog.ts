import type { ObjectId } from 'mongodb';

export interface AuditLogDoc {
  _id?: ObjectId;
  ownerId: ObjectId | null;
  actorUserId: ObjectId;
  action: string;
  details: Record<string, unknown>;
  createdAt: Date;
}
