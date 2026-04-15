'use client';

import { useTheme } from '@/contexts/theme-context';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-card-hover transition-colors"
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
