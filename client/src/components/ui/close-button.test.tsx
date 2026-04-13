import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CloseButton } from './close-button';

describe('CloseButton', () => {
  it('renders with accessible label', () => {
    render(<CloseButton onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<CloseButton onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<CloseButton onClick={vi.fn()} className="custom-x" />);
    expect(
      screen.getByRole('button', { name: /close/i }).className,
    ).toContain('custom-x');
  });
});
