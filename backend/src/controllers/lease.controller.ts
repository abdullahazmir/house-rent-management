import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import {
  getLeasesCollection,
  getPropertiesCollection,
  getUnitsCollection,
  getTenantsCollection,
} from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError, ValidationError } from '../utils/errors';
import type { CreateLeaseInput, UpdateLeaseInput } from '../validators/lease.validators';

export async function listLeases(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const leases = await getLeasesCollection().find({ ownerId }).sort({ createdAt: -1 }).toArray();
  res.status(200).json(leases);
}

export async function createLease(req: Request<unknown, unknown, CreateLeaseInput>, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const propertyId = parseObjectId(req.body.propertyId, 'Property not found');
  const unitId = parseObjectId(req.body.unitId, 'Unit not found');
  const tenantIds = req.body.tenantIds.map((id) => parseObjectId(id, 'Tenant not found'));

  const property = await getPropertiesCollection().findOne({ _id: propertyId, ownerId });
  if (!property) throw new NotFoundError('Property not found');

  const unit = await getUnitsCollection().findOne({ _id: unitId, ownerId, propertyId });
  if (!unit) throw new NotFoundError('Unit not found');

  const tenantCount = await getTenantsCollection().countDocuments({ _id: { $in: tenantIds }, ownerId });
  if (tenantCount !== tenantIds.length) throw new NotFoundError('One or more tenants not found');

  if (req.body.endDate <= req.body.startDate) {
    throw new ValidationError('endDate must be after startDate');
  }

  const now = new Date();
  const doc = {
    ownerId,
    propertyId,
    unitId,
    tenantIds,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    rentAmount: req.body.rentAmount,
    rentDueDayOfMonth: req.body.rentDueDayOfMonth,
    lateFeeType: req.body.lateFeeType,
    lateFeeAmount: req.body.lateFeeAmount,
    lateFeeGraceDays: req.body.lateFeeGraceDays,
    securityDeposit: req.body.securityDeposit,
    status: 'active' as const,
    documentUrl: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getLeasesCollection().insertOne(doc);

  await getUnitsCollection().updateOne({ _id: unitId }, { $set: { status: 'occupied', updatedAt: now } });
  await getTenantsCollection().updateMany(
    { _id: { $in: tenantIds } },
    { $set: { currentLeaseId: result.insertedId, updatedAt: now } },
  );

  res.status(201).json({ _id: result.insertedId, ...doc });
}

export async function getLease(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Lease not found');

  const lease = await getLeasesCollection().findOne({ _id, ownerId });
  if (!lease) throw new NotFoundError('Lease not found');

  res.status(200).json(lease);
}

export async function updateLease(
  req: Request<{ id: string }, unknown, UpdateLeaseInput>,
  res: Response,
): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Lease not found');

  const updates: Record<string, unknown> = { ...req.body, updatedAt: new Date() };
  if (req.body.tenantIds) {
    updates.tenantIds = req.body.tenantIds.map((id: string) => new ObjectId(id));
  }

  const result = await getLeasesCollection().findOneAndUpdate({ _id, ownerId }, { $set: updates }, { returnDocument: 'after' });

  if (!result) throw new NotFoundError('Lease not found');
  res.status(200).json(result);
}

export async function terminateLease(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Lease not found');

  const lease = await getLeasesCollection().findOneAndUpdate(
    { _id, ownerId },
    { $set: { status: 'terminated', updatedAt: new Date() } },
    { returnDocument: 'after' },
  );

  if (!lease) throw new NotFoundError('Lease not found');

  await getUnitsCollection().updateOne({ _id: lease.unitId }, { $set: { status: 'vacant', updatedAt: new Date() } });

  res.status(200).json(lease);
}
