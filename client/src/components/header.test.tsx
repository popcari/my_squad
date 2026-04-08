import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './header';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}));

// Mock contexts
const mockLogout = vi.fn();
const mockToggle = vi.fn();
let mockConfirmResult = true;

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', displayName: 'Coach Minh', email: 'coach@test.com', role: 'coach', jerseyNumber: 99 },
    logout: mockLogout,
  }),
}));

vi.mock('@/contexts/theme-context', () => ({
  useTheme: () => ({ theme: 'dark', toggle: mockToggle }),
}));

vi.mock('@/contexts/confirm-context', () => ({
  useConfirm: () => (opts: { message: string }) => Promise.resolve(mockConfirmResult),
}));

describe('Header', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockLogout.mockClear();
    mockConfirmResult = true;
  });

  it('should render user initials avatar', () => {
    render(<Header />);
    expect(screen.getByText('CM')).toBeInTheDocument();
  });

  it('should show dropdown menu when avatar clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByText('CM'));

    expect(screen.getByText('coach@test.com')).toBeInTheDocument();
    expect(screen.getAllByText('coach').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should call confirm then logout when logout clicked and confirmed', async () => {
    const user = userEvent.setup();
    mockConfirmResult = true;
    render(<Header />);

    await user.click(screen.getByText('CM'));
    await user.click(screen.getByText('Logout'));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should not logout when confirm cancelled', async () => {
    const user = userEvent.setup();
    mockConfirmResult = false;
    render(<Header />);

    await user.click(screen.getByText('CM'));
    await user.click(screen.getByText('Logout'));

    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('should toggle theme when theme button clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);

    const themeBtn = screen.getByTitle('Light mode');
    await user.click(themeBtn);

    expect(mockToggle).toHaveBeenCalled();
  });
});
