import { describe, expect, it, vi } from 'vitest';

// Mock the api module
vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from './api';
import { fundingService } from './funding.service';

describe('fundingService', () => {
  // ─── ROUNDS ─────────────────────────────────────────────

  describe('getRounds', () => {
    it('should call GET /funding/rounds', async () => {
      const mockData = [{ id: 'r-1', name: 'Đợt 1' }];
      vi.mocked(api.get).mockResolvedValue(mockData);

      const result = await fundingService.getRounds();

      expect(api.get).toHaveBeenCalledWith('/funding/rounds');
      expect(result).toEqual(mockData);
    });
  });

  describe('createRound', () => {
    it('should call POST /funding/rounds', async () => {
      const data = { name: 'Đợt 2' };
      vi.mocked(api.post).mockResolvedValue({ id: 'r-new', ...data });

      const result = await fundingService.createRound(data);

      expect(api.post).toHaveBeenCalledWith('/funding/rounds', data);
      expect(result.id).toBe('r-new');
    });
  });

  describe('updateRound', () => {
    it('should call PATCH /funding/rounds/:id', async () => {
      const data = { name: 'Đợt 1 Updated' };
      vi.mocked(api.patch).mockResolvedValue({ id: 'r-1', ...data });

      const result = await fundingService.updateRound('r-1', data);

      expect(api.patch).toHaveBeenCalledWith('/funding/rounds/r-1', data);
      expect(result.name).toBe('Đợt 1 Updated');
    });
  });

  describe('removeRound', () => {
    it('should call DELETE /funding/rounds/:id', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      await fundingService.removeRound('r-1');

      expect(api.delete).toHaveBeenCalledWith('/funding/rounds/r-1');
    });
  });

  // ─── CONTRIBUTIONS ────────────────────────────────────────

  describe('getContributions', () => {
    it('should call GET /funding/contributions with roundId', async () => {
      const mockData = [{ id: 'c-1', amount: 200000 }];
      vi.mocked(api.get).mockResolvedValue(mockData);

      const result = await fundingService.getContributions('r-1');

      expect(api.get).toHaveBeenCalledWith(
        '/funding/contributions?roundId=r-1',
      );
      expect(result).toEqual(mockData);
    });

    it('should call GET /funding/contributions without roundId', async () => {
      vi.mocked(api.get).mockResolvedValue([]);

      await fundingService.getContributions();

      expect(api.get).toHaveBeenCalledWith('/funding/contributions');
    });
  });

  describe('addContribution', () => {
    it('should call POST /funding/contributions', async () => {
      const data = {
        roundId: 'r-1',
        userId: 'u-1',
        amount: 200000,
        type: 'recurring' as const,
        date: '2026-04-10',
      };
      vi.mocked(api.post).mockResolvedValue({ id: 'c-new', ...data });

      const result = await fundingService.addContribution(data);

      expect(api.post).toHaveBeenCalledWith('/funding/contributions', data);
      expect(result.id).toBe('c-new');
    });
  });

  describe('removeContribution', () => {
    it('should call DELETE /funding/contributions/:id', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      await fundingService.removeContribution('c-1');

      expect(api.delete).toHaveBeenCalledWith('/funding/contributions/c-1');
    });
  });

  // ─── EXPENSES ─────────────────────────────────────────────

  describe('getExpenses', () => {
    it('should call GET /funding/expenses', async () => {
      const mockData = [{ id: 'e-1', description: 'Thuê sân' }];
      vi.mocked(api.get).mockResolvedValue(mockData);

      const result = await fundingService.getExpenses();

      expect(api.get).toHaveBeenCalledWith('/funding/expenses');
      expect(result).toEqual(mockData);
    });
  });

  describe('addExpense', () => {
    it('should call POST /funding/expenses', async () => {
      const data = {
        description: 'Nước',
        amount: 100000,
        date: '2026-04-10',
      };
      vi.mocked(api.post).mockResolvedValue({ id: 'e-new', ...data });

      const result = await fundingService.addExpense(data);

      expect(api.post).toHaveBeenCalledWith('/funding/expenses', data);
      expect(result.id).toBe('e-new');
    });
  });

  describe('updateExpense', () => {
    it('should call PATCH /funding/expenses/:id', async () => {
      const data = { amount: 150000 };
      vi.mocked(api.patch).mockResolvedValue({ id: 'e-1', ...data });

      const result = await fundingService.updateExpense('e-1', data);

      expect(api.patch).toHaveBeenCalledWith('/funding/expenses/e-1', data);
      expect(result.amount).toBe(150000);
    });
  });

  describe('removeExpense', () => {
    it('should call DELETE /funding/expenses/:id', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      await fundingService.removeExpense('e-1');

      expect(api.delete).toHaveBeenCalledWith('/funding/expenses/e-1');
    });
  });

  // ─── SUMMARY ──────────────────────────────────────────────

  describe('getSummary', () => {
    it('should call GET /funding/summary', async () => {
      const mockData = {
        totalIncome: 700000,
        totalExpense: 300000,
        balance: 400000,
      };
      vi.mocked(api.get).mockResolvedValue(mockData);

      const result = await fundingService.getSummary();

      expect(api.get).toHaveBeenCalledWith('/funding/summary');
      expect(result).toEqual(mockData);
    });
  });
});
