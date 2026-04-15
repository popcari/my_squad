'use client';

import { ThemeToggle } from '@/components/layout/theme-toggle';
import { InputText } from '@/components/ui/input-text';
import { useAuth } from '@/contexts/auth-context';
import { loginSchema, type LoginForm } from '@/schemas/login.schema';
import { authService } from '@/services/auth.service';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();
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
      setServerError(
        err instanceof Error ? err.message : t('auth.loginFailed'),
      );
    }
  };

  return (
    <div className="min-h-screen w-full md:w-[600px] m-auto flex items-center justify-center bg-background">
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        {/* <LanguageSelector /> */}
        <ThemeToggle />
      </div>
      <div className="w-[90%] md:w-full md:max-w-lg">
        <div className="bg-card rounded-2xl p-4 shadow-lg border border-border">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
            <p className="text-sm text-muted mt-1">
              {t('auth.signInToAccount')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputText
              id="email"
              label={t('auth.email')}
              type="email"
              placeholder="your@email.com"
              error={errors.email}
              required
              autoFocus
              {...register('email')}
            />

            <InputText
              id="password"
              label={t('auth.password')}
              type="password"
              placeholder={t('auth.password')}
              error={errors.password}
              required
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
              {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
            </button>

            <p className="text-center text-sm text-muted">
              {t('auth.dontHaveAccount')}{' '}
              <Link href="/register" className="text-primary hover:underline">
                {t('auth.register')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
