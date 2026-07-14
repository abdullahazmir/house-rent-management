'use client';

import { AppNav, type NavItem } from './AppNav';

const NAV_ITEMS: NavItem[] = [
  { href: '/portal', label: 'My Lease' },
  { href: '/portal/payments', label: 'Payments' },
  { href: '/portal/maintenance', label: 'Maintenance' },
];

export function PortalNav() {
  return <AppNav title="House Rent Management" navItems={NAV_ITEMS} />;
}
