import type { Request, Response } from 'express';
import { getPropertiesCollection, getUnitsCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError, ConflictError } from '../utils/errors';
import type { CreatePropertyInput, UpdatePropertyInput } from '../validators/property.validators';

export async function listProperties(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const properties = await getPropertiesCollection().find({ ownerId }).sort({ createdAt: -1 }).toArray();
  res.status(200).json(properties);
}

export async function createProperty(
  req: Request<unknown, unknown, CreatePropertyInput>,
  res: Response,
): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const now = new Date();

  const doc = {
    ownerId,
    name: req.body.name,
    addressLine1: req.body.addressLine1,
    addressLine2: req.body.addressLine2 ?? null,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip,
    country: req.body.country,
    type: req.body.type,
    yearBuilt: req.body.yearBuilt ?? null,
    notes: req.body.notes ?? null,
    imageUrl: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getPropertiesCollection().insertOne(doc);
  res.status(201).json({ _id: result.insertedId, ...doc });
}

export async function getProperty(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Property not found');

  const property = await getPropertiesCollection().findOne({ _id, ownerId });
  if (!property) throw new NotFoundError('Property not found');

  res.status(200).json(property);
}

export async function updateProperty(
  req: Request<{ id: string }, unknown, UpdatePropertyInput>,
  res: Response,
): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Property not found');

  const result = await getPropertiesCollection().findOneAndUpdate(
    { _id, ownerId },
    { $set: { ...req.body, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );

  if (!result) throw new NotFoundError('Property not found');
  res.status(200).json(result);
}

export async function deleteProperty(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Property not found');

  const unitCount = await getUnitsCollection().countDocuments({ ownerId, propertyId: _id });
  if (unitCount > 0) {
    throw new ConflictError('Cannot delete a property that still has units — remove its units first');
  }

  const result = await getPropertiesCollection().deleteOne({ _id, ownerId });
  if (result.deletedCount === 0) throw new NotFoundError('Property not found');

  res.status(204).send();
}
