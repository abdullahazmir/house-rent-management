import type { Request, Response } from 'express';
import { getUnitsCollection, getPropertiesCollection, getLeasesCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError, ConflictError } from '../utils/errors';
import type { CreateUnitInput, UpdateUnitInput } from '../validators/unit.validators';

async function assertPropertyExists(ownerId: ReturnType<typeof parseObjectId>, propertyId: ReturnType<typeof parseObjectId>) {
  const property = await getPropertiesCollection().findOne({ _id: propertyId, ownerId });
  if (!property) throw new NotFoundError('Property not found');
}

export async function listUnits(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const propertyId = parseObjectId(req.params.propertyId, 'Property not found');
  await assertPropertyExists(ownerId, propertyId);

  const units = await getUnitsCollection().find({ ownerId, propertyId }).sort({ unitNumber: 1 }).toArray();
  res.status(200).json(units);
}

export async function createUnit(req: Request<{ propertyId: string }, unknown, CreateUnitInput>, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const propertyId = parseObjectId(req.params.propertyId, 'Property not found');
  await assertPropertyExists(ownerId, propertyId);

  const now = new Date();
  const doc = {
    ownerId,
    propertyId,
    unitNumber: req.body.unitNumber,
    bedrooms: req.body.bedrooms,
    bathrooms: req.body.bathrooms,
    squareFeet: req.body.squareFeet ?? null,
    marketRent: req.body.marketRent,
    status: req.body.status,
    imageUrl: req.body.imageUrl ?? null,
    marketingDescription: req.body.marketingDescription ?? null,
    isPubliclyListed: req.body.isPubliclyListed ?? false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getUnitsCollection().insertOne(doc);
  res.status(201).json({ _id: result.insertedId, ...doc });
}

export async function getUnit(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const propertyId = parseObjectId(req.params.propertyId, 'Property not found');
  const _id = parseObjectId(req.params.id, 'Unit not found');

  const unit = await getUnitsCollection().findOne({ _id, ownerId, propertyId });
  if (!unit) throw new NotFoundError('Unit not found');

  res.status(200).json(unit);
}

export async function updateUnit(
  req: Request<{ propertyId: string; id: string }, unknown, UpdateUnitInput>,
  res: Response,
): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const propertyId = parseObjectId(req.params.propertyId, 'Property not found');
  const _id = parseObjectId(req.params.id, 'Unit not found');

  const result = await getUnitsCollection().findOneAndUpdate(
    { _id, ownerId, propertyId },
    { $set: { ...req.body, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );

  if (!result) throw new NotFoundError('Unit not found');
  res.status(200).json(result);
}

export async function deleteUnit(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const propertyId = parseObjectId(req.params.propertyId, 'Property not found');
  const _id = parseObjectId(req.params.id, 'Unit not found');

  const leaseCount = await getLeasesCollection().countDocuments({
    ownerId,
    unitId: _id,
    status: { $in: ['draft', 'active'] },
  });
  if (leaseCount > 0) {
    throw new ConflictError('Cannot delete a unit with an active or draft lease');
  }

  const result = await getUnitsCollection().deleteOne({ _id, ownerId, propertyId });
  if (result.deletedCount === 0) throw new NotFoundError('Unit not found');

  res.status(204).send();
}
