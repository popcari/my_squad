import type { Match, MatchGoal, MatchLineup, User } from '@/types';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/shared/skeleton', () => ({
  MatchesPageSkeleton: () => <div>Loading...</div>,
}));

vi.mock('next/link', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const mockGetMatches = vi.fn();
const mockGetGoals = vi.fn();
const mockGetLineups = vi.fn();
const mockGetUsers = vi.fn();

vi.mock('@/services', () => ({
  matchesService: {
    getAll: (...args: unknown[]) => mockGetMatches(...args),
    getAllGoals: (...args: unknown[]) => mockGetGoals(...args),
    getAllLineups: (...args: unknown[]) => mockGetLineups(...args),
  },
  usersService: {
    getAll: (...args: unknown[]) => mockGetUsers(...args),
  },
}));

import SeasonDashboardPage from './page';

// Helper: date N months ago
const monthsAgo = (n: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
};

const mkUser = (id: string, name: string, jersey: number): User => ({
  id,
  email: `${id}@x.com`,
  displayName: name,
  role: 'player',
  phone: '0',
  jerseyNumber: jersey,
  status: 1,
  createdAt: '',
  updatedAt: '',
});

const mkMatch = (
  id: string,
  monthsBack: number,
  status: 'completed' | 'pending' | 'cancelled' = 'completed',
): Match => ({
  id,
  opponent: 'FC X',
  matchDate: monthsAgo(monthsBack),
  location: 'Home',
  status,
  createdAt: '',
  updatedAt: '',
});

const mkGoal = (
  id: string,
  matchId: string,
  scorerId: string,
  assistId?: string,
): MatchGoal => ({
  id,
  matchId,
  scorerId,
  assistId,
  minute: null,
  createdAt: '',
});

const mkLineup = (
  id: string,
  matchId: string,
  userId: string,
  type: 'starting' | 'substitute' = 'starting',
): MatchLineup => ({
  id,
  matchId,
  userId,
  type,
  slotIndex: null,
  createdAt: '',
});

describe('SeasonDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMatches.mockResolvedValue([]);
    mockGetGoals.mockResolvedValue([]);
    mockGetLineups.mockResolvedValue([]);
    mockGetUsers.mockResolvedValue([]);
  });

  it('renders three card headings: Top Scorers, Top Assists, Top Attendance', async () => {
    render(<SeasonDashboardPage />);
    expect(await screen.findByText(/top scorers/i)).toBeInTheDocument();
    expect(screen.getByText(/top assists/i)).toBeInTheDocument();
    expect(screen.getByText(/top attendance/i)).toBeInTheDocument();
  });

  it('range dropdown defaults to 1 month and re-aggregates when changed', async () => {
    const user = userEvent.setup();
    const users = [mkUser('u1', 'Alpha', 10)];
    // One goal within the last month, another 6 months ago
    const matchRecent = mkMatch('m1', 0);
    const matchOld = mkMatch('m2', 6);

    mockGetUsers.mockResolvedValue(users);
    mockGetMatches.mockResolvedValue([matchRecent, matchOld]);
    mockGetGoals.mockResolvedValue([
      mkGoal('g1', 'm1', 'u1'),
      mkGoal('g2', 'm2', 'u1'),
    ]);
    mockGetLineups.mockResolvedValue([]);

    render(<SeasonDashboardPage />);
    const scorersCard = (await screen.findByText(/top scorers/i)).closest(
      'section',
    )!;
    // 1m default: 1 goal only
    expect(within(scorersCard).getByText('Alpha')).toBeInTheDocument();
    expect(within(scorersCard).getByTestId('row-count-u1').textContent).toBe(
      '1',
    );

    // Change to 12m → 2 goals
    await user.selectOptions(
      screen.getByTestId('range-select'),
      '12',
    );
    expect(
      within(
        (await screen.findByText(/top scorers/i)).closest('section')!,
      ).getByTestId('row-count-u1').textContent,
    ).toBe('2');
  });

  it('excludes non-completed matches from all three tallies', async () => {
    const users = [mkUser('u1', 'Alpha', 10)];
    mockGetUsers.mockResolvedValue(users);
    mockGetMatches.mockResolvedValue([
      mkMatch('m1', 0, 'pending'),
      mkMatch('m2', 0, 'cancelled'),
    ]);
    mockGetGoals.mockResolvedValue([mkGoal('g1', 'm1', 'u1')]);
    mockGetLineups.mockResolvedValue([mkLineup('l1', 'm2', 'u1')]);

    render(<SeasonDashboardPage />);
    // All three cards should show empty state
    const emptyStates = await screen.findAllByText(/no data for this range/i);
    expect(emptyStates.length).toBe(3);
  });

  it('attendance de-duplicates same user appearing twice in one match lineup', async () => {
    const users = [mkUser('u1', 'Alpha', 10)];
    mockGetUsers.mockResolvedValue(users);
    mockGetMatches.mockResolvedValue([mkMatch('m1', 0)]);
    mockGetGoals.mockResolvedValue([]);
    // Defensive: same user has two lineup rows in same match (shouldn't, but just in case)
    mockGetLineups.mockResolvedValue([
      mkLineup('l1', 'm1', 'u1', 'starting'),
      mkLineup('l2', 'm1', 'u1', 'substitute'),
    ]);

    render(<SeasonDashboardPage />);
    const attendanceCard = (
      await screen.findByText(/top attendance/i)
    ).closest('section')!;
    expect(within(attendanceCard).getByTestId('row-count-u1').textContent).toBe(
      '1',
    );
  });

  it('attendance counts starting AND sub lineups across different matches', async () => {
    const users = [mkUser('u1', 'Alpha', 10)];
    mockGetUsers.mockResolvedValue(users);
    mockGetMatches.mockResolvedValue([mkMatch('m1', 0), mkMatch('m2', 0)]);
    mockGetGoals.mockResolvedValue([]);
    mockGetLineups.mockResolvedValue([
      mkLineup('l1', 'm1', 'u1', 'starting'),
      mkLineup('l2', 'm2', 'u1', 'substitute'),
    ]);

    render(<SeasonDashboardPage />);
    const attendanceCard = (
      await screen.findByText(/top attendance/i)
    ).closest('section')!;
    expect(within(attendanceCard).getByTestId('row-count-u1').textContent).toBe(
      '2',
    );
  });

  it('shows top 3 on podium; tied 4th is hidden until Show more clicked', async () => {
    const user = userEvent.setup();
    const users = [
      mkUser('u1', 'Alpha', 1),
      mkUser('u2', 'Bravo', 2),
      mkUser('u3', 'Charlie', 3),
      mkUser('u4', 'Delta', 4),
    ];
    mockGetUsers.mockResolvedValue(users);
    mockGetMatches.mockResolvedValue([mkMatch('m1', 0)]);
    mockGetGoals.mockResolvedValue([
      mkGoal('g1', 'm1', 'u1'),
      mkGoal('g2', 'm1', 'u2'),
      mkGoal('g3', 'm1', 'u3'),
      mkGoal('g4', 'm1', 'u4'),
    ]);

    render(<SeasonDashboardPage />);
    const scorersCard = (await screen.findByText(/top scorers/i)).closest(
      'section',
    )!;
    expect(within(scorersCard).getByText('Alpha')).toBeInTheDocument();
    expect(within(scorersCard).getByText('Bravo')).toBeInTheDocument();
    expect(within(scorersCard).getByText('Charlie')).toBeInTheDocument();
    // Delta hidden by default
    expect(within(scorersCard).queryByText('Delta')).not.toBeInTheDocument();

    await user.click(
      within(scorersCard).getByRole('button', { name: /view 1 more/i }),
    );
    expect(within(scorersCard).getByText('Delta')).toBeInTheDocument();
  });

  it('excludes players with zero goals / assists / attendance', async () => {
    const users = [mkUser('u1', 'Alpha', 1), mkUser('u2', 'Bravo', 2)];
    mockGetUsers.mockResolvedValue(users);
    mockGetMatches.mockResolvedValue([mkMatch('m1', 0)]);
    // Only u1 scored; u2 has no goals
    mockGetGoals.mockResolvedValue([mkGoal('g1', 'm1', 'u1')]);
    mockGetLineups.mockResolvedValue([]);

    render(<SeasonDashboardPage />);
    const scorersCard = (await screen.findByText(/top scorers/i)).closest(
      'section',
    )!;
    expect(within(scorersCard).getByText('Alpha')).toBeInTheDocument();
    expect(within(scorersCard).queryByText('Bravo')).not.toBeInTheDocument();
    // Assists: no one has any → empty state
    const assistCard = (await screen.findByText(/top assists/i)).closest(
      'section',
    )!;
    expect(
      within(assistCard).getByText(/no data for this range/i),
    ).toBeInTheDocument();
  });

  it('shows empty state per card when no completed matches in range', async () => {
    mockGetMatches.mockResolvedValue([]);
    render(<SeasonDashboardPage />);
    const empties = await screen.findAllByText(/no data for this range/i);
    expect(empties.length).toBe(3);
  });

  it('initially shows only top 3 on podium; rank 4+ hidden behind Show more', async () => {
    const user = userEvent.setup();
    const users = Array.from({ length: 6 }, (_, i) =>
      mkUser(`u${i + 1}`, `P${i + 1}`, i + 1),
    );
    mockGetUsers.mockResolvedValue(users);
    mockGetMatches.mockResolvedValue([mkMatch('m1', 0)]);
    // u1 has 6 goals, u2 has 5, ... u6 has 1 (distinct counts)
    const goals = users.flatMap((u, i) =>
      Array.from({ length: 6 - i }, (_, g) =>
        mkGoal(`g-${u.id}-${g}`, 'm1', u.id),
      ),
    );
    mockGetGoals.mockResolvedValue(goals);

    render(<SeasonDashboardPage />);
    const scorersCard = (await screen.findByText(/top scorers/i)).closest(
      'section',
    )!;
    // Only podium visible initially
    expect(within(scorersCard).getByText('P1')).toBeInTheDocument();
    expect(within(scorersCard).getByText('P2')).toBeInTheDocument();
    expect(within(scorersCard).getByText('P3')).toBeInTheDocument();
    expect(within(scorersCard).queryByText('P4')).not.toBeInTheDocument();
    expect(within(scorersCard).queryByText('P5')).not.toBeInTheDocument();
    expect(within(scorersCard).queryByText('P6')).not.toBeInTheDocument();

    // Button says "View 3 more" (rest = P4,P5,P6)
    await user.click(
      within(scorersCard).getByRole('button', { name: /view 3 more/i }),
    );
    expect(within(scorersCard).getByText('P4')).toBeInTheDocument();
    expect(within(scorersCard).getByText('P5')).toBeInTheDocument();
    expect(within(scorersCard).getByText('P6')).toBeInTheDocument();

    await user.click(
      within(scorersCard).getByRole('button', { name: /show less/i }),
    );
    expect(within(scorersCard).queryByText('P4')).not.toBeInTheDocument();
  });

  it('does not render show-more button when there are <=3 players (only podium)', async () => {
    const users = [
      mkUser('u1', 'P1', 1),
      mkUser('u2', 'P2', 2),
      mkUser('u3', 'P3', 3),
    ];
    mockGetUsers.mockResolvedValue(users);
    mockGetMatches.mockResolvedValue([mkMatch('m1', 0)]);
    mockGetGoals.mockResolvedValue([
      mkGoal('g1', 'm1', 'u1'),
      mkGoal('g2', 'm1', 'u2'),
      mkGoal('g3', 'm1', 'u3'),
    ]);

    render(<SeasonDashboardPage />);
    const scorersCard = (await screen.findByText(/top scorers/i)).closest(
      'section',
    )!;
    expect(
      within(scorersCard).queryByRole('button', { name: /view .* more/i }),
    ).not.toBeInTheDocument();
  });

  it('clicking a player name navigates to /players/[id]', async () => {
    const users = [mkUser('u1', 'Alpha', 10)];
    mockGetUsers.mockResolvedValue(users);
    mockGetMatches.mockResolvedValue([mkMatch('m1', 0)]);
    mockGetGoals.mockResolvedValue([mkGoal('g1', 'm1', 'u1')]);

    render(<SeasonDashboardPage />);
    const link = await screen.findByRole('link', { name: /alpha/i });
    expect(link).toHaveAttribute('href', '/players/u1');
  });

  it('avatar is wrapped in a lightbox trigger when avatar URL is provided', async () => {
    const users = [
      { ...mkUser('u1', 'Alpha', 10), avatar: 'https://res.cloudinary.com/x.jpg' },
    ];
    mockGetUsers.mockResolvedValue(users);
    mockGetMatches.mockResolvedValue([mkMatch('m1', 0)]);
    mockGetGoals.mockResolvedValue([mkGoal('g1', 'm1', 'u1')]);

    render(<SeasonDashboardPage />);
    expect(
      await screen.findByRole('button', { name: /preview alpha/i }),
    ).toBeInTheDocument();
  });

  it('avatar is NOT wrapped in a lightbox when no avatar URL (fallback initials)', async () => {
    const users = [mkUser('u1', 'Alpha', 10)];
    mockGetUsers.mockResolvedValue(users);
    mockGetMatches.mockResolvedValue([mkMatch('m1', 0)]);
    mockGetGoals.mockResolvedValue([mkGoal('g1', 'm1', 'u1')]);

    render(<SeasonDashboardPage />);
    await screen.findByText('Alpha');
    expect(
      screen.queryByRole('button', { name: /preview alpha/i }),
    ).not.toBeInTheDocument();
  });
});
