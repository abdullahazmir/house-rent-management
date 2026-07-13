import type { Collection } from 'mongodb';
import { getDb } from './connection';
import type { UserDoc } from '../models/User';
import type { OwnerDoc } from '../models/Owner';

export function getUsersCollection(): Collection<UserDoc> {
  return getDb().collection<UserDoc>('users');
}

export function getOwnersCollection(): Collection<OwnerDoc> {
  return getDb().collection<OwnerDoc>('owners');
}
