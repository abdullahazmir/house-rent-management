import { z } from 'zod';

export const inviteTenantSchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
});

export const updateTenantSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    status: z.enum(['invited', 'active', 'past', 'inactive']).optional(),
  }),
});

export const tenantIdParamSchema = z.object({
  params: z.object({ id: z.string() }),
});

export const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8),
  }),
});

export type InviteTenantInput = z.infer<typeof inviteTenantSchema>['body'];
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>['body'];
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>['body'];
