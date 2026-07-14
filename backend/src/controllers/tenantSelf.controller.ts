import type { Request, Response } from 'express';
import { getTenantsCollection, getLeasesCollection, getPropertiesCollection, getUnitsCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError } from '../utils/errors';

async function findTenantForUser(req: Pick<Request, 'ownerId' | 'user'>) {
  const ownerId = parseObjectId(req.ownerId!);
  const userId = parseObjectId(req.user!.id);
  const tenant = await getTenantsCollection().findOne({ ownerId, userId });
  if (!tenant) throw new NotFoundError('Tenant profile not found');
  return tenant;
}

export async function getMyProfile(req: Request, res: Response): Promise<void> {
  const tenant = await findTenantForUser(req);
  res.status(200).json(tenant);
}

export async function getMyLease(req: Request, res: Response): Promise<void> {
  const tenant = await findTenantForUser(req);
  if (!tenant.currentLeaseId) {
    res.status(200).json(null);
    return;
  }

  const lease = await getLeasesCollection().findOne({ _id: tenant.currentLeaseId });
  if (!lease) {
    res.status(200).json(null);
    return;
  }

  const [property, unit] = await Promise.all([
    getPropertiesCollection().findOne({ _id: lease.propertyId }),
    getUnitsCollection().findOne({ _id: lease.unitId }),
  ]);

  res.status(200).json({ ...lease, property, unit });
}
