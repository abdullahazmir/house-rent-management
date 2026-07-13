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

const loginFormSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const user = await login(values.email, values.password);
      router.push(ROLE_HOME[user.role]);
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Invalid email or password'));
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-xl font-semibold">Log in</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
          {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-1 text-sm text-gray-600">
          <Link href="/forgot-password" className="underline">
            Forgot password?
          </Link>
          <span>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-gray-900 underline">
              Register your company
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}
