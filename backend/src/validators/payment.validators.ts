import { z } from 'zod';

export const recordManualPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().min(1),
    amountPaid: z.coerce.number().positive(),
    method: z.enum(['manual_cash', 'manual_check', 'manual_other']),
    notes: z.string().optional(),
  }),
});

export const paymentIdParamSchema = z.object({
  params: z.object({ id: z.string() }),
});

export type RecordManualPaymentInput = z.infer<typeof recordManualPaymentSchema>['body'];
