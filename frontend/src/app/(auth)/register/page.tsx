'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, getApiErrorMessage } from '../../../lib/auth-context';
import { ROLE_HOME } from '../../../types/auth';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const ownerFormSchema = z.object({
  role: z.literal('owner'),
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Your name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const renterFormSchema = z.object({
  role: z.literal('renter'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type OwnerFormValues = z.infer<typeof ownerFormSchema>;
type RenterFormValues = z.infer<typeof renterFormSchema>;

function OwnerRegisterForm({ onServerError }: { onServerError: (message: string) => void }) {
  const { register: doRegister } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OwnerFormValues>({ resolver: zodResolver(ownerFormSchema), defaultValues: { role: 'owner' } });

  const onSubmit = async (values: OwnerFormValues) => {
    onServerError('');
    try {
      const user = await doRegister(values);
      router.push(searchParams.get('unitId') ? `/listings/${searchParams.get('unitId')}` : ROLE_HOME[user.role]);
    } catch (err) {
      onServerError(getApiErrorMessage(err, 'Could not create your account'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Company name" {...register('companyName')} error={errors.companyName?.message} />
      <Input label="Your name" {...register('contactName')} error={errors.contactName?.message} />
      <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
      <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}

function RenterRegisterForm({ onServerError }: { onServerError: (message: string) => void }) {
  const { register: doRegister } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RenterFormValues>({ resolver: zodResolver(renterFormSchema), defaultValues: { role: 'renter' } });

  const onSubmit = async (values: RenterFormValues) => {
    onServerError('');
    try {
      const user = await doRegister(values);
      const unitId = searchParams.get('unitId');
      router.push(unitId ? `/listings/${unitId}` : ROLE_HOME[user.role]);
    } catch (err) {
      onServerError(getApiErrorMessage(err, 'Could not create your account'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="First name" {...register('firstName')} error={errors.firstName?.message} />
      <Input label="Last name" {...register('lastName')} error={errors.lastName?.message} />
      <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
      <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
          <p className="text-sm text-secondary/60">Loading…</p>
        </main>
      }
    >
      <RegisterPageInner />
    </Suspense>
  );
}

function RegisterPageInner() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'owner' | 'renter'>(searchParams.get('role') === 'renter' ? 'renter' : 'owner');
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold text-secondary">Create your account</h1>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-md border border-muted p-1">
          <button
            type="button"
            onClick={() => setRole('owner')}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              role === 'owner' ? 'bg-secondary text-white' : 'text-secondary hover:bg-muted/40'
            }`}
          >
            List properties for rent
          </button>
          <button
            type="button"
            onClick={() => setRole('renter')}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              role === 'renter' ? 'bg-secondary text-white' : 'text-secondary hover:bg-muted/40'
            }`}
          >
            Find a house to rent
          </button>
        </div>

        {role === 'owner' ? (
          <OwnerRegisterForm onServerError={setServerError} />
        ) : (
          <RenterRegisterForm onServerError={setServerError} />
        )}
        {serverError ? <p className="mt-3 text-sm text-brown">{serverError}</p> : null}

        <p className="mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-secondary underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
