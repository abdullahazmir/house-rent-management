'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

export interface NavItem {
  href: string;
  label: string;
}

export function AppNav({ title, navItems }: { title: string; navItems: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="bg-secondary text-white">
      <div className="flex items-center justify-between p-4">
        <span className="font-semibold">{title}</span>

        {/* Desktop: user info + logout inline. Mobile/tablet: hamburger toggle. */}
        <div className="hidden items-center gap-4 text-sm text-white/80 lg:flex">
          {user ? <span>{user.email}</span> : null}
          <button onClick={handleLogout} className="underline hover:text-highlight">
            Log out
          </button>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/30 text-white lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Desktop horizontal tabs */}
      <nav className="hidden flex-wrap gap-1 px-4 lg:flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-t-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-white text-secondary' : 'text-white/75 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile/tablet dropdown menu */}
      {menuOpen ? (
        <nav className="flex flex-col gap-1 border-t border-white/20 p-4 lg:hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-white text-secondary' : 'text-white/75 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-3 text-sm text-white/80">
            {user ? <span>{user.email}</span> : <span />}
            <button onClick={handleLogout} className="underline hover:text-highlight">
              Log out
            </button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
