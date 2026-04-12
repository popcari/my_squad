'use client';

import { ThemeToggle } from '@/components/layout/theme-toggle';
import { InputText } from '@/components/ui/input-text';
import { USER_ROLE } from '@/constant/enum';
import { useAuth } from '@/contexts/auth-context';
import { authService } from '@/services/auth.service';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const registerSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().superRefine((val, ctx) => {
    if (val.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Password is required' });
      return;
    }
    if (val.length < 6) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password must be at least 6 characters',
      });
    }
    if (val.length > 32) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password must be at most 32 characters',
      });
    }
    if (!/[A-Z]/.test(val)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password must contain at least 1 uppercase letter',
      });
    }
    if (!/\d/.test(val)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password must contain at least 1 number',
      });
    }
  }),
  phone: z.string().min(1, 'Phone number is required'),
  jerseyNumber: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    try {
      const user = await authService.register({
        displayName: data.displayName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: USER_ROLE.PLAYER,
        jerseyNumber: data.jerseyNumber ? Number(data.jerseyNumber) : undefined,
      });
      login(user);
      router.push('/');
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Registration failed',
      );
    }
  };

  return (
    <div className="min-h-screen w-full md:w-[600px] m-auto flex items-center justify-center bg-background">
      <ThemeToggle />
      <div className="w-[90%] md:w-full md:max-w-lg">
        <div className="bg-card rounded-2xl p-4 shadow-lg border border-border">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">Join My Squad</h1>
            <p className="text-sm text-muted mt-1">Create your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputText
              id="displayName"
              label="Display Name"
              placeholder="Your name"
              error={errors.displayName}
              required
              autoFocus
              {...register('displayName')}
            />

            <InputText
              id="email"
              label="Email"
              type="email"
              placeholder="your@email.com"
              error={errors.email}
              required
              {...register('email')}
            />

            <InputText
              id="password"
              label="Password"
              type="password"
              placeholder="Your password"
              error={errors.password}
              required
              maxLength={32}
              {...register('password')}
            />

            <InputText
              id="phone"
              label="Phone"
              type="tel"
              placeholder="0901234567"
              error={errors.phone}
              required
              {...register('phone')}
            />

            <InputText
              id="jerseyNumber"
              label="Jersey"
              type="number"
              min={1}
              max={99}
              placeholder="10"
              error={errors.jerseyNumber}
              {...register('jerseyNumber')}
            />

            {serverError && (
              <div className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-3 rounded-lg text-sm font-medium transition-colors"
            >
              {isSubmitting ? 'Creating account...' : 'Register'}
            </button>

            <p className="text-center text-sm text-muted">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
