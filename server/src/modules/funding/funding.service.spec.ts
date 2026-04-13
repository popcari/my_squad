import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FIRESTORE } from '../../config';
import { FundingService } from './funding.service';
import { ContributionType } from './types';

describe('FundingService', () => {
  let service: FundingService;
  let mockRoundsCollection: any;
  let mockContributionsCollection: any;
  let mockExpensesCollection: any;
  let mockFirestore: any;

  const mockTimestamp = { toDate: () => new Date('2026-04-10') };

  beforeEach(async () => {
    mockRoundsCollection = {
      doc: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
      orderBy: jest.fn(),
    };

    mockContributionsCollection = {
      doc: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
    };

    mockExpensesCollection = {
      doc: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
      orderBy: jest.fn(),
    };

    mockFirestore = {
      collection: jest.fn((name: string) => {
        if (name === 'funding-rounds') return mockRoundsCollection;
        if (name === 'contributions') return mockContributionsCollection;
        if (name === 'expenses') return mockExpensesCollection;
        return {};
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FundingService,
        { provide: FIRESTORE, useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<FundingService>(FundingService);
  });

  // ─── ROUNDS ───────────────────────────────────────────────

  describe('findAllRounds', () => {
    it('should return all rounds ordered by createdAt desc', async () => {
      const mockDocs = [
        {
          id: 'r-1',
          data: () => ({
            name: 'Đợt 1',
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          }),
        },
        {
          id: 'r-2',
          data: () => ({
            name: 'Đợt 2',
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          }),
        },
      ];
      mockRoundsCollection.orderBy.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findAllRounds();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Đợt 1');
      expect(result[1].name).toBe('Đợt 2');
      expect(mockRoundsCollection.orderBy).toHaveBeenCalledWith(
        'createdAt',
        'desc',
      );
    });

    it('should return empty array when no rounds', async () => {
      mockRoundsCollection.orderBy.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
      });

      expect(await service.findAllRounds()).toEqual([]);
    });
  });

  describe('createRound', () => {
    it('should create a round and return it', async () => {
      mockRoundsCollection.add.mockResolvedValue({ id: 'r-new' });

      const result = await service.createRound({ name: 'Đợt 3' });

      expect(result.id).toBe('r-new');
      expect(result.name).toBe('Đợt 3');
      expect(mockRoundsCollection.add).toHaveBeenCalled();
    });
  });

  describe('updateRound', () => {
    it('should update round when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'r-1',
          data: () => ({
            name: 'Đợt 1 Updated',
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockRoundsCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.updateRound('r-1', {
        name: 'Đợt 1 Updated',
      });

      expect(result.name).toBe('Đợt 1 Updated');
      expect(mockDocRef.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when round not found', async () => {
      mockRoundsCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
        update: jest.fn(),
      });

      await expect(service.updateRound('x', { name: 'nope' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeRound', () => {
    it('should delete round and its contributions', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockRoundsCollection.doc.mockReturnValue(mockDocRef);

      // Mock contributions query for cascade delete
      const contribDocs = [
        { ref: { delete: jest.fn().mockResolvedValue(undefined) } },
      ];
      mockContributionsCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: contribDocs }),
      });

      await service.removeRound('r-1');

      expect(mockDocRef.delete).toHaveBeenCalled();
      expect(contribDocs[0].ref.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when round not found', async () => {
      mockRoundsCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });

      await expect(service.removeRound('x')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── CONTRIBUTIONS ────────────────────────────────────────

  describe('findContributions', () => {
    it('should return contributions filtered by roundId', async () => {
      const mockDocs = [
        {
          id: 'c-1',
          data: () => ({
            roundId: 'r-1',
            userId: 'u-1',
            amount: 200000,
            type: ContributionType.RECURRING,
            date: mockTimestamp,
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          }),
        },
      ];
      mockContributionsCollection.where.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: mockDocs }),
        }),
      });

      const result = await service.findContributions('r-1');

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(200000);
      expect(mockContributionsCollection.where).toHaveBeenCalledWith(
        'roundId',
        '==',
        'r-1',
      );
    });

    it('should return all contributions when no roundId', async () => {
      const mockDocs = [
        {
          id: 'c-1',
          data: () => ({
            roundId: 'r-1',
            userId: 'u-1',
            amount: 200000,
            type: ContributionType.RECURRING,
            date: mockTimestamp,
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          }),
        },
      ];
      mockContributionsCollection.orderBy.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findContributions();

      expect(result).toHaveLength(1);
      expect(mockContributionsCollection.orderBy).toHaveBeenCalledWith(
        'date',
        'desc',
      );
    });
  });

  describe('createContribution', () => {
    it('should create contribution with valid data', async () => {
      mockContributionsCollection.add.mockResolvedValue({ id: 'c-new' });

      const result = await service.createContribution({
        roundId: 'r-1',
        userId: 'u-1',
        amount: 200000,
        type: ContributionType.RECURRING,
        date: '2026-04-10T00:00:00Z',
      });

      expect(result.id).toBe('c-new');
      expect(result.amount).toBe(200000);
      expect(result.type).toBe(ContributionType.RECURRING);
    });
  });

  describe('removeContribution', () => {
    it('should delete contribution when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockContributionsCollection.doc.mockReturnValue(mockDocRef);

      await service.removeContribution('c-1');

      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockContributionsCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });

      await expect(service.removeContribution('x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── EXPENSES ─────────────────────────────────────────────

  describe('findAllExpenses', () => {
    it('should return all expenses ordered by date desc', async () => {
      const mockDocs = [
        {
          id: 'e-1',
          data: () => ({
            description: 'Thuê sân',
            amount: 500000,
            date: mockTimestamp,
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          }),
        },
      ];
      mockExpensesCollection.orderBy.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findAllExpenses();

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Thuê sân');
    });
  });

  describe('createExpense', () => {
    it('should create expense with valid data', async () => {
      mockExpensesCollection.add.mockResolvedValue({ id: 'e-new' });

      const result = await service.createExpense({
        description: 'Nước uống',
        amount: 100000,
        date: '2026-04-10T00:00:00Z',
      });

      expect(result.id).toBe('e-new');
      expect(result.description).toBe('Nước uống');
    });

    it('should create expense linked to a match', async () => {
      mockExpensesCollection.add.mockResolvedValue({ id: 'e-match' });

      const result = await service.createExpense({
        description: 'Chi phí trận đấu',
        amount: 1000000,
        date: '2026-04-10T00:00:00Z',
        matchId: 'm-1',
      });

      expect(result.id).toBe('e-match');
      expect(result.matchId).toBe('m-1');
    });
  });

  describe('updateExpense', () => {
    it('should update expense when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'e-1',
          data: () => ({
            description: 'Thuê sân updated',
            amount: 600000,
            date: mockTimestamp,
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockExpensesCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.updateExpense('e-1', {
        description: 'Thuê sân updated',
        amount: 600000,
      });

      expect(result.description).toBe('Thuê sân updated');
      expect(result.amount).toBe(600000);
    });

    it('should throw NotFoundException when not found', async () => {
      mockExpensesCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
        update: jest.fn(),
      });

      await expect(
        service.updateExpense('x', { description: 'nope' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeExpense', () => {
    it('should delete expense when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockExpensesCollection.doc.mockReturnValue(mockDocRef);

      await service.removeExpense('e-1');

      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockExpensesCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });

      await expect(service.removeExpense('x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── SUMMARY ──────────────────────────────────────────────

  describe('getSummary', () => {
    it('should calculate total income, total spent, and balance', async () => {
      const contribDocs = [
        {
          id: 'c-1',
          data: () => ({
            amount: 200000,
            type: ContributionType.RECURRING,
            date: mockTimestamp,
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          }),
        },
        {
          id: 'c-2',
          data: () => ({
            amount: 500000,
            type: ContributionType.DONATION,
            date: mockTimestamp,
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          }),
        },
      ];
      mockContributionsCollection.get.mockResolvedValue({
        docs: contribDocs,
      });

      const expenseDocs = [
        {
          id: 'e-1',
          data: () => ({
            amount: 300000,
            date: mockTimestamp,
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
          }),
        },
      ];
      mockExpensesCollection.get.mockResolvedValue({ docs: expenseDocs });

      const result = await service.getSummary();

      expect(result.totalIncome).toBe(700000);
      expect(result.totalExpense).toBe(300000);
      expect(result.balance).toBe(400000);
    });

    it('should return zeros when no data', async () => {
      mockContributionsCollection.get.mockResolvedValue({ docs: [] });
      mockExpensesCollection.get.mockResolvedValue({ docs: [] });

      const result = await service.getSummary();

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.balance).toBe(0);
    });
  });
});
