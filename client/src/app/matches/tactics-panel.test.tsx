import type { MatchLineup, User } from '@/types';
import type { Formation } from '@/types/formation';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TacticsPanel } from './tactics-panel';

const sampleFormation: Formation = {
  id: 'f1',
  name: '3-2-1',
  slots: [
    { role: 'GK', x: 50, y: 10 },
    { role: 'LB', x: 20, y: 35 },
    { role: 'CB', x: 50, y: 30 },
    { role: 'RB', x: 80, y: 35 },
    { role: 'LM', x: 25, y: 65 },
    { role: 'RM', x: 75, y: 65 },
    { role: 'ST', x: 50, y: 88 },
  ],
  createdAt: '',
  updatedAt: '',
};

const mockPlayer = (over: Partial<User> = {}): User => ({
  id: 'u1',
  email: 'p@x.com',
  displayName: 'Player 1',
  role: 'player',
  phone: '0',
  jerseyNumber: 9,
  status: 1,
  createdAt: '',
  updatedAt: '',
  ...over,
});

const mockLineup = (over: Partial<MatchLineup> = {}): MatchLineup => ({
  id: 'l1',
  matchId: 'm1',
  userId: 'u1',
  type: 'starting',
  createdAt: '',
  ...over,
});

interface RenderOpts {
  players?: User[];
  lineups?: MatchLineup[];
  canManage?: boolean;
}

function renderPanel(opts: RenderOpts = {}) {
  const onAddLineup = vi.fn().mockResolvedValue(undefined);
  const onRemoveLineup = vi.fn().mockResolvedValue(undefined);
  const onFormationChange = vi.fn();

  const utils = render(
    <TacticsPanel
      loading={false}
      players={opts.players ?? []}
      lineups={opts.lineups ?? []}
      formations={[sampleFormation]}
      selectedFormationId="f1"
      onFormationChange={onFormationChange}
      canManage={opts.canManage ?? true}
      onAddLineup={onAddLineup}
      onRemoveLineup={onRemoveLineup}
    />,
  );
  return { onAddLineup, onRemoveLineup, onFormationChange, ...utils };
}

describe('TacticsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 7 formation slots with role labels when empty', () => {
    renderPanel({ players: [] });
    for (const role of ['GK', 'LB', 'CB', 'RB', 'LM', 'RM', 'ST']) {
      expect(
        screen.getByRole('button', { name: new RegExp(role) }),
      ).toBeInTheDocument();
    }
  });

  it('renders empty bench message when no players', () => {
    renderPanel();
    expect(screen.getByText(/no bench players/i)).toBeInTheDocument();
  });

  it('shows formation empty-state when formations list is empty', () => {
    render(
      <TacticsPanel
        loading={false}
        players={[]}
        lineups={[]}
        formations={[]}
        selectedFormationId=""
        onFormationChange={vi.fn()}
        canManage
        onAddLineup={vi.fn()}
        onRemoveLineup={vi.fn()}
      />,
    );
    expect(screen.getByText(/no formations available/i)).toBeInTheDocument();
  });

  it('lists bench players', () => {
    renderPanel({
      players: [
        mockPlayer({ id: 'u1', displayName: 'Messi', jerseyNumber: 10 }),
        mockPlayer({ id: 'u2', displayName: 'Xavi', jerseyNumber: 6 }),
      ],
    });
    expect(screen.getByText('Messi')).toBeInTheDocument();
    expect(screen.getByText('Xavi')).toBeInTheDocument();
  });

  it('opens assign modal when tapping empty slot', async () => {
    const user = userEvent.setup();
    renderPanel({
      players: [
        mockPlayer({ id: 'u1', displayName: 'Messi', jerseyNumber: 10 }),
      ],
    });

    await user.click(
      screen.getByRole('button', { name: /assign player to GK/i }),
    );

    const dialog = screen.getByRole('dialog', {
      name: /assign player to gk/i,
    });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Messi')).toBeInTheDocument();
  });

  it('calls onAddLineup(starting) when tapping a bench player from modal', async () => {
    const user = userEvent.setup();
    const { onAddLineup } = renderPanel({
      players: [
        mockPlayer({ id: 'u1', displayName: 'Messi', jerseyNumber: 10 }),
      ],
    });

    await user.click(
      screen.getByRole('button', { name: /assign player to GK/i }),
    );
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Messi/i }));

    expect(onAddLineup).toHaveBeenCalledWith('u1', 'starting');
  });

  it('shows starting player on slot and offers move-to-bench in modal', async () => {
    const user = userEvent.setup();
    const { onAddLineup, onRemoveLineup } = renderPanel({
      players: [
        mockPlayer({ id: 'u1', displayName: 'Messi', jerseyNumber: 10 }),
      ],
      lineups: [mockLineup({ id: 'l1', userId: 'u1', type: 'starting' })],
    });

    // The first slot (GK) now shows Messi
    await user.click(screen.getByRole('button', { name: /GK.*Messi|Messi/i }));

    const dialog = screen.getByRole('dialog');
    const moveBtn = within(dialog).getByRole('button', {
      name: /move to bench/i,
    });
    await user.click(moveBtn);

    expect(onRemoveLineup).toHaveBeenCalledWith('l1');
    expect(onAddLineup).toHaveBeenCalledWith('u1', 'substitute');
  });

  it('does not open modal when canManage is false', async () => {
    const user = userEvent.setup();
    renderPanel({
      canManage: false,
      players: [mockPlayer()],
    });

    await user.click(screen.getByRole('button', { name: /GK/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes modal when backdrop or × button clicked', async () => {
    const user = userEvent.setup();
    renderPanel({
      players: [
        mockPlayer({ id: 'u1', displayName: 'Messi', jerseyNumber: 10 }),
      ],
    });

    await user.click(
      screen.getByRole('button', { name: /assign player to GK/i }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('removes substitute via × button on bench chip', async () => {
    const user = userEvent.setup();
    const { onRemoveLineup } = renderPanel({
      players: [
        mockPlayer({ id: 'u1', displayName: 'Messi', jerseyNumber: 10 }),
      ],
      lineups: [mockLineup({ id: 'sub-1', userId: 'u1', type: 'substitute' })],
    });

    // Bench chip should show Messi as substitute with × button
    const removeBtn = screen.getByRole('button', {
      name: /remove substitute messi/i,
    });
    await user.click(removeBtn);
    expect(onRemoveLineup).toHaveBeenCalledWith('sub-1');
  });

  it('assigning bench substitute to empty slot removes sub lineup first then adds starting', async () => {
    const user = userEvent.setup();
    const { onAddLineup, onRemoveLineup } = renderPanel({
      players: [
        mockPlayer({ id: 'u1', displayName: 'Messi', jerseyNumber: 10 }),
      ],
      lineups: [mockLineup({ id: 'sub-1', userId: 'u1', type: 'substitute' })],
    });

    await user.click(
      screen.getByRole('button', { name: /assign player to GK/i }),
    );
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Messi/i }));

    expect(onRemoveLineup).toHaveBeenCalledWith('sub-1');
    expect(onAddLineup).toHaveBeenCalledWith('u1', 'starting');
  });
});
