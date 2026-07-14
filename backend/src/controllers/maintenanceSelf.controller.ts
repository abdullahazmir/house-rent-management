import type { Request, Response } from 'express';
import { getMaintenanceRequestsCollection, getTenantsCollection, getLeasesCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError, ValidationError } from '../utils/errors';
import type { CreateMaintenanceRequestInput } from '../validators/maintenance.validators';

async function findTenantForUser(req: Pick<Request, 'ownerId' | 'user'>) {
  const ownerId = parseObjectId(req.ownerId!);
  const userId = parseObjectId(req.user!.id);
  const tenant = await getTenantsCollection().findOne({ ownerId, userId });
  if (!tenant) throw new NotFoundError('Tenant profile not found');
  return tenant;
}

export async function listMyMaintenanceRequests(req: Request, res: Response): Promise<void> {
  const tenant = await findTenantForUser(req);
  const requests = await getMaintenanceRequestsCollection()
    .find({ tenantId: tenant._id })
    .sort({ createdAt: -1 })
    .toArray();
  res.status(200).json(requests);
}

export async function createMyMaintenanceRequest(
  req: Request<unknown, unknown, CreateMaintenanceRequestInput>,
  res: Response,
): Promise<void> {
  const tenant = await findTenantForUser(req);
  if (!tenant.currentLeaseId) {
    throw new ValidationError('You need an active lease before submitting a maintenance request');
  }

  const lease = await getLeasesCollection().findOne({ _id: tenant.currentLeaseId });
  if (!lease) throw new NotFoundError('Lease not found');

  const now = new Date();
  const doc = {
    ownerId: tenant.ownerId,
    propertyId: lease.propertyId,
    unitId: lease.unitId,
    leaseId: lease._id!,
    tenantId: tenant._id!,
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    status: 'open' as const,
    resolutionNotes: null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  };

  const result = await getMaintenanceRequestsCollection().insertOne(doc);
  res.status(201).json({ _id: result.insertedId, ...doc });
}
