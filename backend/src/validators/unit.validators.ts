import { z } from 'zod';

const unitStatusEnum = z.enum(['vacant', 'occupied', 'maintenance']);

export const createUnitSchema = z.object({
  params: z.object({ propertyId: z.string() }),
  body: z.object({
    unitNumber: z.string().min(1),
    bedrooms: z.coerce.number().int().min(0),
    bathrooms: z.coerce.number().min(0),
    squareFeet: z.coerce.number().int().positive().optional(),
    marketRent: z.coerce.number().nonnegative(),
    status: unitStatusEnum.default('vacant'),
    imageUrl: z.string().url().optional(),
    marketingDescription: z.string().max(2000).optional(),
    isPubliclyListed: z.coerce.boolean().default(false),
  }),
});

export const updateUnitSchema = z.object({
  params: z.object({ propertyId: z.string(), id: z.string() }),
  body: createUnitSchema.shape.body.partial(),
});

export const unitIdParamSchema = z.object({
  params: z.object({ propertyId: z.string(), id: z.string() }),
});

export const listUnitsParamSchema = z.object({
  params: z.object({ propertyId: z.string() }),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>['body'];
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>['body'];
