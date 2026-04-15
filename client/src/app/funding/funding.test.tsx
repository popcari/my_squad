import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FundingPage from './page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/funding',
}));

// Mock services
const mockGetSummary = vi.fn();
const mockGetRounds = vi.fn();
const mockGetContributions = vi.fn();
const mockGetExpenses = vi.fn();

vi.mock('@/services/funding.service', () => ({
  fundingService: {
    getSummary: (...args: unknown[]) => mockGetSummary(...args),
    getRounds: (...args: unknown[]) => mockGetRounds(...args),
    getContributions: (...args: unknown[]) => mockGetContributions(...args),
    getExpenses: (...args: unknown[]) => mockGetExpenses(...args),
    createRound: vi.fn(),
    updateRound: vi.fn(),
    removeRound: vi.fn(),
    addContribution: vi.fn(),
    removeContribution: vi.fn(),
    addExpense: vi.fn(),
    updateExpense: vi.fn(),
    removeExpense: vi.fn(),
  },
}));

vi.mock('@/services', () => ({
  matchesService: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  usersService: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  positionsService: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  userPositionsService: {
    getByUser: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/hooks/use-can-manage', () => ({
  useCanManage: () => true,
}));

vi.mock('@/contexts/confirm-context', () => ({
  useConfirm: () => () => Promise.resolve(true),
}));

const mockSummary = {
  totalIncome: 2000000,
  totalExpense: 500000,
  balance: 1500000,
};

const mockRounds = [
  {
    id: 'r-1',
    name: 'Đợt 1 - Tháng 3',
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'r-2',
    name: 'Đợt 2 - Tháng 4',
    createdAt: '2026-04-01',
    updatedAt: '2026-04-01',
  },
];

const mockExpenses = [
  {
    id: 'e-1',
    description: 'Thuê sân',
    amount: 500000,
    date: '2026-04-10',
    createdAt: '2026-04-10',
    updatedAt: '2026-04-10',
  },
];

describe('FundingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSummary.mockResolvedValue(mockSummary);
    mockGetRounds.mockResolvedValue(mockRounds);
    mockGetContributions.mockResolvedValue([]);
    mockGetExpenses.mockResolvedValue(mockExpenses);
  });

  it('should render the page title', async () => {
    render(<FundingPage />);
    const titles = await screen.findAllByText('Funding');
    expect(titles[0]).toBeInTheDocument();
  });

  it('should render summary cards with formatted VND amounts', async () => {
    render(<FundingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('summary-income')).toHaveTextContent(
        '2.000.000đ',
      );
      expect(screen.getByTestId('summary-expense')).toHaveTextContent(
        '500.000đ',
      );
      expect(screen.getByTestId('summary-balance')).toHaveTextContent(
        '1.500.000đ',
      );
    });
  });

  it('should render the list of funding rounds', async () => {
    render(<FundingPage />);

    await waitFor(() => {
      expect(screen.getByText('Đợt 1 - Tháng 3')).toBeInTheDocument();
      expect(screen.getByText('Đợt 2 - Tháng 4')).toBeInTheDocument();
    });
  });

  it('should render expenses list', async () => {
    render(<FundingPage />);

    await waitFor(() => {
      expect(screen.getByText('Thuê sân')).toBeInTheDocument();
    });
  });

  it('should show create round button for managers', async () => {
    render(<FundingPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Create Round' }),
      ).toBeInTheDocument();
    });
  });
});
