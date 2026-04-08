'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useConfirm } from '@/contexts/confirm-context';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const confirm = useConfirm();
  const [showMenu, setShowMenu] = useState(false);

  if (pathname === '/login' || pathname === '/register') return null;

  const handleLogout = async () => {
    setShowMenu(false);
    const ok = await confirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      danger: true,
    });
    if (!ok) return;
    logout();
    router.push('/login');
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      {/* Page title */}
      <div />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Theme toggler */}
        <button
          onClick={toggle}
          className="relative w-12 h-6 rounded-full bg-background border border-border transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
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

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 hover:bg-card-hover rounded-lg px-2 py-1 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-tight">{user?.displayName}</p>
              <p className="text-[10px] text-muted leading-tight capitalize">{user?.role}</p>
            </div>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                {/* User info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium">{user?.displayName}</p>
                  <p className="text-xs text-muted">{user?.email}</p>
                  <p className="text-xs text-primary capitalize mt-0.5">{user?.role}</p>
                  {user?.jerseyNumber && (
                    <p className="text-xs text-muted">Jersey #{user.jerseyNumber}</p>
                  )}
                </div>

                {/* Menu items */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
