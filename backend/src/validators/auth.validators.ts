import { z } from 'zod';

const ownerRegisterBody = z.object({
  role: z.literal('owner'),
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const renterRegisterBody = z.object({
  role: z.literal('renter'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  body: z.discriminatedUnion('role', [ownerRegisterBody, renterRegisterBody]),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
