import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Injects req.ownerId from the authenticated user's JWT claim — never from
 * client input (params/body/query). Every owner-scoped controller must build
 * its Mongo filter from req.ownerId, not from anything the client sent.
 */
export function scopeToOwner(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedError());
    return;
  }

  if (!req.user.ownerId) {
    next(new ForbiddenError('This account is not associated with an owner'));
    return;
  }

  req.ownerId = req.user.ownerId;
  next();
}
