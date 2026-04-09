import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FIRESTORE } from '../../config';
import { MatchesService } from './matches.service';
import { MatchStatus } from './types';

describe('MatchesService', () => {
  let service: MatchesService;
  let mockCollection: any;
  let mockFirestore: any;

  beforeEach(async () => {
    mockCollection = {
      doc: jest.fn(),
      where: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
      orderBy: jest.fn(),
    };

    mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: FIRESTORE, useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  describe('findAll', () => {
    it('should return all matches ordered by matchDate', async () => {
      const mockDocs = [
        {
          id: 'm-1',
          data: () => ({
            opponent: 'Team A',
            matchDate: { toDate: () => new Date('2026-04-15') },
            location: 'Stadium X',
            status: MatchStatus.SCHEDULED,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];
      mockCollection.orderBy.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].opponent).toBe('Team A');
      expect(mockCollection.orderBy).toHaveBeenCalledWith('matchDate', 'asc');
    });

    it('should return empty array when no matches', async () => {
      mockCollection.orderBy.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
      });
      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return match when found', async () => {
      const mockDoc = {
        exists: true,
        id: 'm-1',
        data: () => ({
          opponent: 'Team A',
          matchDate: { toDate: () => new Date('2026-04-15') },
          location: 'Stadium X',
          status: MatchStatus.SCHEDULED,
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockDoc),
      });

      const result = await service.findOne('m-1');
      expect(result.opponent).toBe('Team A');
    });

    it('should throw NotFoundException when not found', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByMonth', () => {
    it('should return matches within the given month', async () => {
      const mockDocs = [
        {
          id: 'm-1',
          data: () => ({
            opponent: 'April Team',
            matchDate: { toDate: () => new Date('2026-04-15') },
            location: 'Stadium',
            status: MatchStatus.SCHEDULED,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];

      const whereChain = {
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ docs: mockDocs }),
          }),
        }),
      };
      mockCollection.where.mockReturnValue(whereChain);

      const result = await service.findByMonth(2026, 4);

      expect(result).toHaveLength(1);
      expect(result[0].opponent).toBe('April Team');
    });

    it('should return empty array when no matches in month', async () => {
      const whereChain = {
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ docs: [] }),
          }),
        }),
      };
      mockCollection.where.mockReturnValue(whereChain);

      const result = await service.findByMonth(2026, 1);
      expect(result).toEqual([]);
    });
  });

  describe('findUpcoming', () => {
    it('should return only scheduled matches from now', async () => {
      const mockDocs = [
        {
          id: 'm-1',
          data: () => ({
            opponent: 'Future Team',
            matchDate: { toDate: () => new Date('2026-12-01') },
            location: 'Stadium',
            status: MatchStatus.SCHEDULED,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findUpcoming();

      expect(result).toHaveLength(1);
      expect(result[0].opponent).toBe('Future Team');
    });
  });

  describe('create', () => {
    it('should create match with valid data', async () => {
      mockCollection.add.mockResolvedValue({ id: 'new-m' });

      const result = await service.create({
        opponent: 'Team B',
        matchDate: '2026-05-01T15:00:00Z',
        location: 'Stadium Y',
      });

      expect(result.id).toBe('new-m');
      expect(result.opponent).toBe('Team B');
      expect(result.status).toBe(MatchStatus.SCHEDULED);
    });
  });

  describe('update', () => {
    it('should update match when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'm-1',
          data: () => ({
            opponent: 'Team A',
            matchDate: { toDate: () => new Date('2026-04-15') },
            location: 'Stadium X',
            status: MatchStatus.COMPLETED,
            homeScore: 3,
            awayScore: 1,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.update('m-1', {
        status: MatchStatus.COMPLETED,
        homeScore: 3,
        awayScore: 1,
      });

      expect(result.status).toBe(MatchStatus.COMPLETED);
      expect(result.homeScore).toBe(3);
    });

    it('should throw NotFoundException when not found', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
        update: jest.fn(),
      });
      await expect(service.update('x', { opponent: 'Y' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete match when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      await service.remove('m-1');
      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });
      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });
  });
});
