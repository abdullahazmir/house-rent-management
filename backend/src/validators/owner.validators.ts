import { z } from 'zod';

export const ownerIdParamSchema = z.object({
  params: z.object({ id: z.string() }),
});
