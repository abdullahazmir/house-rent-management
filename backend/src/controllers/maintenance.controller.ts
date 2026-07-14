import type { Request, Response } from 'express';
import { getMaintenanceRequestsCollection, getTenantsCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError } from '../utils/errors';
import { sendMaintenanceUpdateEmail } from '../services/email.service';
import type { UpdateMaintenanceRequestInput } from '../validators/maintenance.validators';

export async function listMaintenanceRequests(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const filter: Record<string, unknown> = { ownerId };
  if (typeof req.query.status === 'string') filter.status = req.query.status;

  const requests = await getMaintenanceRequestsCollection().find(filter).sort({ createdAt: -1 }).toArray();
  res.status(200).json(requests);
}

export async function updateMaintenanceRequest(
  req: Request<{ id: string }, unknown, UpdateMaintenanceRequestInput>,
  res: Response,
): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Maintenance request not found');

  const updates: Record<string, unknown> = { ...req.body, updatedAt: new Date() };
  if (req.body.status === 'resolved') updates.resolvedAt = new Date();

  const result = await getMaintenanceRequestsCollection().findOneAndUpdate(
    { _id, ownerId },
    { $set: updates },
    { returnDocument: 'after' },
  );

  if (!result) throw new NotFoundError('Maintenance request not found');

  if (req.body.status) {
    const tenant = await getTenantsCollection().findOne({ _id: result.tenantId });
    if (tenant) await sendMaintenanceUpdateEmail(tenant.email, result.title, result.status);
  }

  res.status(200).json(result);
}
