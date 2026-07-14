import type { ObjectId } from 'mongodb';
import { getAuditLogsCollection } from '../db/collections';

export async function recordAuditLog(
  actorUserId: ObjectId,
  action: string,
  ownerId: ObjectId | null,
  details: Record<string, unknown> = {},
): Promise<void> {
  await getAuditLogsCollection().insertOne({ ownerId, actorUserId, action, details, createdAt: new Date() });
}
