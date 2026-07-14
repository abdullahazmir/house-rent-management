'use client';

import { useAuth } from '../../lib/auth-context';
import { AppNav, type NavItem } from './AppNav';

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/properties', label: 'Properties' },
  { href: '/dashboard/leases', label: 'Leases' },
  { href: '/dashboard/tenants', label: 'Tenants' },
  { href: '/dashboard/payments', label: 'Payments' },
  { href: '/dashboard/maintenance', label: 'Maintenance' },
];

// Billing/payout setup touches money and banking details — owner only, staff can't act on these anyway (backend enforces it too).
const OWNER_ONLY_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard/staff', label: 'Staff' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/settings/payments', label: 'Settings' },
];

export function DashboardNav() {
  const { user } = useAuth();
  const navItems = user?.role === 'owner' ? [...NAV_ITEMS, ...OWNER_ONLY_NAV_ITEMS] : NAV_ITEMS;

  return <AppNav title="House Rent Management" navItems={navItems} />;
}
