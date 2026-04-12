import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ScoreModal } from './score-modal';
import { matchesService, usersService, positionsService, userPositionsService } from '@/services';
import { MATCH_STATUS } from '@/constant/enum';

const mockConfirm = vi.fn().mockResolvedValue(true);

vi.mock('@/contexts/confirm-context', () => ({
  useConfirm: () => mockConfirm,
}));

vi.mock('@/services', () => ({
  matchesService: {
    getGoals: vi.fn(),
    getLineups: vi.fn(),
    update: vi.fn().mockResolvedValue({}),
    removeLineup: vi.fn().mockResolvedValue({}),
    removeGoal: vi.fn().mockResolvedValue({}),
    addLineup: vi.fn().mockResolvedValue({}),
    addGoal: vi.fn().mockResolvedValue({}),
  },
  usersService: {
    getAll: vi.fn(),
  },
  positionsService: {
    getAll: vi.fn(),
  },
  userPositionsService: {
    getByUser: vi.fn(),
  },
}));

describe('ScoreModal Save Goals', () => {
  const match = {
    id: 'm1',
    opponent: 'Team B',
    matchDate: '2026-04-10T10:00:00.000Z',
    location: 'Stadium',
    status: MATCH_STATUS.PENDING,
    createdAt: '2026-04-10T10:00:00.000Z',
    updatedAt: '2026-04-10T10:00:00.000Z',
  };

  const mockPlayers = [
    { id: 'u1', displayName: 'Player 1', jerseyNumber: 9, email: 'p1@ex.com', phone: '111', role: 'player', status: 1, createdAt: '', updatedAt: '' },
    { id: 'u2', displayName: 'Player 2', jerseyNumber: 10, email: 'p2@ex.com', phone: '222', role: 'player', status: 1, createdAt: '', updatedAt: '' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (usersService.getAll as any).mockResolvedValue(mockPlayers);
    (positionsService.getAll as any).mockResolvedValue([]);
    (userPositionsService.getByUser as any).mockResolvedValue([]);
    (matchesService.getGoals as any).mockResolvedValue([]);
    (matchesService.getLineups as any).mockResolvedValue([]);
    // After save, getLineups & getGoals are called again for cleanup
    (matchesService.getLineups as any).mockResolvedValue([]);
    (matchesService.getGoals as any).mockResolvedValue([]);
  });

  it('should save goal with scorer and assist even when minute is empty', async () => {
    const onSaved = vi.fn();
    render(
      <ScoreModal
        match={match}
        teamName="My Team"
        canManage={true}
        onClose={vi.fn()}
        onSaved={onSaved}
      />
    );

    // Wait for load to finish
    await waitFor(() => {
      expect(screen.getByText('Goals')).toBeInTheDocument();
    });

    // Set home score = 1 → auto-generates 1 goal form row
    const scoreInputs = screen.getAllByRole('spinbutton');
    const homeScoreInput = scoreInputs[0]; // first number input = home score
    await userEvent.clear(homeScoreInput);
    await userEvent.type(homeScoreInput, '1');

    // Wait for goal row to appear
    await waitFor(() => {
      expect(screen.getByText('Goal #1')).toBeInTheDocument();
    });

    // Now find the scorer dropdown (option text = "Scorer *")
    // The goal row has 2 selects (Scorer, Assist) and 1 number input (Min)
    const allSelects = screen.getAllByRole('combobox');
    // Find the select that contains the "Scorer *" option
    const scorerSelect = allSelects.find(sel => {
      const options = sel.querySelectorAll('option');
      return Array.from(options).some(opt => opt.textContent?.includes('Scorer'));
    });
    expect(scorerSelect).toBeTruthy();
    await userEvent.selectOptions(scorerSelect!, 'u1');

    // Assist select
    const assistSelect = allSelects.find(sel => {
      const options = sel.querySelectorAll('option');
      return Array.from(options).some(opt => opt.textContent?.includes('Assist'));
    });
    expect(assistSelect).toBeTruthy();
    await userEvent.selectOptions(assistSelect!, 'u2');

    // DO NOT fill in the minute field — leave it empty

    // Click Save
    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    await userEvent.click(saveButton);

    // Verify addGoal was called with the scorer, assist, and minute=undefined
    await waitFor(() => {
      expect(matchesService.addGoal).toHaveBeenCalledWith({
        matchId: 'm1',
        scorerId: 'u1',
        assistId: 'u2',
        minute: null,
      });
    });
  });

  it('should save goal with minute when minute is provided', async () => {
    render(
      <ScoreModal
        match={match}
        teamName="My Team"
        canManage={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Goals')).toBeInTheDocument();
    });

    // Set home score = 1
    const scoreInputs = screen.getAllByRole('spinbutton');
    await userEvent.clear(scoreInputs[0]);
    await userEvent.type(scoreInputs[0], '1');

    await waitFor(() => {
      expect(screen.getByText('Goal #1')).toBeInTheDocument();
    });

    // Select scorer
    const allSelects = screen.getAllByRole('combobox');
    const scorerSelect = allSelects.find(sel =>
      Array.from(sel.querySelectorAll('option')).some(opt => opt.textContent?.includes('Scorer'))
    );
    await userEvent.selectOptions(scorerSelect!, 'u1');

    // Fill in minute
    // After setting home score, re-query spin buttons — the minute input is the new one
    const allSpinButtons = screen.getAllByRole('spinbutton');
    // The minute input is the last spinbutton (homeScore, awayScore, minute)
    const minuteInput = allSpinButtons[allSpinButtons.length - 1];
    await userEvent.clear(minuteInput);
    await userEvent.type(minuteInput, '45');

    // Save
    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(matchesService.addGoal).toHaveBeenCalledWith({
        matchId: 'm1',
        scorerId: 'u1',
        assistId: undefined,
        minute: 45,
      });
    });
  });
});
