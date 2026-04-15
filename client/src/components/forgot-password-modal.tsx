'use client';

import { InputText } from '@/components/ui/input-text';
import { Modal } from '@/components/ui/modal';
import { authService } from '@/services/auth.service';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const close = () => {
    setEmail('');
    setSent(false);
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      ariaLabel={t('auth.forgotPassword')}
      panelClassName="md:max-w-sm p-6"
    >
      <h3 className="text-lg font-bold mb-2">{t('auth.forgotPassword')}</h3>

      {sent ? (
        <>
          <p className="text-sm text-muted mb-4">
            {t('auth.forgotPasswordSent')}
          </p>
          <button
            onClick={close}
            className="w-full px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm"
          >
            {t('common.close')}
          </button>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-muted">
            {t('auth.forgotPasswordPrompt')}
          </p>
          <InputText
            type="email"
            label={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 text-sm bg-card-hover hover:bg-border rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {loading ? t('common.loading') : t('auth.sendResetLink')}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
