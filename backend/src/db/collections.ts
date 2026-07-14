import type { Collection } from 'mongodb';
import { getDb } from './connection';
import type { UserDoc } from '../models/User';
import type { OwnerDoc } from '../models/Owner';
import type { PropertyDoc } from '../models/Property';
import type { UnitDoc } from '../models/Unit';
import type { LeaseDoc } from '../models/Lease';
import type { TenantDoc } from '../models/Tenant';
import type { PlanDoc } from '../models/Plan';
import type { WebhookEventDoc } from '../models/WebhookEvent';
import type { PaymentDoc } from '../models/Payment';
import type { MaintenanceRequestDoc } from '../models/MaintenanceRequest';
import type { AuditLogDoc } from '../models/AuditLog';

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

export function getPlansCollection(): Collection<PlanDoc> {
  return getDb().collection<PlanDoc>('plans');
}

export function getWebhookEventsCollection(): Collection<WebhookEventDoc> {
  return getDb().collection<WebhookEventDoc>('webhookEvents');
}

export function getPaymentsCollection(): Collection<PaymentDoc> {
  return getDb().collection<PaymentDoc>('payments');
}

export function getMaintenanceRequestsCollection(): Collection<MaintenanceRequestDoc> {
  return getDb().collection<MaintenanceRequestDoc>('maintenanceRequests');
}

export function getAuditLogsCollection(): Collection<AuditLogDoc> {
  return getDb().collection<AuditLogDoc>('auditLogs');
}
