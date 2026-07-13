import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../models/User';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`This action requires one of the following roles: ${roles.join(', ')}`));
      return;
    }

    next();
  };
}
