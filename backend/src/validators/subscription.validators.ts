import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    planId: z.string().min(1),
  }),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>['body'];
