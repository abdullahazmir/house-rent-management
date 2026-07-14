import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getUsersCollection, getOwnersCollection, getTenantsCollection } from '../db/collections';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { hashInviteToken } from '../utils/inviteToken';
import { stripe } from '../services/stripe.service';
import type { RegisterInput, LoginInput } from '../validators/auth.validators';
import type { AcceptInviteInput } from '../validators/tenant.validators';
import { env } from '../config/env';

const REFRESH_COOKIE = 'refreshToken';

function setRefreshCookie(res: Response, token: string): void {
  const isProduction = env.NODE_ENV === 'production';
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    // Frontend (Vercel) and backend (Render) live on different domains in production, so the
    // cookie must be SameSite=None (which requires Secure) to be sent on cross-site requests at all.
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN === 'localhost' ? undefined : env.COOKIE_DOMAIN,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

export async function register(req: Request<unknown, unknown, RegisterInput>, res: Response): Promise<void> {
  const { companyName, contactName, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const users = getUsersCollection();
  const owners = getOwnersCollection();

  const existing = await users.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  const userId = new ObjectId();
  const ownerId = new ObjectId();

  await users.insertOne({
    _id: userId,
    email: normalizedEmail,
    passwordHash,
    role: 'owner',
    ownerId,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const trialEndsAt = new Date(now.getTime() + env.DEFAULT_TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const stripeCustomer = await stripe.customers.create({
    email: normalizedEmail,
    name: companyName,
    metadata: { ownerId: ownerId.toHexString() },
  });

  await owners.insertOne({
    _id: ownerId,
    companyName,
    contactName,
    contactEmail: normalizedEmail,
    contactPhone: null,
    userId,
    stripeCustomerId: stripeCustomer.id,
    stripeConnectAccountId: null,
    stripeConnectOnboardingComplete: false,
    stripeConnectChargesEnabled: false,
    stripeConnectPayoutsEnabled: false,
    subscription: {
      planId: null,
      stripeSubscriptionId: null,
      status: 'trialing',
      currentPeriodEnd: null,
      trialEndsAt,
      cancelAtPeriodEnd: false,
    },
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });

  const accessToken = signAccessToken({ sub: userId.toHexString(), role: 'owner', ownerId: ownerId.toHexString() });
  const refreshToken = signRefreshToken({ sub: userId.toHexString() });

  setRefreshCookie(res, refreshToken);
  res.status(201).json({
    accessToken,
    user: { id: userId.toHexString(), email: normalizedEmail, role: 'owner', ownerId: ownerId.toHexString() },
  });
}

export async function login(req: Request<unknown, unknown, LoginInput>, res: Response): Promise<void> {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const users = getUsersCollection();
  const user = await users.findOne({ email: normalizedEmail });

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('This account has been deactivated');
  }

  await users.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  const ownerId = user.ownerId ? user.ownerId.toHexString() : null;
  const accessToken = signAccessToken({ sub: user._id!.toHexString(), role: user.role, ownerId });
  const refreshToken = signRefreshToken({ sub: user._id!.toHexString() });

  setRefreshCookie(res, refreshToken);
  res.status(200).json({
    accessToken,
    user: { id: user._id!.toHexString(), email: user.email, role: user.role, ownerId },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new UnauthorizedError('Missing refresh token');
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const users = getUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(payload.sub) });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Account no longer active');
  }

  const ownerId = user.ownerId ? user.ownerId.toHexString() : null;
  const accessToken = signAccessToken({ sub: user._id!.toHexString(), role: user.role, ownerId });
  const newRefreshToken = signRefreshToken({ sub: user._id!.toHexString() });

  setRefreshCookie(res, newRefreshToken);
  res.status(200).json({ accessToken });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  res.status(204).send();
}

export async function acceptInvite(
  req: Request<unknown, unknown, AcceptInviteInput>,
  res: Response,
): Promise<void> {
  const { token, password } = req.body;
  const tokenHash = hashInviteToken(token);

  const tenants = getTenantsCollection();
  const tenant = await tenants.findOne({ inviteTokenHash: tokenHash });

  if (!tenant || !tenant.inviteTokenExpiresAt || tenant.inviteTokenExpiresAt < new Date()) {
    throw new UnauthorizedError('Invite link is invalid or has expired');
  }

  if (tenant.userId) {
    throw new ConflictError('This invite has already been accepted');
  }

  const users = getUsersCollection();
  const passwordHash = await hashPassword(password);
  const now = new Date();
  const userId = new ObjectId();

  await users.insertOne({
    _id: userId,
    email: tenant.email,
    passwordHash,
    role: 'renter',
    ownerId: tenant.ownerId,
    isActive: true,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await tenants.updateOne(
    { _id: tenant._id },
    {
      $set: { userId, status: 'active', activatedAt: now, updatedAt: now },
      $unset: { inviteTokenHash: '', inviteTokenExpiresAt: '' },
    },
  );

  const ownerId = tenant.ownerId.toHexString();
  const accessToken = signAccessToken({ sub: userId.toHexString(), role: 'renter', ownerId });
  const refreshToken = signRefreshToken({ sub: userId.toHexString() });

  setRefreshCookie(res, refreshToken);
  res.status(201).json({
    accessToken,
    user: { id: userId.toHexString(), email: tenant.email, role: 'renter', ownerId },
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const users = getUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(req.user!.id) });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.status(200).json({
    id: user._id!.toHexString(),
    email: user.email,
    role: user.role,
    ownerId: user.ownerId ? user.ownerId.toHexString() : null,
    isActive: user.isActive,
  });
}
