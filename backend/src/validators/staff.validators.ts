import { z } from 'zod';

export const createStaffSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const staffIdParamSchema = z.object({
  params: z.object({ id: z.string() }),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>['body'];
