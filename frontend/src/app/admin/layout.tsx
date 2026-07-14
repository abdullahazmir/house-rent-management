import type { ReactNode } from 'react';
import { RoleGuard } from '../../components/auth/RoleGuard';
import { AdminNav } from '../../components/layout/AdminNav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <RoleGuard allowedRoles={['super_admin']}>
        <div className="flex flex-1 flex-col">
          <AdminNav />
          {children}
        </div>
      </RoleGuard>
    </div>
  );
}
