'use client';

import { AppNav, type NavItem } from './AppNav';

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/owners', label: 'Owners' },
];

export function AdminNav() {
  return <AppNav title="House Rent Management — Admin" navItems={NAV_ITEMS} />;
}
