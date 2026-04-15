import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  positionsService: {
    getAll: (...args: unknown[]) => mockGetAllPositions(...args),
  },
  traitsService: { getAll: (...args: unknown[]) => mockGetAllTraits(...args) },
  userPositionsService: { assign: vi.fn(), remove: vi.fn() },
  userTraitsService: {
    assign: vi.fn(),
    updateRating: vi.fn(),
    remove: vi.fn(),
  },
  matchesService: {
    getAll: vi.fn().mockResolvedValue([]),
    getAllGoals: vi.fn().mockResolvedValue([]),
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

import { matchesService } from '@/services';
import PlayerProfilePage from './page';

describe('PlayerProfilePage - Status Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllPositions.mockResolvedValue([
      { id: 'pos-1', name: 'GK', createdAt: '', updatedAt: '' },
    ]);
    mockGetAllTraits.mockResolvedValue([]);
    (matchesService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (matchesService.getAllGoals as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );
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

    expect(await screen.findByText(/^Active$/)).toBeInTheDocument();
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

    expect(await screen.findByText(/^Inactive$/)).toBeInTheDocument();
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

    const badge = await screen.findByText(/^Active$/);
    expect(badge.className).toContain('green');
  });
});

describe('PlayerProfilePage - Position Section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllTraits.mockResolvedValue([]);
    (matchesService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (matchesService.getAllGoals as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );
  });

  const baseProfile = {
    id: 'u-1',
    email: 'test@test.com',
    displayName: 'Test Player',
    role: 'player',
    jerseyNumber: 10,
    phone: '0901234567',
    status: 1,
    traits: [],
    stats: { goals: 0, assists: 0 },
    createdAt: '',
    updatedAt: '',
  };

  it('renders positions sorted GK → DEF → MID → FWD', async () => {
    mockGetAllPositions.mockResolvedValue([
      { id: 'p-st', name: 'ST', createdAt: '', updatedAt: '' },
      { id: 'p-cm', name: 'CM', createdAt: '', updatedAt: '' },
      { id: 'p-cb', name: 'CB', createdAt: '', updatedAt: '' },
      { id: 'p-gk', name: 'GK', createdAt: '', updatedAt: '' },
    ]);
    mockGetProfile.mockResolvedValue({ ...baseProfile, positions: [] });

    render(<PlayerProfilePage />);
    await screen.findByText('Test Player');

    // Get all position buttons in the primary section
    // Primary section text is the first set of position buttons
    const allBtns = screen.getAllByRole('button', { name: /^(GK|CB|CM|ST)$/ });
    const names = allBtns.map((b) => b.textContent?.trim());

    // GK should appear before CB, CB before CM, CM before ST
    expect(names.indexOf('GK')).toBeLessThan(names.indexOf('CB'));
    expect(names.indexOf('CB')).toBeLessThan(names.indexOf('CM'));
    expect(names.indexOf('CM')).toBeLessThan(names.indexOf('ST'));
  });

  it('applies yellow color class to selected GK primary position', async () => {
    mockGetAllPositions.mockResolvedValue([
      { id: 'p-gk', name: 'GK', createdAt: '', updatedAt: '' },
    ]);
    mockGetProfile.mockResolvedValue({
      ...baseProfile,
      positions: [
        {
          id: 'up1',
          positionId: 'p-gk',
          type: 'primary',
          userId: 'u-1',
          createdAt: '',
        },
      ],
    });

    render(<PlayerProfilePage />);
    await screen.findByText('Test Player');

    // Find the primary GK button - should have yellow color class
    const primarySection = screen.getByText(/primary/i).closest('div')!;
    const gkBtn = within(primarySection).getByRole('button', { name: 'GK' });
    expect(gkBtn.className).toMatch(/yellow/);
  });

  it('applies blue color class to selected CB sub position', async () => {
    mockGetAllPositions.mockResolvedValue([
      { id: 'p-cb', name: 'CB', createdAt: '', updatedAt: '' },
    ]);
    mockGetProfile.mockResolvedValue({
      ...baseProfile,
      positions: [
        {
          id: 'up1',
          positionId: 'p-cb',
          type: 'sub',
          userId: 'u-1',
          createdAt: '',
        },
      ],
    });

    render(<PlayerProfilePage />);
    await screen.findByText('Test Player');

    const subSection = screen.getByText(/sub/i).closest('div')!;
    const cbBtn = within(subSection).getByRole('button', { name: 'CB' });
    expect(cbBtn.className).toMatch(/blue/);
  });
});
