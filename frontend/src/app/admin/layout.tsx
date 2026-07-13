import type { ReactNode } from 'react';
import { RoleGuard } from '../../components/auth/RoleGuard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <RoleGuard allowedRoles={['super_admin']}>
        <div className="flex flex-1 flex-col">
          <header className="border-b border-gray-200 p-4">
            <span className="font-semibold">House Rent Management — Admin</span>
          </header>
          {children}
        </div>
      </RoleGuard>
    </div>
  );
}
