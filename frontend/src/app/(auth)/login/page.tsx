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

// Matches backend/src/scripts/seedDemo.ts — run `npm run seed:demo` in backend/ before using this.
const DEMO_OWNER_EMAIL = 'demo.owner@houserent.dev';
const DEMO_OWNER_PASSWORD = 'DemoOwner123!';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

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

  const handleDemoLogin = async () => {
    setServerError(null);
    setDemoLoading(true);
    try {
      const user = await login(DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD);
      router.push(ROLE_HOME[user.role]);
    } catch (err) {
      setServerError(
        getApiErrorMessage(err, 'Demo account not found — run `npm run seed:demo` in backend/ first'),
      );
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-xl font-semibold text-secondary">Log in</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
          {serverError ? <p className="text-sm text-brown">{serverError}</p> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-muted" />
          <span className="text-xs text-gray-500">or</span>
          <div className="h-px flex-1 bg-muted" />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-4 w-full"
          onClick={handleDemoLogin}
          disabled={demoLoading}
        >
          {demoLoading ? 'Logging in…' : 'Demo login (owner)'}
        </Button>

        <div className="mt-4 flex flex-col gap-1 text-sm text-gray-600">
          <Link href="/forgot-password" className="underline hover:text-secondary">
            Forgot password?
          </Link>
          <span>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-secondary underline">
              Register your company
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}
