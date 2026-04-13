import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ContributionChart } from './contribution-chart';

// recharts needs mocking in JSDOM
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: '800px', height: '400px' }}>{children}</div>
    ),
  };
});

// ---- helpers ----
const makePlayer = (id: string, name: string) => ({
  id,
  email: `${id}@x.com`,
  displayName: name,
  role: 'player' as const,
  phone: '0',
  jerseyNumber: 1,
  status: 1,
  createdAt: '',
  updatedAt: '',
});

const makeContrib = (userId: string, amount: number, id = userId) => ({
  id,
  roundId: 'r1',
  userId,
  amount,
  type: 'recurring' as const,
  createdAt: '',
});

const round = { id: 'r1', name: 'Round 1', createdAt: '', updatedAt: '' };

// 8 players, sorted descending by amount
const players = [
  makePlayer('p1', 'Alpha'),
  makePlayer('p2', 'Beta'),
  makePlayer('p3', 'Gamma'),
  makePlayer('p4', 'Delta'),
  makePlayer('p5', 'Epsilon'),
  makePlayer('p6', 'Zeta'),
  makePlayer('p7', 'Eta'),
  makePlayer('p8', 'Theta'),
];

const contributions = [
  makeContrib('p1', 800),
  makeContrib('p2', 700),
  makeContrib('p3', 600),
  makeContrib('p4', 500),
  makeContrib('p5', 400),
  makeContrib('p6', 300),
  makeContrib('p7', 200),
  makeContrib('p8', 100),
];

describe('ContributionChart — Ranking', () => {
  it('shows only the top 5 players by default', () => {
    render(
      <ContributionChart
        contributions={contributions}
        rounds={[round]}
        players={players}
      />,
    );

    // Top 5 MUST be in DOM
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.getByText('Delta')).toBeInTheDocument();
    expect(screen.getByText('Epsilon')).toBeInTheDocument();

    // Players 6-8 must NOT appear in DOM when collapsed
    expect(screen.queryByText('Zeta')).not.toBeInTheDocument();
    expect(screen.queryByText('Eta')).not.toBeInTheDocument();
    expect(screen.queryByText('Theta')).not.toBeInTheDocument();
  });

  it('shows "Show more" button when there are more than 5 players', () => {
    render(
      <ContributionChart
        contributions={contributions}
        rounds={[round]}
        players={players}
      />,
    );
    expect(
      screen.getByRole('button', { name: /show.*more/i }),
    ).toBeInTheDocument();
  });

  it('does NOT show "Show more" button when 5 or fewer players', () => {
    render(
      <ContributionChart
        contributions={contributions.slice(0, 5)}
        rounds={[round]}
        players={players}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /show.*more/i }),
    ).not.toBeInTheDocument();
  });

  it('expands to show all players when "Show more" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ContributionChart
        contributions={contributions}
        rounds={[round]}
        players={players}
      />,
    );

    await user.click(screen.getByRole('button', { name: /show.*more/i }));

    // After expanding, "Show less" button appears
    expect(
      screen.getByRole('button', { name: /show less/i }),
    ).toBeInTheDocument();

    // All 8 players must be in DOM after expand
    expect(screen.getByText('Zeta')).toBeInTheDocument();
    expect(screen.getByText('Eta')).toBeInTheDocument();
    expect(screen.getByText('Theta')).toBeInTheDocument();
  });

  it('collapses back when "Show less" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ContributionChart
        contributions={contributions}
        rounds={[round]}
        players={players}
      />,
    );

    await user.click(screen.getByRole('button', { name: /show.*more/i }));
    await user.click(screen.getByRole('button', { name: /show less/i }));

    expect(
      screen.getByRole('button', { name: /show.*more/i }),
    ).toBeInTheDocument();
  });

  it('renders 🥇 medal for rank 1', () => {
    render(
      <ContributionChart
        contributions={contributions}
        rounds={[round]}
        players={players}
      />,
    );
    expect(screen.getByLabelText('Rank 1')).toHaveTextContent('🥇');
  });

  it('renders 🥈 medal for rank 2', () => {
    render(
      <ContributionChart
        contributions={contributions}
        rounds={[round]}
        players={players}
      />,
    );
    expect(screen.getByLabelText('Rank 2')).toHaveTextContent('🥈');
  });

  it('renders 🥉 medal for rank 3', () => {
    render(
      <ContributionChart
        contributions={contributions}
        rounds={[round]}
        players={players}
      />,
    );
    expect(screen.getByLabelText('Rank 3')).toHaveTextContent('🥉');
  });

  it('renders numeric badge for rank 4+', () => {
    render(
      <ContributionChart
        contributions={contributions}
        rounds={[round]}
        players={players}
      />,
    );
    expect(screen.getByLabelText('Rank 4')).toHaveTextContent('4');
  });
});
