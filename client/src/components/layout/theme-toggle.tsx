'use client';

import { useTheme } from '@/contexts/theme-context';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border hover:bg-card-hover transition-colors z-10"
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
