import type { ReactNode } from 'react';
import { RoleGuard } from '../../components/auth/RoleGuard';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <RoleGuard allowedRoles={['renter']}>
        <div className="flex flex-1 flex-col">
          <header className="border-b border-gray-200 p-4">
            <span className="font-semibold">House Rent Management — My Portal</span>
          </header>
          {children}
        </div>
      </RoleGuard>
    </div>
  );
}
