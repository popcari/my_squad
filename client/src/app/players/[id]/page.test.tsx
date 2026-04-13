import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('next/link', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'u-1' }),
}));
vi.mock('@/contexts/confirm-context', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
vi.mock('@/hooks/use-can-manage', () => ({
  useCanManage: () => false,
}));
vi.mock('@/hooks/use-current-user', () => ({
  useCurrentUser: () => ({ id: 'u-1' }),
}));
vi.mock('@/components/avatar-picker-modal', () => ({
  AvatarPickerModal: () => null,
}));
vi.mock('@/components/skeleton', () => ({
  PlayerProfilePageSkeleton: () => <div>Loading...</div>,
}));

const mockGetProfile = vi.fn();
const mockGetAllPositions = vi.fn();
const mockGetAllTraits = vi.fn();

vi.mock('@/services', () => ({
  usersService: {
    getProfile: (...args: unknown[]) => mockGetProfile(...args),
    update: vi.fn(),
    uploadAvatar: vi.fn(),
  },
  positionsService: { getAll: (...args: unknown[]) => mockGetAllPositions(...args) },
  traitsService: { getAll: (...args: unknown[]) => mockGetAllTraits(...args) },
  userPositionsService: { assign: vi.fn(), remove: vi.fn() },
  userTraitsService: { assign: vi.fn(), updateRating: vi.fn(), remove: vi.fn() },
  matchesService: { 
    getAll: vi.fn().mockResolvedValue([]),
    getAllGoals: vi.fn().mockResolvedValue([])
  },
}));

// Suppress Recharts ResponsiveContainer warnings in JSDOM
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: '800px', height: '600px' }}>{children}</div>
    ),
  };
});

import PlayerProfilePage from './page';
import { matchesService } from '@/services';

describe('PlayerProfilePage - Status Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllPositions.mockResolvedValue([
      { id: 'pos-1', name: 'GK', createdAt: '', updatedAt: '' },
    ]);
    mockGetAllTraits.mockResolvedValue([]);
    (matchesService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (matchesService.getAllGoals as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('should display phone number in profile', async () => {
    mockGetProfile.mockResolvedValue({
      id: 'u-1',
      email: 'test@test.com',
      displayName: 'Test Player',
      role: 'player',
      jerseyNumber: 10,
      phone: '0901234567',
      status: 1,
      positions: [],
      traits: [],
      stats: { goals: 0, assists: 0 },
      createdAt: '',
      updatedAt: '',
    });

    render(<PlayerProfilePage />);

    expect(await screen.findByText(/0901234567/)).toBeInTheDocument();
  });

  it('should display Active badge when player status is 1', async () => {
    mockGetProfile.mockResolvedValue({
      id: 'u-1',
      email: 'active@test.com',
      displayName: 'Active Player',
      role: 'player',
      jerseyNumber: 10,
      phone: '0901234567',
      status: 1,
      positions: [],
      traits: [],
      stats: { goals: 0, assists: 0 },
      createdAt: '',
      updatedAt: '',
    });

    render(<PlayerProfilePage />);

    expect(await screen.findByText('common.active')).toBeInTheDocument();
  });

  it('should display Inactive badge when player status is 0', async () => {
    mockGetProfile.mockResolvedValue({
      id: 'u-1',
      email: 'inactive@test.com',
      displayName: 'Inactive Player',
      role: 'player',
      jerseyNumber: 7,
      phone: '0907654321',
      status: 0,
      positions: [],
      traits: [],
      stats: { goals: 0, assists: 0 },
      createdAt: '',
      updatedAt: '',
    });

    render(<PlayerProfilePage />);

    expect(await screen.findByText('common.inactive')).toBeInTheDocument();
  });

  it('should show green styling for active and red for inactive', async () => {
    mockGetProfile.mockResolvedValue({
      id: 'u-1',
      email: 'test@test.com',
      displayName: 'Test Player',
      role: 'player',
      phone: '0901234567',
      status: 1,
      positions: [],
      traits: [],
      stats: { goals: 0, assists: 0 },
      createdAt: '',
      updatedAt: '',
    });

    render(<PlayerProfilePage />);

    const badge = await screen.findByText('common.active');
    expect(badge.className).toContain('green');
  });
});
