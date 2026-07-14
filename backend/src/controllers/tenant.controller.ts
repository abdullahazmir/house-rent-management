import type { Request, Response } from 'express';
import { getTenantsCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError, ConflictError } from '../utils/errors';
import { generateInviteToken } from '../utils/inviteToken';
import { sendTenantInviteEmail } from '../services/email.service';
import { env } from '../config/env';
import type { InviteTenantInput, UpdateTenantInput } from '../validators/tenant.validators';

export async function listTenants(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const tenants = await getTenantsCollection().find({ ownerId }).sort({ createdAt: -1 }).toArray();
  res.status(200).json(tenants);
}

export async function inviteTenant(req: Request<unknown, unknown, InviteTenantInput>, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const email = req.body.email.toLowerCase();

  const existing = await getTenantsCollection().findOne({ ownerId, email });
  if (existing) throw new ConflictError('A tenant with this email already exists for your account');

  const { token, tokenHash, expiresAt } = generateInviteToken();
  const now = new Date();

  const doc = {
    ownerId,
    userId: null,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email,
    phone: req.body.phone ?? null,
    currentLeaseId: null,
    status: 'invited' as const,
    inviteTokenHash: tokenHash,
    inviteTokenExpiresAt: expiresAt,
    invitedAt: now,
    activatedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getTenantsCollection().insertOne(doc);

  const inviteLink = `${env.CLIENT_APP_URL}/accept-invite?token=${token}`;
  await sendTenantInviteEmail(email, inviteLink);

  res.status(201).json({ _id: result.insertedId, ...doc, inviteLink });
}

export async function getTenant(req: Request, res: Response): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Tenant not found');

  const tenant = await getTenantsCollection().findOne({ _id, ownerId });
  if (!tenant) throw new NotFoundError('Tenant not found');

  res.status(200).json(tenant);
}

export async function updateTenant(
  req: Request<{ id: string }, unknown, UpdateTenantInput>,
  res: Response,
): Promise<void> {
  const ownerId = parseObjectId(req.ownerId!);
  const _id = parseObjectId(req.params.id, 'Tenant not found');

  const result = await getTenantsCollection().findOneAndUpdate(
    { _id, ownerId },
    { $set: { ...req.body, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );

  if (!result) throw new NotFoundError('Tenant not found');
  res.status(200).json(result);
}
