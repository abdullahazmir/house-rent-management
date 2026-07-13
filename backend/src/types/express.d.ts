import type { UserRole } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        ownerId: string | null;
      };
      ownerId?: string;
    }
  }
}

export {};
