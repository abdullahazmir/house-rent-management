import type { NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';
import { AppError } from '../utils/errors';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }

  if (err instanceof Stripe.errors.StripeError) {
    // Stripe's messages are safe to surface (no secrets) and are usually actionable
    // (e.g. "you haven't signed up for Connect yet") — pass them straight through.
    const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 500 ? err.statusCode : 502;
    res.status(statusCode).json({ error: { code: 'STRIPE_ERROR', message: err.message } });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}
