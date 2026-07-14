import type { ReactNode } from 'react';
import { RoleGuard } from '../../components/auth/RoleGuard';
import { PortalNav } from '../../components/layout/PortalNav';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <RoleGuard allowedRoles={['renter']}>
        <div className="flex flex-1 flex-col">
          <PortalNav />
          {children}
        </div>
      </RoleGuard>
    </div>
  );
}
