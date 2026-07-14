import type { ReactNode } from 'react';
import { RoleGuard } from '../../components/auth/RoleGuard';
import { DashboardNav } from '../../components/layout/DashboardNav';
import { SubscriptionBanner } from '../../components/layout/SubscriptionBanner';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <RoleGuard allowedRoles={['owner', 'staff']}>
        <div className="flex flex-1 flex-col">
          <DashboardNav />
          <SubscriptionBanner />
          {children}
        </div>
      </RoleGuard>
    </div>
  );
}
