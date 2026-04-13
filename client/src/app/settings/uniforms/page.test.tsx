import '@/i18n';
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
const mockUpdate = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/services/uniforms.service', () => ({
  uniformsService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  },
}));

import UniformsPage from './page';

const mockUniform = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'u1',
  year: 2026,
  name: 'Home Kit 2026',
  numberColor: '#ffffff',
  shirtColor: '#ff0000',
  pantColor: '#000000',
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('UniformsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render uniforms grouped by year', async () => {
    mockGetAll.mockResolvedValue([
      mockUniform({ id: 'u1', year: 2026, name: 'Home Kit 2026' }),
      mockUniform({ id: 'u2', year: 2026, name: 'Away Kit 2026' }),
      mockUniform({ id: 'u3', year: 2025, name: 'Home Kit 2025' }),
    ]);

    render(<UniformsPage />);

    expect(await screen.findByText('Home Kit 2026')).toBeInTheDocument();
    expect(screen.getByText('Away Kit 2026')).toBeInTheDocument();
    expect(screen.getByText('Home Kit 2025')).toBeInTheDocument();
    expect(screen.getByText('Season 2026')).toBeInTheDocument();
    expect(screen.getByText('Season 2025')).toBeInTheDocument();
  });

  it('should show empty state when no uniforms', async () => {
    mockGetAll.mockResolvedValue([]);
    render(<UniformsPage />);
    expect(await screen.findByText(/no uniforms/i)).toBeInTheDocument();
  });

  it('should open Add drawer with color pickers when Add Uniform clicked', async () => {
    const user = userEvent.setup();
    mockGetAll.mockResolvedValue([]);

    render(<UniformsPage />);
    await screen.findByText(/no uniforms/i);

    await user.click(screen.getByRole('button', { name: /add uniform/i }));

    const dialog = screen.getByRole('dialog', { name: /add uniform/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^Year/)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^Name/)).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Shirt color')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Pant color')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Number color')).toBeInTheDocument();
  });

  it('should open Edit drawer pre-filled when edit icon clicked', async () => {
    const user = userEvent.setup();
    mockGetAll.mockResolvedValue([
      mockUniform({ id: 'u1', year: 2026, name: 'Home Kit 2026' }),
    ]);

    render(<UniformsPage />);
    await screen.findByText('Home Kit 2026');

    const editBtn = screen.getByRole('button', {
      name: /edit home kit 2026/i,
    });
    await user.click(editBtn);

    const dialog = screen.getByRole('dialog', { name: /edit uniform/i });
    expect(dialog).toBeInTheDocument();

    const nameInput = within(dialog).getByLabelText(/^Name/) as HTMLInputElement;
    const yearInput = within(dialog).getByLabelText(/^Year/) as HTMLInputElement;
    expect(nameInput.value).toBe('Home Kit 2026');
    expect(yearInput.value).toBe('2026');
  });

  it('should call update service when edit form is submitted', async () => {
    const user = userEvent.setup();
    mockGetAll.mockResolvedValue([
      mockUniform({ id: 'u1', year: 2026, name: 'Home Kit 2026' }),
    ]);
    mockUpdate.mockResolvedValue(mockUniform({ name: 'Renamed' }));

    render(<UniformsPage />);
    await screen.findByText('Home Kit 2026');

    await user.click(
      screen.getByRole('button', { name: /edit home kit 2026/i }),
    );

    const dialog = screen.getByRole('dialog', { name: /edit uniform/i });
    const nameInput = within(dialog).getByLabelText(/^Name/);
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed');

    await user.click(
      within(dialog).getByRole('button', { name: /save changes/i }),
    );

    expect(mockUpdate).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ name: 'Renamed' }),
    );
  });
});
