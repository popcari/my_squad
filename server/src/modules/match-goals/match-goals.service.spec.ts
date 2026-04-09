import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FIRESTORE } from '../../config';
import { MatchGoalsService } from './match-goals.service';

describe('MatchGoalsService', () => {
  let service: MatchGoalsService;
  let mockCollection: any;
  let mockFirestore: any;

  beforeEach(async () => {
    mockCollection = {
      doc: jest.fn(),
      where: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
    };

    mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchGoalsService,
        { provide: FIRESTORE, useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<MatchGoalsService>(MatchGoalsService);
  });

  describe('findByMatch', () => {
    it('should return goals for a match', async () => {
      const mockDocs = [
        {
          id: 'g-1',
          data: () => ({
            matchId: 'm-1',
            scorerId: 'u-1',
            assistId: 'u-2',
            minute: 23,
            createdAt: { toDate: () => new Date() },
          }),
        },
        {
          id: 'g-2',
          data: () => ({
            matchId: 'm-1',
            scorerId: 'u-3',
            minute: 67,
            createdAt: { toDate: () => new Date() },
          }),
        },
      ];
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findByMatch('m-1');

      expect(result).toHaveLength(2);
      expect(result[0].scorerId).toBe('u-1');
      expect(result[0].minute).toBe(23);
      expect(result[1].assistId).toBeUndefined();
    });

    it('should return empty array when no goals', async () => {
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
      });
      expect(await service.findByMatch('m-1')).toEqual([]);
    });
  });

  describe('findByScorer', () => {
    it('should return all goals by a player', async () => {
      const mockDocs = [
        {
          id: 'g-1',
          data: () => ({
            matchId: 'm-1',
            scorerId: 'u-1',
            minute: 10,
            createdAt: { toDate: () => new Date() },
          }),
        },
      ];
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findByScorer('u-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findByAssist', () => {
    it('should return all goals where player assisted', async () => {
      const mockDocs = [
        {
          id: 'g-1',
          data: () => ({
            matchId: 'm-1',
            scorerId: 'u-3',
            assistId: 'u-2',
            minute: 55,
            createdAt: { toDate: () => new Date() },
          }),
        },
      ];
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findByAssist('u-2');
      expect(result).toHaveLength(1);
      expect(result[0].assistId).toBe('u-2');
    });
  });

  describe('add', () => {
    it('should add goal with scorer and assist', async () => {
      mockCollection.add.mockResolvedValue({ id: 'new-g' });

      const result = await service.add({
        matchId: 'm-1',
        scorerId: 'u-1',
        assistId: 'u-2',
        minute: 45,
      });

      expect(result.id).toBe('new-g');
      expect(result.scorerId).toBe('u-1');
      expect(result.assistId).toBe('u-2');
      expect(result.minute).toBe(45);
    });

    it('should add goal without assist', async () => {
      mockCollection.add.mockResolvedValue({ id: 'new-g' });

      const result = await service.add({
        matchId: 'm-1',
        scorerId: 'u-1',
        minute: 90,
      });

      expect(result.id).toBe('new-g');
      expect(result.assistId).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should delete goal when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      await service.remove('g-1');
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
