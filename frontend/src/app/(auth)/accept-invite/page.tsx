'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, getApiErrorMessage } from '../../../lib/auth-context';
import { ROLE_HOME } from '../../../types/auth';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const acceptInviteFormSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AcceptInviteFormValues = z.infer<typeof acceptInviteFormSchema>;

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { acceptInvite } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormValues>({ resolver: zodResolver(acceptInviteFormSchema) });

  if (!token) {
    return <p className="text-sm text-red-600">This invite link is missing a token. Ask your property manager to resend it.</p>;
  }

  const onSubmit = async (values: AcceptInviteFormValues) => {
    setServerError(null);
    try {
      const user = await acceptInvite(token, values.password);
      router.push(ROLE_HOME[user.role]);
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'This invite link is invalid or has expired'));
    }
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-2 text-xl font-semibold">Set your password</h1>
      <p className="mb-6 text-sm text-gray-600">Finish setting up your renter account to view your lease and pay rent online.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
        {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Setting up…' : 'Activate my account'}
        </Button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <AcceptInviteForm />
      </Suspense>
    </main>
  );
}
