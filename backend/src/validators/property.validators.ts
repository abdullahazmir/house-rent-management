import { z } from 'zod';

const propertyTypeEnum = z.enum(['single_family', 'multi_family', 'apartment_complex', 'condo', 'commercial']);

export const createPropertySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1).default('US'),
    type: propertyTypeEnum,
    yearBuilt: z.coerce.number().int().positive().optional(),
    notes: z.string().optional(),
  }),
});

export const updatePropertySchema = z.object({
  params: z.object({ id: z.string() }),
  body: createPropertySchema.shape.body.partial(),
});

export const propertyIdParamSchema = z.object({
  params: z.object({ id: z.string() }),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>['body'];
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>['body'];
