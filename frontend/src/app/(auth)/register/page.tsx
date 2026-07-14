'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, getApiErrorMessage } from '../../../lib/auth-context';
import { ROLE_HOME } from '../../../types/auth';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const registerFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Your name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const { register: registerOwner } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const user = await registerOwner(values);
      router.push(ROLE_HOME[user.role]);
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Could not create your account'));
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-xl font-semibold text-secondary">Create your account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Company name" {...register('companyName')} error={errors.companyName?.message} />
          <Input label="Your name" {...register('contactName')} error={errors.contactName?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
          {serverError ? <p className="text-sm text-brown">{serverError}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
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
