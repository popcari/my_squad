'use client';

import { ChangePasswordModal } from '@/components/change-password-modal';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useAuth } from '@/contexts/auth-context';
import { useConfirm } from '@/contexts/confirm-context';
import { useTheme } from '@/contexts/theme-context';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [showMenu, setShowMenu] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);

  if (pathname === '/login' || pathname === '/register') return null;

  const handleLogout = async () => {
    setShowMenu(false);
    const ok = await confirm({
      title: t('auth.logoutConfirmTitle'),
      message: t('auth.logoutConfirmMessage'),
      confirmText: t('auth.logout'),
      danger: true,
    });
    if (!ok) return;
    logout();
    router.push('/login');
  };

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 pl-14 md:pl-6 md:px-6 flex-shrink-0 min-w-0 max-w-full">
      {/* Page title */}
      <div />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Theme toggler */}
        <button
          onClick={toggle}
          className="relative w-12 h-6 rounded-full bg-background border border-border transition-colors cursor-pointer"
          title={
            theme === 'dark' ? t('header.lightMode') : t('header.darkMode')
          }
        >
          <span
            className={`absolute top-[50%] translate-y-[-50%] w-4 h-4 rounded-full flex items-center justify-center text-xs transition-all ${
              theme === 'dark'
                ? 'left-0.5 bg-card-hover'
                : 'left-[1.375rem] bg-primary text-white'
            }`}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </button>

        {/* Language selector */}
        <LanguageSelector />

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold overflow-hidden">
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.displayName || ''}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-tight">
                {user?.displayName}
              </p>
              <p className="text-[10px] text-muted leading-tight capitalize">
                {user?.role}
              </p>
            </div>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                {/* User info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium">{user?.displayName}</p>
                  <p className="text-xs text-muted">{user?.email}</p>
                  <p className="text-xs text-primary capitalize mt-0.5">
                    {user?.role}
                  </p>
                  {user?.jerseyNumber && (
                    <p className="text-xs text-muted">
                      Jersey #{user.jerseyNumber}
                    </p>
                  )}
                </div>

                {/* Menu items */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowChangePw(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-card-hover transition-colors"
                >
                  {t('changePassword.title')}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  {t('auth.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ChangePasswordModal
        open={showChangePw}
        onClose={() => setShowChangePw(false)}
      />
    </header>
  );
}
