import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingSpinner } from './loading-spinner';

describe('LoadingSpinner', () => {
  it('should render with default aria-label', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('should render with custom aria-label', () => {
    render(<LoadingSpinner label="Fetching players" />);
    expect(screen.getByLabelText('Fetching players')).toBeInTheDocument();
  });

  it('should apply size class for "sm"', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('spinner-sm');
  });

  it('should apply size class for "lg"', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('spinner-lg');
  });

  it('should render full-page variant when fullPage is true', () => {
    render(<LoadingSpinner fullPage />);
    const wrapper = screen.getByRole('status').parentElement;
    expect(wrapper).toHaveClass('spinner-fullpage');
  });
});
