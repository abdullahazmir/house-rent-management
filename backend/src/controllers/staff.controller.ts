import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getUsersCollection } from '../db/collections';
import { hashPassword } from '../utils/password';
import { parseObjectId } from '../utils/objectId';
import { ConflictError, NotFoundError } from '../utils/errors';
import { recordAuditLog } from '../utils/auditLog';
import type { CreateStaffInput } from '../validators/staff.validators';

export async function listStaff(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const staff = await getUsersCollection()
    .find({ ownerId, role: 'staff' }, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  res.status(200).json(staff);
}

export async function createStaff(req: Request<unknown, unknown, CreateStaffInput>, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const email = req.body.email.toLowerCase();

  const users = getUsersCollection();
  const existing = await users.findOne({ email });
  if (existing) throw new ConflictError('An account with this email already exists');

  const passwordHash = await hashPassword(req.body.password);
  const now = new Date();
  const doc = {
    _id: new ObjectId(),
    email,
    passwordHash,
    role: 'staff' as const,
    ownerId,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await users.insertOne(doc);
  await recordAuditLog(parseObjectId(req.user!.id), 'staff.create', ownerId, { staffUserId: doc._id.toHexString(), email });
  const { passwordHash: _omit, ...safe } = doc;
  res.status(201).json(safe);
}

export async function deactivateStaff(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Staff member not found');

  const result = await getUsersCollection().findOneAndUpdate(
    { _id, ownerId, role: 'staff' },
    { $set: { isActive: false, updatedAt: new Date() } },
    { returnDocument: 'after', projection: { passwordHash: 0 } },
  );
  if (!result) throw new NotFoundError('Staff member not found');
  await recordAuditLog(parseObjectId(req.user!.id), 'staff.deactivate', ownerId, { staffUserId: _id.toHexString() });
  res.status(200).json(result);
}

export async function activateStaff(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Staff member not found');

  const result = await getUsersCollection().findOneAndUpdate(
    { _id, ownerId, role: 'staff' },
    { $set: { isActive: true, updatedAt: new Date() } },
    { returnDocument: 'after', projection: { passwordHash: 0 } },
  );
  if (!result) throw new NotFoundError('Staff member not found');
  await recordAuditLog(parseObjectId(req.user!.id), 'staff.activate', ownerId, { staffUserId: _id.toHexString() });
  res.status(200).json(result);
}
