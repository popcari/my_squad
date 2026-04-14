'use client';

import {
  BarChart3,
  Home,
  LayoutGrid,
  Menu,
  Settings,
  Target,
  Trophy,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const navItems: {
  href: string;
  labelKey: string;
  Icon: LucideIcon;
  color: string;
}[] = [
  { href: '/', labelKey: 'nav.home', Icon: Home, color: 'text-blue-500' },
  { href: '/matches', labelKey: 'nav.stats', Icon: BarChart3, color: 'text-green-500' },
  { href: '/season-dashboard', labelKey: 'nav.seasonDashboard', Icon: Trophy, color: 'text-amber-400' },
  { href: '/formations', labelKey: 'nav.formations', Icon: LayoutGrid, color: 'text-purple-500' },
  { href: '/funding', labelKey: 'nav.funding', Icon: Wallet, color: 'text-emerald-500' },
  { href: '/players', labelKey: 'nav.players', Icon: Users, color: 'text-sky-500' },
  { href: '/traits', labelKey: 'nav.traits', Icon: Target, color: 'text-rose-500' },
  { href: '/settings', labelKey: 'nav.settings', Icon: Settings, color: 'text-slate-400' },
];

export function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <>
      {/* Mobile hamburger button — rendered in top-left, visible only on mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-2 left-2 z-40 w-10 h-10 flex items-center justify-center rounded-lg bg-card border border-border text-foreground md:hidden transition-colors hover:bg-card-hover"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-card border-r border-border flex flex-col transition-all duration-200
          fixed inset-0 z-50 w-full
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:min-h-screen
          ${collapsed ? 'md:w-16' : 'md:w-64'}
        `}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          {(!collapsed || mobileOpen) && (
            <div>
              <h1 className="text-xl font-bold text-primary">
                {t('common.appName')}
              </h1>
              <p className="text-xs text-muted">{t('common.teamManagement')}</p>
            </div>
          )}

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-card-hover text-foreground transition-colors md:hidden flex-shrink-0"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>

          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 hidden md:flex items-center justify-center rounded-lg hover:bg-card-hover text-muted hover:text-foreground transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '\u00BB' : '\u00AB'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed && !mobileOpen ? t(item.labelKey) : undefined}
                className={`flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-foreground hover:bg-card-hover'
                } ${collapsed && !mobileOpen ? 'md:justify-center' : ''}`}
              >
                <item.Icon
                  size={18}
                  strokeWidth={2}
                  className={isActive ? 'text-white' : item.color}
                />
                {(!collapsed || mobileOpen) && (
                  <span className="text-base md:text-sm">
                    {t(item.labelKey)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile: bottom safe area padding */}
        <div className="h-8 md:hidden" />
      </aside>
    </>
  );
}
