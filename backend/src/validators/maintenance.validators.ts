import { z } from 'zod';

export const createMaintenanceRequestSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  }),
});

export const updateMaintenanceRequestSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'cancelled']).optional(),
    resolutionNotes: z.string().optional(),
  }),
});

export const maintenanceIdParamSchema = z.object({
  params: z.object({ id: z.string() }),
});

export type CreateMaintenanceRequestInput = z.infer<typeof createMaintenanceRequestSchema>['body'];
export type UpdateMaintenanceRequestInput = z.infer<typeof updateMaintenanceRequestSchema>['body'];
