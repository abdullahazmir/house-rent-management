'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { ROLE_HOME } from '../../types/auth';

export function SiteNavbar() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-muted bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="House Rent Management" width={32} height={32} className="rounded-md object-cover" />
          <span className="font-semibold text-secondary">House Rent Management</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-secondary sm:flex">
          <Link href="/listings" className="hover:text-primary">
            Browse houses
          </Link>
          {isLoading ? null : user ? (
            <>
              <Link href={ROLE_HOME[user.role]} className="hover:text-primary">
                My dashboard
              </Link>
              <button onClick={handleLogout} className="hover:text-primary">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-primary">
                Log in
              </Link>
              <Link href="/register" className="rounded-md bg-primary px-3 py-1.5 text-white hover:bg-brown">
                Register
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-secondary/30 text-secondary sm:hidden"
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

      {menuOpen ? (
        <nav className="flex flex-col gap-1 border-t border-muted px-4 py-3 text-sm font-medium text-secondary sm:hidden">
          <Link href="/listings" onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-muted/40">
            Browse houses
          </Link>
          {isLoading ? null : user ? (
            <>
              <Link
                href={ROLE_HOME[user.role]}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2 hover:bg-muted/40"
              >
                My dashboard
              </Link>
              <button onClick={handleLogout} className="rounded-md px-2 py-2 text-left hover:bg-muted/40">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-muted/40">
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2 hover:bg-muted/40"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      ) : null}
    </header>
  );
}
