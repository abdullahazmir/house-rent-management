import { z } from 'zod';

export const createLeaseSchema = z.object({
  body: z.object({
    propertyId: z.string(),
    unitId: z.string(),
    tenantIds: z.array(z.string()).min(1, 'At least one tenant is required'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    rentAmount: z.coerce.number().positive(),
    rentDueDayOfMonth: z.coerce.number().int().min(1).max(28),
    lateFeeType: z.enum(['flat', 'percent']).default('flat'),
    lateFeeAmount: z.coerce.number().nonnegative().default(0),
    lateFeeGraceDays: z.coerce.number().int().nonnegative().default(5),
    securityDeposit: z.coerce.number().nonnegative().default(0),
  }),
});

export const updateLeaseSchema = z.object({
  params: z.object({ id: z.string() }),
  body: createLeaseSchema.shape.body.partial().omit({ propertyId: true, unitId: true }),
});

export const leaseIdParamSchema = z.object({
  params: z.object({ id: z.string() }),
});

export type CreateLeaseInput = z.infer<typeof createLeaseSchema>['body'];
export type UpdateLeaseInput = z.infer<typeof updateLeaseSchema>['body'];
