import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('next/link', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
vi.mock('@/contexts/confirm-context', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
vi.mock('@/hooks/use-can-manage', () => ({
  useCanManage: () => false,
}));

const mockGetAllUsers = vi.fn();
const mockGetAllPositions = vi.fn();
const mockGetByUser = vi.fn();

vi.mock('@/services', () => ({
  usersService: { getAll: (...args: unknown[]) => mockGetAllUsers(...args), create: vi.fn(), remove: vi.fn() },
  positionsService: { getAll: (...args: unknown[]) => mockGetAllPositions(...args) },
  userPositionsService: { getByUser: (...args: unknown[]) => mockGetByUser(...args), assign: vi.fn() },
}));

import PlayersPage from './page';

describe('PlayersPage - Status Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllPositions.mockResolvedValue([
      { id: 'pos-1', name: 'GK', createdAt: '', updatedAt: '' },
    ]);
    mockGetByUser.mockResolvedValue([
      { id: 'up-1', userId: 'u-1', positionId: 'pos-1', type: 'primary', createdAt: '' },
    ]);
  });

  it('should display phone number in player info', async () => {
    mockGetAllUsers.mockResolvedValue([
      {
        id: 'u-1',
        email: 'test@test.com',
        displayName: 'Test Player',
        role: 'player',
        jerseyNumber: 10,
        phone: '0901234567',
        status: 1,
        createdAt: '',
        updatedAt: '',
      },
    ]);

    render(<PlayersPage />);

    expect(await screen.findByText(/0901234567/)).toBeInTheDocument();
  });

  it('should display active status badge when player status is 1', async () => {
    mockGetAllUsers.mockResolvedValue([
      {
        id: 'u-1',
        email: 'active@test.com',
        displayName: 'Active Player',
        role: 'player',
        jerseyNumber: 10,
        phone: '0901234567',
        status: 1,
        createdAt: '',
        updatedAt: '',
      },
    ]);

    render(<PlayersPage />);

    expect(await screen.findByText('common.active')).toBeInTheDocument();
  });

  it('should display inactive status badge when player status is 0', async () => {
    mockGetAllUsers.mockResolvedValue([
      {
        id: 'u-1',
        email: 'inactive@test.com',
        displayName: 'Inactive Player',
        role: 'player',
        jerseyNumber: 7,
        phone: '0907654321',
        status: 0,
        createdAt: '',
        updatedAt: '',
      },
    ]);

    render(<PlayersPage />);

    expect(await screen.findByText('common.inactive')).toBeInTheDocument();
  });

  it('should show green styling for active and red styling for inactive', async () => {
    mockGetAllUsers.mockResolvedValue([
      {
        id: 'u-1',
        email: 'a@test.com',
        displayName: 'Player A',
        role: 'player',
        jerseyNumber: 10,
        phone: '0901111111',
        status: 1,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'u-2',
        email: 'b@test.com',
        displayName: 'Player B',
        role: 'player',
        jerseyNumber: 7,
        phone: '0902222222',
        status: 0,
        createdAt: '',
        updatedAt: '',
      },
    ]);
    mockGetByUser
      .mockResolvedValueOnce([{ id: 'up-1', userId: 'u-1', positionId: 'pos-1', type: 'primary', createdAt: '' }])
      .mockResolvedValueOnce([{ id: 'up-2', userId: 'u-2', positionId: 'pos-1', type: 'primary', createdAt: '' }]);

    render(<PlayersPage />);

    const activeBadge = await screen.findByText('common.active');
    const inactiveBadge = await screen.findByText('common.inactive');

    expect(activeBadge.className).toContain('green');
    expect(inactiveBadge.className).toContain('red');
  });
});
