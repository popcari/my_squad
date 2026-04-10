'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: '⚽' },
  { href: '/players', label: 'Players', icon: '👥' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
  { href: '/traits', label: 'Traits', icon: '📊' },
];

export function Sidebar() {
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
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="5" x2="17" y2="5" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="15" x2="17" y2="15" />
        </svg>
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
              <h1 className="text-xl font-bold text-primary">My Squad</h1>
              <p className="text-xs text-muted">Team Management</p>
            </div>
          )}

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-card-hover text-foreground text-xl transition-colors md:hidden flex-shrink-0"
            aria-label="Close menu"
          >
            ✕
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
                title={collapsed && !mobileOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-foreground hover:bg-card-hover'
                } ${collapsed && !mobileOpen ? 'md:justify-center' : ''}`}
              >
                <span className="text-lg md:text-base">{item.icon}</span>
                {(!collapsed || mobileOpen) && (
                  <span className="text-base md:text-sm">{item.label}</span>
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
