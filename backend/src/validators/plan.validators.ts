import { z } from 'zod';

export const createPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    stripePriceId: z.string().min(1),
    stripeProductId: z.string().min(1),
    price: z.coerce.number().nonnegative(),
    billingInterval: z.enum(['month', 'year']),
    limits: z.object({
      maxProperties: z.coerce.number().int().positive(),
      maxUnits: z.coerce.number().int().positive(),
      maxStaff: z.coerce.number().int().nonnegative(),
    }),
    features: z.array(z.string()).default([]),
    sortOrder: z.coerce.number().int().default(0),
  }),
});

export const updatePlanSchema = z.object({
  params: z.object({ id: z.string() }),
  body: createPlanSchema.shape.body.partial().extend({ isActive: z.boolean().optional() }),
});

export const planIdParamSchema = z.object({
  params: z.object({ id: z.string() }),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>['body'];
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>['body'];
