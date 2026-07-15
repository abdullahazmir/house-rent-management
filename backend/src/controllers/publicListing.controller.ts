import type { Request, Response } from 'express';
import { ObjectId, type Document } from 'mongodb';
import {
  getUnitsCollection,
  getPropertiesCollection,
  getTenantsCollection,
  getLeasesCollection,
  getUsersCollection,
  getPaymentsCollection,
} from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError, ConflictError } from '../utils/errors';
import { generatePaymentsForLease } from '../services/payment.service';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { setRefreshCookie } from './auth.controller';
import type { UnitDoc } from '../models/Unit';
import type { PropertyDoc } from '../models/Property';

// `validate()` only validates req.query — it never writes the coerced result back, and
// query params always arrive as strings over HTTP — so numeric query params are parsed here.
function parseIntQueryParam(value: unknown): number | undefined {
  if (typeof value !== 'string' || value === '') return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseFloatQueryParam(value: unknown): number | undefined {
  if (typeof value !== 'string' || value === '') return undefined;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

// Escapes regex metacharacters so free-text search params can't be used to build an
// unintended/expensive pattern against this public, unauthenticated endpoint.
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type PublicUnit = UnitDoc & { _id: ObjectId; property: PropertyDoc & { _id: ObjectId } };

function formatPublicUnit(unit: PublicUnit) {
  return {
    _id: unit._id.toHexString(),
    unitNumber: unit.unitNumber,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
    squareFeet: unit.squareFeet,
    marketRent: unit.marketRent,
    imageUrl: unit.imageUrl ?? unit.property.imageUrl,
    marketingDescription: unit.marketingDescription,
    createdAt: unit.createdAt,
    property: {
      _id: unit.property._id.toHexString(),
      name: unit.property.name,
      addressLine1: unit.property.addressLine1,
      city: unit.property.city,
      state: unit.property.state,
      zip: unit.property.zip,
      type: unit.property.type,
      imageUrl: unit.property.imageUrl,
    },
  };
}

function buildPublicUnitPipeline(req: Request): Document[] {
  const city = typeof req.query.city === 'string' ? req.query.city : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const propertyType = typeof req.query.propertyType === 'string' ? req.query.propertyType : undefined;
  const minBeds = parseIntQueryParam(req.query.minBeds);
  const maxRent = parseFloatQueryParam(req.query.maxRent);

  const unitMatch: Record<string, unknown> = { isPubliclyListed: true, status: 'vacant' };
  if (minBeds !== undefined) unitMatch.bedrooms = { $gte: minBeds };
  if (maxRent !== undefined) unitMatch.marketRent = { $lte: maxRent };

  const pipeline: Document[] = [
    { $match: unitMatch },
    { $lookup: { from: 'properties', localField: 'propertyId', foreignField: '_id', as: 'property' } },
    { $unwind: '$property' },
  ];

  if (city) {
    pipeline.push({ $match: { 'property.city': { $regex: `^${escapeRegex(city)}$`, $options: 'i' } } });
  }
  if (propertyType) {
    pipeline.push({ $match: { 'property.type': propertyType } });
  }
  if (q) {
    const regex = { $regex: escapeRegex(q), $options: 'i' };
    pipeline.push({
      $match: { $or: [{ 'property.name': regex }, { 'property.addressLine1': regex }, { 'property.city': regex }] },
    });
  }

  return pipeline;
}

export async function listPublicUnits(req: Request, res: Response): Promise<void> {
  const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;
  const page = parseIntQueryParam(req.query.page) ?? 1;
  const limit = Math.min(parseIntQueryParam(req.query.limit) ?? 12, 48);

  const sortStage: Record<string, 1 | -1> =
    sort === 'rent_asc' ? { marketRent: 1 } : sort === 'rent_desc' ? { marketRent: -1 } : { createdAt: -1 };

  const pipeline = buildPublicUnitPipeline(req);
  pipeline.push({ $sort: sortStage });
  pipeline.push({
    $facet: {
      items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      totalCount: [{ $count: 'count' }],
    },
  });

  const [result] = await getUnitsCollection().aggregate<{ items: PublicUnit[]; totalCount: { count: number }[] }>(pipeline).toArray();
  const items = result?.items ?? [];
  const total = result?.totalCount[0]?.count ?? 0;

  res.status(200).json({ items: items.map(formatPublicUnit), total, page, pageSize: limit });
}

export async function getPublicUnit(req: Request, res: Response): Promise<void> {
  const _id = parseObjectId(req.params.id, 'Listing not found');

  const [unit] = await getUnitsCollection()
    .aggregate<PublicUnit>([
      { $match: { _id, isPubliclyListed: true, status: 'vacant' } },
      { $lookup: { from: 'properties', localField: 'propertyId', foreignField: '_id', as: 'property' } },
      { $unwind: '$property' },
    ])
    .toArray();

  if (!unit) throw new NotFoundError('Listing not found');

  res.status(200).json(formatPublicUnit(unit));
}

/**
 * Authenticated (renter-only), but intentionally NOT behind scopeToOwner: ownerId is derived
 * from the target Unit document itself, never from the client or the renter's own JWT claim
 * (which is null until this call succeeds). This is the one other deliberate exception to the
 * "every query filtered by ownerId" rule alongside the public GETs above — no other mutation
 * in this app works this way.
 */
export async function rentPublicUnit(req: Request, res: Response): Promise<void> {
  const unitId = parseObjectId(req.params.id, 'Listing not found');
  const userId = parseObjectId(req.user!.id);

  const users = getUsersCollection();
  const user = await users.findOne({ _id: userId });
  if (!user) throw new NotFoundError('User not found');
  if (user.ownerId) {
    throw new ConflictError('You already have an active lease — only one active rental is supported at a time');
  }

  const unit = await getUnitsCollection().findOne({ _id: unitId, isPubliclyListed: true, status: 'vacant' });
  if (!unit) throw new NotFoundError('This listing is no longer available');

  const property = await getPropertiesCollection().findOne({ _id: unit.propertyId, ownerId: unit.ownerId });
  if (!property) throw new NotFoundError('Listing not found');

  const now = new Date();
  const tenants = getTenantsCollection();
  const leases = getLeasesCollection();

  const tenantDoc = {
    ownerId: unit.ownerId,
    userId,
    firstName: user.firstName ?? 'Renter',
    lastName: user.lastName ?? '',
    email: user.email,
    phone: null,
    currentLeaseId: null,
    status: 'active' as const,
    inviteTokenHash: null,
    inviteTokenExpiresAt: null,
    invitedAt: null,
    activatedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  const tenantResult = await tenants.insertOne(tenantDoc);
  const tenantId = tenantResult.insertedId;

  const startDate = now;
  const endDate = new Date(Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), now.getUTCDate()));

  const leaseDoc = {
    ownerId: unit.ownerId,
    propertyId: unit.propertyId,
    unitId: unit._id!,
    tenantIds: [tenantId],
    startDate,
    endDate,
    rentAmount: unit.marketRent,
    rentDueDayOfMonth: Math.min(startDate.getUTCDate(), 28),
    lateFeeType: 'flat' as const,
    lateFeeAmount: 0,
    lateFeeGraceDays: 5,
    securityDeposit: 0,
    status: 'active' as const,
    documentUrl: null,
    createdAt: now,
    updatedAt: now,
  };
  const leaseResult = await leases.insertOne(leaseDoc);

  await getUnitsCollection().updateOne({ _id: unit._id }, { $set: { status: 'occupied', updatedAt: now } });
  await tenants.updateOne({ _id: tenantId }, { $set: { currentLeaseId: leaseResult.insertedId, updatedAt: now } });
  await generatePaymentsForLease({ _id: leaseResult.insertedId, ...leaseDoc });

  await users.updateOne({ _id: userId }, { $set: { ownerId: unit.ownerId, updatedAt: now } });

  const ownerIdHex = unit.ownerId.toHexString();
  const accessToken = signAccessToken({ sub: userId.toHexString(), role: 'renter', ownerId: ownerIdHex });
  const refreshToken = signRefreshToken({ sub: userId.toHexString() });
  setRefreshCookie(res, refreshToken);

  const firstPayment = await getPaymentsCollection()
    .find({ leaseId: leaseResult.insertedId })
    .sort({ dueDate: 1 })
    .limit(1)
    .next();

  res.status(201).json({
    accessToken,
    user: { id: userId.toHexString(), email: user.email, role: 'renter', ownerId: ownerIdHex },
    leaseId: leaseResult.insertedId.toHexString(),
    firstPaymentId: firstPayment?._id?.toHexString() ?? null,
  });
}
