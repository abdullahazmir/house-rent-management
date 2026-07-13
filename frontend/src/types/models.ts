export type PropertyType = 'single_family' | 'multi_family' | 'apartment_complex' | 'condo' | 'commercial';

export interface Property {
  _id: string;
  ownerId: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  type: PropertyType;
  yearBuilt: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UnitStatus = 'vacant' | 'occupied' | 'maintenance';

export interface Unit {
  _id: string;
  ownerId: string;
  propertyId: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number | null;
  marketRent: number;
  status: UnitStatus;
  createdAt: string;
  updatedAt: string;
}

export type LeaseStatus = 'draft' | 'active' | 'ended' | 'terminated';

export interface Lease {
  _id: string;
  ownerId: string;
  propertyId: string;
  unitId: string;
  tenantIds: string[];
  startDate: string;
  endDate: string;
  rentAmount: number;
  rentDueDayOfMonth: number;
  lateFeeType: 'flat' | 'percent';
  lateFeeAmount: number;
  lateFeeGraceDays: number;
  securityDeposit: number;
  status: LeaseStatus;
  documentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TenantStatus = 'invited' | 'active' | 'past' | 'inactive';

export interface Tenant {
  _id: string;
  ownerId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  currentLeaseId: string | null;
  status: TenantStatus;
  invitedAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  inviteLink?: string;
}

export interface Owner {
  _id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  status: 'active' | 'suspended';
  subscription: {
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  };
  createdAt: string;
}
