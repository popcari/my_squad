import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RegisterPage from './page';

// Mock dependencies
const mockPush = vi.fn();
const mockCtxLogin = vi.fn();
const mockRegister = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: null, login: mockCtxLogin, logout: vi.fn() }),
}));
vi.mock('@/services/auth.service', () => ({
  authService: { register: (...args: unknown[]) => mockRegister(...args) },
}));

describe('RegisterPage', () => {
  it('should render all form fields', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText('Display Name', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('Email', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('Password', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('Phone', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('Jersey')).toBeInTheDocument();
  });

  describe('phone validation', () => {
    it('should show error when phone is empty and blurred', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const input = screen.getByLabelText('Phone', { exact: false });
      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      });
    });
  });

  describe('password validation', () => {
    it('should show error when password is empty and blurred', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Password', { exact: false });
      await user.click(passwordInput);
      await user.tab(); // blur

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should show error when password has no uppercase letter', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Password', { exact: false });
      await user.type(passwordInput, 'abcdef1');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('Password must contain at least 1 uppercase letter'),
        ).toBeInTheDocument();
      });
    });

    it('should show error when password has no number', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Password', { exact: false });
      await user.type(passwordInput, 'Abcdefg');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('Password must contain at least 1 number'),
        ).toBeInTheDocument();
      });
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Password', { exact: false });
      await user.type(passwordInput, 'Ab1');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 6 characters'),
        ).toBeInTheDocument();
      });
    });

    it('should show multiple errors at once', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Password', { exact: false });
      await user.type(passwordInput, 'abc');
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
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Password', { exact: false });
      await user.type(passwordInput, 'Hello123');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.queryByText(/Password must/),
        ).not.toBeInTheDocument();
      });
    });
  });

  it('should disable submit button when form is invalid', async () => {
    render(<RegisterPage />);
    const submitButton = screen.getByRole('button', { name: 'Register' });
    expect(submitButton).toBeDisabled();
  });

  it('submits and redirects on successful register', async () => {
    mockRegister.mockResolvedValue({ id: 'new', email: 'n@x.com' });
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(
      screen.getByLabelText('Display Name', { exact: false }),
      'New User',
    );
    await user.type(
      screen.getByLabelText('Email', { exact: false }),
      'n@x.com',
    );
    await user.type(
      screen.getByLabelText('Password', { exact: false }),
      'Hello123',
    );
    await user.type(
      screen.getByLabelText('Phone', { exact: false }),
      '0901234567',
    );

    const submitBtn = screen.getByRole('button', { name: 'Register' });
    await waitFor(() => expect(submitBtn).toBeEnabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
      expect(mockCtxLogin).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('shows server error when register fails', async () => {
    mockRegister.mockRejectedValue(new Error('Email taken'));
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(
      screen.getByLabelText('Display Name', { exact: false }),
      'New User',
    );
    await user.type(
      screen.getByLabelText('Email', { exact: false }),
      'n@x.com',
    );
    await user.type(
      screen.getByLabelText('Password', { exact: false }),
      'Hello123',
    );
    await user.type(
      screen.getByLabelText('Phone', { exact: false }),
      '0901234567',
    );

    const submitBtn = screen.getByRole('button', { name: 'Register' });
    await waitFor(() => expect(submitBtn).toBeEnabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Email taken')).toBeInTheDocument();
    });
  });
});
