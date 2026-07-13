import type { Collection } from 'mongodb';
import { getDb } from './connection';
import type { UserDoc } from '../models/User';
import type { OwnerDoc } from '../models/Owner';
import type { PropertyDoc } from '../models/Property';
import type { UnitDoc } from '../models/Unit';
import type { LeaseDoc } from '../models/Lease';
import type { TenantDoc } from '../models/Tenant';

export function getUsersCollection(): Collection<UserDoc> {
  return getDb().collection<UserDoc>('users');
}

export function getOwnersCollection(): Collection<OwnerDoc> {
  return getDb().collection<OwnerDoc>('owners');
}

export function getPropertiesCollection(): Collection<PropertyDoc> {
  return getDb().collection<PropertyDoc>('properties');
}

export function getUnitsCollection(): Collection<UnitDoc> {
  return getDb().collection<UnitDoc>('units');
}

export function getLeasesCollection(): Collection<LeaseDoc> {
  return getDb().collection<LeaseDoc>('leases');
}

export function getTenantsCollection(): Collection<TenantDoc> {
  return getDb().collection<TenantDoc>('tenants');
}
