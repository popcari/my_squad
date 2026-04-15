import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const mockPush = vi.fn();
const mockAuthContextLogin = vi.fn();
const mockServiceLogin = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: null, login: mockAuthContextLogin, logout: vi.fn() }),
}));
vi.mock('@/services/auth.service', () => ({
  authService: { login: (...args: unknown[]) => mockServiceLogin(...args) },
}));

describe('LoginPage', () => {
  it('should render email and password fields', () => {
    render(<LoginPage />);
    expect(
      screen.getByLabelText('Email', { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Password', { exact: false }),
    ).toBeInTheDocument();
  });

  describe('password validation', () => {
    it('should show error when password is empty and blurred', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const input = screen.getByLabelText('Password', { exact: false });
      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const input = screen.getByLabelText('Password', { exact: false });
      await user.type(input, 'Ab1');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 6 characters'),
        ).toBeInTheDocument();
      });
    });

    it('should show error when password has no uppercase', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const input = screen.getByLabelText('Password', { exact: false });
      await user.type(input, 'abcdef1');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('Password must contain at least 1 uppercase letter'),
        ).toBeInTheDocument();
      });
    });

    it('should show error when password has no number', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const input = screen.getByLabelText('Password', { exact: false });
      await user.type(input, 'Abcdefg');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('Password must contain at least 1 number'),
        ).toBeInTheDocument();
      });
    });

    it('should show multiple errors at once', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const input = screen.getByLabelText('Password', { exact: false });
      await user.type(input, 'abc');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 6 characters'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('Password must contain at least 1 uppercase letter'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('Password must contain at least 1 number'),
        ).toBeInTheDocument();
      });
    });

    it('should show no errors when password is valid', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const input = screen.getByLabelText('Password', { exact: false });
      await user.type(input, 'Hello123');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/Password must/)).not.toBeInTheDocument();
      });
    });
  });

  it('should disable submit button when form is invalid', async () => {
    render(<LoginPage />);
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    expect(submitButton).toBeDisabled();
  });

  it('submits and redirects on successful login', async () => {
    mockServiceLogin.mockResolvedValue({ id: 'u-1', email: 'a@b.com' });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(
      screen.getByLabelText('Email', { exact: false }),
      'a@b.com',
    );
    await user.type(
      screen.getByLabelText('Password', { exact: false }),
      'Hello123',
    );

    const submitBtn = screen.getByRole('button', { name: 'Sign In' });
    await waitFor(() => expect(submitBtn).toBeEnabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockServiceLogin).toHaveBeenCalledWith('a@b.com', 'Hello123');
      expect(mockAuthContextLogin).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('shows server error when login fails', async () => {
    mockServiceLogin.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(
      screen.getByLabelText('Email', { exact: false }),
      'a@b.com',
    );
    await user.type(
      screen.getByLabelText('Password', { exact: false }),
      'Hello123',
    );
    const submitBtn = screen.getByRole('button', { name: 'Sign In' });
    await waitFor(() => expect(submitBtn).toBeEnabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
