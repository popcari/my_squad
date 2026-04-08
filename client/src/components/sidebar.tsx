'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: '⚽' },
  { href: '/players', label: 'Players', icon: '👥' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
  { href: '/traits', label: 'Traits', icon: '📊' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} bg-card border-r border-border min-h-screen flex flex-col transition-all duration-200`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-primary">My Squad</h1>
            <p className="text-xs text-muted">Team Management</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card-hover text-muted hover:text-foreground transition-colors"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '\u00BB' : '\u00AB'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-foreground hover:bg-card-hover'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="text-base">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
