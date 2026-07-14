'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/properties', label: 'Properties' },
  { href: '/dashboard/leases', label: 'Leases' },
  { href: '/dashboard/tenants', label: 'Tenants' },
  { href: '/dashboard/payments', label: 'Payments' },
  { href: '/dashboard/maintenance', label: 'Maintenance' },
];

// Billing/payout setup touches money and banking details — owner only, staff can't act on these anyway (backend enforces it too).
const OWNER_ONLY_NAV_ITEMS = [
  { href: '/dashboard/staff', label: 'Staff' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/settings/payments', label: 'Settings' },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const navItems = user?.role === 'owner' ? [...NAV_ITEMS, ...OWNER_ONLY_NAV_ITEMS] : NAV_ITEMS;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="border-b border-gray-200">
      <div className="flex items-center justify-between p-4">
        <span className="font-semibold">House Rent Management</span>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {user ? <span>{user.email}</span> : null}
          <button onClick={handleLogout} className="underline">
            Log out
          </button>
        </div>
      </div>
      <nav className="flex gap-1 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-t-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
