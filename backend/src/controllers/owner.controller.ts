import type { Request, Response } from 'express';
import { getOwnersCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError } from '../utils/errors';
import { recordAuditLog } from '../utils/auditLog';

export async function listOwners(_req: Request, res: Response): Promise<void> {
  const owners = await getOwnersCollection().find({}).sort({ createdAt: -1 }).toArray();
  res.status(200).json(owners);
}

export async function getOwner(req: Request, res: Response): Promise<void> {
  const _id = parseObjectId(req.params.id, 'Owner not found');
  const owner = await getOwnersCollection().findOne({ _id });
  if (!owner) throw new NotFoundError('Owner not found');
  res.status(200).json(owner);
}

export async function suspendOwner(req: Request, res: Response): Promise<void> {
  const _id = parseObjectId(req.params.id, 'Owner not found');
  const owner = await getOwnersCollection().findOneAndUpdate(
    { _id },
    { $set: { status: 'suspended', updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!owner) throw new NotFoundError('Owner not found');
  await recordAuditLog(parseObjectId(req.user!.id), 'owner.suspend', _id, {});
  res.status(200).json(owner);
}

export async function activateOwner(req: Request, res: Response): Promise<void> {
  const _id = parseObjectId(req.params.id, 'Owner not found');
  const owner = await getOwnersCollection().findOneAndUpdate(
    { _id },
    { $set: { status: 'active', updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!owner) throw new NotFoundError('Owner not found');
  await recordAuditLog(parseObjectId(req.user!.id), 'owner.activate', _id, {});
  res.status(200).json(owner);
}
