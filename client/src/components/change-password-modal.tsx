'use client';

import { InputText } from '@/components/ui/input-text';
import { Modal } from '@/components/ui/modal';
import { authService } from '@/services/auth.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'At least 6 characters')
      .max(32, 'At most 32 characters')
      .regex(/(?=.*[A-Z])/, 'At least 1 uppercase letter')
      .regex(/(?=.*\d)/, 'At least 1 number'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  const close = () => {
    reset();
    setServerError(null);
    setSuccess(false);
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      setSuccess(true);
      setTimeout(close, 1200);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : t('changePassword.unknownError'),
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      ariaLabel={t('changePassword.title')}
      panelClassName="md:max-w-sm p-6"
    >
      <h3 className="text-lg font-bold mb-4">{t('changePassword.title')}</h3>

      {success ? (
        <p className="text-sm text-accent py-4">
          {t('changePassword.success')}
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <InputText
            type="password"
            label={t('changePassword.currentLabel')}
            error={errors.currentPassword}
            required
            {...register('currentPassword')}
          />
          <InputText
            type="password"
            label={t('changePassword.newLabel')}
            error={errors.newPassword}
            required
            {...register('newPassword')}
          />
          <InputText
            type="password"
            label={t('changePassword.confirmLabel')}
            error={errors.confirmPassword}
            required
            {...register('confirmPassword')}
          />

          {serverError && (
            <p className="text-sm text-danger">{serverError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 text-sm bg-card-hover hover:bg-border rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isSubmitting
                ? t('common.saving')
                : t('changePassword.submit')}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
