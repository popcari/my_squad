import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/contexts/confirm-context', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
vi.mock('@/hooks/use-can-manage', () => ({
  useCanManage: () => true,
}));

const mockGetAll = vi.fn();
const mockCreate = vi.fn();
const mockRemove = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/services/formations.service', () => ({
  formationsService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  },
}));

import FormationsPage from './page';

const sampleSlots = [
  { role: 'GK', x: 50, y: 10 },
  { role: 'LB', x: 20, y: 35 },
  { role: 'CB', x: 50, y: 30 },
  { role: 'RB', x: 80, y: 35 },
  { role: 'LM', x: 25, y: 65 },
  { role: 'RM', x: 75, y: 65 },
  { role: 'ST', x: 50, y: 88 },
];

describe('FormationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of formations', async () => {
    mockGetAll.mockResolvedValue([
      {
        id: 'f1',
        name: '3-2-1',
        slots: sampleSlots,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'f2',
        name: '2-3-1',
        slots: sampleSlots,
        createdAt: '',
        updatedAt: '',
      },
    ]);

    render(<FormationsPage />);

    expect(await screen.findByText('3-2-1')).toBeInTheDocument();
    expect(screen.getByText('2-3-1')).toBeInTheDocument();
  });

  it('shows empty state when no formations', async () => {
    mockGetAll.mockResolvedValue([]);
    render(<FormationsPage />);
    expect(await screen.findByText(/no formations/i)).toBeInTheDocument();
  });

  it('opens drawer to create a new formation', async () => {
    const user = userEvent.setup();
    mockGetAll.mockResolvedValue([]);
    render(<FormationsPage />);
    await screen.findByText(/no formations/i);

    await user.click(screen.getByRole('button', { name: /add formation/i }));

    const dialog = screen.getByRole('dialog', { name: /add formation/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^Name/)).toBeInTheDocument();
  });

  it('opens edit drawer with formation pre-filled', async () => {
    const user = userEvent.setup();
    mockGetAll.mockResolvedValue([
      {
        id: 'f1',
        name: '3-2-1',
        slots: sampleSlots,
        createdAt: '',
        updatedAt: '',
      },
    ]);
    render(<FormationsPage />);
    await screen.findByText('3-2-1');

    await user.click(screen.getByRole('button', { name: /edit 3-2-1/i }));

    const dialog = screen.getByRole('dialog', { name: /edit formation/i });
    const nameInput = within(dialog).getByLabelText(
      /^Name/,
    ) as HTMLInputElement;
    expect(nameInput.value).toBe('3-2-1');
  });
});
