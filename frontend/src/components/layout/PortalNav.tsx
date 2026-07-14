'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

const NAV_ITEMS = [
  { href: '/portal', label: 'My Lease' },
  { href: '/portal/payments', label: 'Payments' },
  { href: '/portal/maintenance', label: 'Maintenance' },
];

export function PortalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

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
        {NAV_ITEMS.map((item) => {
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
