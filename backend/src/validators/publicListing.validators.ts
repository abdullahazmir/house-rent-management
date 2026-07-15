import { z } from 'zod';

const propertyTypeEnum = z.enum(['single_family', 'multi_family', 'apartment_complex', 'condo', 'commercial']);
const sortEnum = z.enum(['rent_asc', 'rent_desc', 'newest']);

export const listPublicUnitsSchema = z.object({
  query: z.object({
    q: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    minBeds: z.coerce.number().int().min(0).optional(),
    maxRent: z.coerce.number().nonnegative().optional(),
    propertyType: propertyTypeEnum.optional(),
    sort: sortEnum.optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(48).optional(),
  }),
});

export const publicUnitIdParamSchema = z.object({
  params: z.object({ id: z.string() }),
});

export type ListPublicUnitsQuery = z.infer<typeof listPublicUnitsSchema>['query'];
