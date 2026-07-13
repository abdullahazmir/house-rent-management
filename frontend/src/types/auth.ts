export type Role = 'super_admin' | 'owner' | 'staff' | 'renter';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  ownerId: string | null;
}

export const ROLE_HOME: Record<Role, string> = {
  super_admin: '/admin',
  owner: '/dashboard',
  staff: '/dashboard',
  renter: '/portal',
};
