import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));
vi.mock('next/link', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { Sidebar } from './sidebar';

describe('Sidebar navigation', () => {
  it('renders a link to /formations', () => {
    render(<Sidebar />);
    const link = screen.getByRole('link', { name: /formations/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/formations');
  });

  it('keeps existing nav links (home, players, settings, traits, funding, matches)', () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: /players/i })).toHaveAttribute(
      'href',
      '/players',
    );
    expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute(
      'href',
      '/settings',
    );
    expect(screen.getByRole('link', { name: /traits/i })).toHaveAttribute(
      'href',
      '/traits',
    );
    expect(screen.getByRole('link', { name: /funding/i })).toHaveAttribute(
      'href',
      '/funding',
    );
    expect(screen.getByRole('link', { name: /stats/i })).toHaveAttribute(
      'href',
      '/matches',
    );
  });
});
