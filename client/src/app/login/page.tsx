'use client';

import { InputText } from '@/components/input-text';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
import { authService } from '@/services/auth.service';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().superRefine((val, ctx) => {
    if (val.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Password is required' });
      return;
    }
    if (val.length < 6) {
      ctx.addIssue({ code: 'custom', message: 'Password must be at least 6 characters' });
    }
    if (!/[A-Z]/.test(val)) {
      ctx.addIssue({ code: 'custom', message: 'Password must contain at least 1 uppercase letter' });
    }
    if (!/\d/.test(val)) {
      ctx.addIssue({ code: 'custom', message: 'Password must contain at least 1 number' });
    }
  }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    try {
      const user = await authService.login(data.email, data.password);
      login(user);
      router.push('/');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-[370px] md:w-[600px] m-auto flex items-center justify-center bg-background">
      <ThemeToggle />
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">&#9917;</span>
            </div>
            <h1 className="text-2xl font-bold">My Squad</h1>
            <p className="text-sm text-muted mt-1">
              Sign in to manage your team
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputText
              id="email"
              label="Email"
              type="email"
              placeholder="your@email.com"
              error={errors.email}
              autoFocus
              {...register('email')}
            />

            <InputText
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password}
              {...register('password')}
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
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
