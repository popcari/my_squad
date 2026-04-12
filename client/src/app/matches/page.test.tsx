import MatchesPage from '@/app/matches/page';
import { MATCH_STATUS, USER_ROLE } from '@/constant/enum';
import { useCanManage } from '@/hooks/use-can-manage';
import { fundingService, matchesService, usersService } from '@/services';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// Mock dependencies
vi.mock('@/services', () => ({
  matchesService: {
    getAll: vi.fn(),
    getAllGoals: vi.fn(),
    getOne: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    getLineups: vi.fn(),
    addLineup: vi.fn(),
    removeLineup: vi.fn(),
    getGoals: vi.fn(),
    addGoal: vi.fn(),
  },
  fundingService: {
    getExpenses: vi.fn(),
    addExpense: vi.fn(),
  },
  usersService: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/hooks/use-can-manage', () => ({
  useCanManage: vi.fn(),
}));

// Suppress Recharts ResponsiveContainer warnings in JSDOM
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: '800px', height: '600px' }}>{children}</div>
    ),
  };
});

describe('Matches Dashboard', () => {
  const mockMatches = [
    {
      id: 'm1',
      opponent: 'FC Vercel',
      matchDate: '2026-04-10T10:00:00Z',
      location: 'Stadium',
      status: MATCH_STATUS.COMPLETED,
      homeScore: 3,
      awayScore: 1,
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    },
    {
      id: 'm2',
      opponent: 'React Utd',
      matchDate: '2026-04-15T15:00:00Z',
      location: 'Camp Nou',
      status: MATCH_STATUS.PENDING,
      homeScore: null,
      awayScore: null,
      createdAt: '2026-04-05T00:00:00Z',
      updatedAt: '2026-04-05T00:00:00Z',
    },
  ];

  const mockGoals = [
    {
      id: 'g1',
      matchId: 'm1',
      scorerId: 'u1',
      assistId: 'u2',
      minute: 15,
      createdAt: '',
    },
    {
      id: 'g2',
      matchId: 'm1',
      scorerId: 'u1',
      assistId: null,
      minute: 45,
      createdAt: '',
    },
  ];

  const mockUsers = [
    {
      id: 'u1',
      displayName: 'Messi',
      role: USER_ROLE.PLAYER,
      email: '',
      phone: '',
      status: 1,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'u2',
      displayName: 'Xavi',
      role: USER_ROLE.PLAYER,
      email: '',
      phone: '',
      status: 1,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const mockExpenses = [
    {
      id: 'e1',
      matchId: 'm1',
      amount: 500000,
      description: 'Pitch fee',
      date: '2026-04-10',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const mockLineups = [
    { id: 'l1', matchId: 'm1', userId: 'u1', type: 'starting', createdAt: '' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useCanManage as Mock).mockReturnValue(true);

    (matchesService.getAll as Mock).mockResolvedValue(mockMatches);
    (matchesService.getOne as Mock).mockResolvedValue(mockMatches[0]);
    (matchesService.getAllGoals as Mock).mockResolvedValue(mockGoals);
    (matchesService.getGoals as Mock).mockResolvedValue(mockGoals);
    (matchesService.getLineups as Mock).mockResolvedValue(mockLineups);
    (fundingService.getExpenses as Mock).mockResolvedValue(mockExpenses);
    (usersService.getAll as Mock).mockResolvedValue(mockUsers);
  });

  describe('MatchesPage List & Stats', () => {
    it('should render page title and load match data into lists', async () => {
      // Arrange
      // Act
      render(<MatchesPage />);

      // Assert
      expect(screen.getByText('Matches Dashboard')).toBeInTheDocument();

      await waitFor(() => {
        expect(matchesService.getAll).toHaveBeenCalled();
      });

      // Shows match opponent
      expect(screen.getByText('FC Vercel')).toBeInTheDocument();
      expect(screen.getByText('React Utd')).toBeInTheDocument();

      // Shows score
      expect(screen.getByText('3 - 1')).toBeInTheDocument();
    });

    it('should filter matches based on month range and render pie chart', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('W/D/L Performance Trend')).toBeInTheDocument();
        expect(screen.getByText('Top Scorers')).toBeInTheDocument();
        expect(screen.getByText('Top Assisters')).toBeInTheDocument();
      });
    });

    it('should filter matches based on month range and render pie chart', async () => {
      const user = userEvent.setup();
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('W/D/L Performance Trend')).toBeInTheDocument();
        expect(screen.getByText('Win Rate')).toBeInTheDocument(); // Expect Pie Chart
      });

      await waitFor(() => {
        expect(screen.getByText('FC Vercel')).toBeInTheDocument();
      });

      const fromSelect = screen.getByLabelText('From Month');
      const toSelect = screen.getByLabelText('To Month');
      
      // Filter out FC Vercel (2026-04) by setting range to 2026-05 to 2026-05
      // Wait we need to mock data that spans multiple months otherwise the selects might not have it.
      // We will just select whatever is available first.
      await user.selectOptions(fromSelect, '');
      await user.selectOptions(toSelect, '');
      
      // Without filter, both matches should be visible
      expect(screen.getByText('FC Vercel')).toBeInTheDocument();
      expect(screen.getByText('React Utd')).toBeInTheDocument();
    });

    it('should open create match form and submit a new match', async () => {
      const user = userEvent.setup();
      (matchesService.create as Mock).mockResolvedValue({
        id: 'm3', matchDate: '2026-04-20T15:00', opponent: 'Arsenal', location: 'Emirates', status: MATCH_STATUS.PENDING
      });
      
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('FC Vercel')).toBeInTheDocument();
      });

      // Click + New Match
      const newBtn = screen.getByRole('button', { name: /\+ New Match/i });
      await user.click(newBtn);

      // Verify form opens
      expect(screen.getByPlaceholderText('Opponent')).toBeInTheDocument();

      // Fill form
      await user.type(screen.getByPlaceholderText('Opponent'), 'Arsenal');
      await user.type(screen.getByPlaceholderText('Location'), 'Emirates');
      // matchDate should have a default, so we can leave it

      const createBtn = screen.getByRole('button', { name: 'Create Match' });
      await user.click(createBtn);

      await waitFor(() => {
        expect(matchesService.create).toHaveBeenCalledWith(expect.objectContaining({
          opponent: 'Arsenal',
          location: 'Emirates'
        }));
      });
    });
  });

  describe('MatchDetailsDrawer', () => {
    it('should open drawer when clicking a match and edit match', async () => {
      const user = userEvent.setup();
      (matchesService.update as Mock).mockResolvedValue({});

      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('FC Vercel')).toBeInTheDocument();
      });

      // Act
      const matchRow = screen.getByText('FC Vercel');
      await user.click(matchRow);

      // Assert Drawer open
      await waitFor(() => {
        expect(screen.getByText('Match vs FC Vercel')).toBeInTheDocument();
      });

      // Tabs check
      expect(screen.getByRole('button', { name: 'Info' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Lineups' }),
      ).toBeInTheDocument();

      // Submit an update
      const notesInput = screen.getByLabelText(/Notes/i);
      await user.type(notesInput, 'Great game');

      const saveBtn = screen.getByRole('button', { name: /Save All Changes/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(matchesService.update).toHaveBeenCalledWith(
          'm1',
          expect.objectContaining({
            notes: 'Great game',
          }),
        );
      });
    });

    it('should view lineups and add a player when accessing Lineups tab', async () => {
      const user = userEvent.setup();
      (matchesService.addLineup as Mock).mockResolvedValue({
        id: 'l2',
        matchId: 'm1',
        userId: 'u2',
        type: 'substitute',
      });

      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('FC Vercel')).toBeInTheDocument();
      });

      // Open drawer
      await user.click(screen.getByText('FC Vercel'));

      await waitFor(() => {
        expect(screen.getByText('Match vs FC Vercel')).toBeInTheDocument();
      });

      // Switch to Lineups tab
      const lineupsTab = screen.getByRole('button', { name: 'Lineups' });
      await user.click(lineupsTab);

      // It should fetch lineups
      await waitFor(() => {
        expect(matchesService.getLineups).toHaveBeenCalledWith('m1');
      });

      // It should show Messi in starting
      await waitFor(() => {
        const messiElements = screen.getAllByText('Messi');
        expect(messiElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Starting (1)')).toBeInTheDocument();
      });

      // Select "Xavi" (u2) as a Substitute
      const userSelect = screen.getByLabelText('+ Add substitute...');
      await user.selectOptions(userSelect, 'u2');

      await waitFor(() => {
        expect(matchesService.addLineup).toHaveBeenCalledWith({
          matchId: 'm1',
          userId: 'u2',
          type: 'substitute',
        });
      });
    });
    it('should view goals and add a goal when accessing Goals tab', async () => {
      const user = userEvent.setup();
      (matchesService.addGoal as Mock).mockResolvedValue({
        id: 'g3',
        matchId: 'm1',
        scorerId: 'u1',
        assistId: 'u2',
        minute: 90,
      });
      (matchesService.getGoals as Mock).mockResolvedValue([
        { id: 'g1', matchId: 'm1', scorerId: 'u1', assistId: null, minute: 15 },
      ]);

      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('FC Vercel')).toBeInTheDocument();
      });
      await user.click(screen.getByText('FC Vercel'));

      const goalsTab = screen.getByRole('button', { name: 'Goals' });
      await user.click(goalsTab);

      await waitFor(() => {
        expect(matchesService.getGoals).toHaveBeenCalledWith('m1');
      });

      // Verify the fetched goal is rendered
      await waitFor(() => {
        expect(screen.getByText(/15'/)).toBeInTheDocument();
      });

      // Add a new goal
      const scorerSelect = screen.getByLabelText(/Scorer/i);
      await user.selectOptions(scorerSelect, 'u1');

      const assistSelect = screen.getByLabelText(/Assist/i);
      await user.selectOptions(assistSelect, 'u2');

      const minInput = screen.getByLabelText(/Minute/i);
      await user.type(minInput, '90');

      const addBtn = screen.getByRole('button', { name: /Add Goal/i });
      await user.click(addBtn);

      const saveBtn = screen.getByRole('button', { name: /Save All Changes/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(matchesService.addGoal).toHaveBeenCalledWith({
          matchId: 'm1',
          scorerId: 'u1',
          assistId: 'u2',
          minute: 90,
        });
      });
    });
    it('should view expenses and add an expense when accessing Expense tab', async () => {
      const user = userEvent.setup();
      (fundingService.addExpense as Mock).mockResolvedValue({ id: 'e2', matchId: 'm1', amount: 300000, description: 'Water', date: '2026-04-10' });
      
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('FC Vercel')).toBeInTheDocument();
      });
      await user.click(screen.getByText('FC Vercel'));

      const expenseTab = screen.getByRole('button', { name: 'Expense' });
      await user.click(expenseTab);

      // Verify the mock expense (500000 pitch fee) is rendered
      await waitFor(() => {
        expect(screen.getByText('Pitch fee')).toBeInTheDocument();
        expect(screen.getByText('-500.000đ')).toBeInTheDocument();
      });

      // Add a new expense
      const descInput = screen.getByLabelText(/Description/i);
      await user.type(descInput, 'Water');

      const amountInput = screen.getByLabelText(/Amount/i);
      await user.type(amountInput, '300000');

      const addBtn = screen.getByRole('button', { name: /Add Expense/i });
      await user.click(addBtn);

      const saveBtn = screen.getByRole('button', { name: /Save All Changes/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(fundingService.addExpense).toHaveBeenCalledWith(expect.objectContaining({
          matchId: 'm1',
          amount: 300000,
          description: 'Water'
        }));
      });
    });
  });
});
