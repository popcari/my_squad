import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FIRESTORE } from '../../config';
import { MatchLineupsService } from './match-lineups.service';
import { LineupType } from './types';

describe('MatchLineupsService', () => {
  let service: MatchLineupsService;
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
        MatchLineupsService,
        { provide: FIRESTORE, useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<MatchLineupsService>(MatchLineupsService);
  });

  describe('findAll', () => {
    it('returns every lineup across all matches', async () => {
      const mockDocs = [
        {
          id: 'l-1',
          data: () => ({
            matchId: 'm-1',
            userId: 'u-1',
            type: LineupType.STARTING,
            createdAt: { toDate: () => new Date() },
          }),
        },
        {
          id: 'l-2',
          data: () => ({
            matchId: 'm-2',
            userId: 'u-2',
            type: LineupType.SUBSTITUTE,
            createdAt: { toDate: () => new Date() },
          }),
        },
      ];
      mockCollection.get.mockResolvedValue({ docs: mockDocs });

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.matchId).sort()).toEqual(['m-1', 'm-2']);
    });

    it('returns empty array when no lineups exist', async () => {
      mockCollection.get.mockResolvedValue({ docs: [] });
      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findByMatch', () => {
    it('should return lineups grouped for a match', async () => {
      const mockDocs = [
        {
          id: 'l-1',
          data: () => ({
            matchId: 'm-1',
            userId: 'u-1',
            type: LineupType.STARTING,
            createdAt: { toDate: () => new Date() },
          }),
        },
        {
          id: 'l-2',
          data: () => ({
            matchId: 'm-1',
            userId: 'u-2',
            type: LineupType.SUBSTITUTE,
            createdAt: { toDate: () => new Date() },
          }),
        },
      ];
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findByMatch('m-1');

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe(LineupType.STARTING);
      expect(result[1].type).toBe(LineupType.SUBSTITUTE);
    });

    it('should return empty array when no lineups', async () => {
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
      });
      expect(await service.findByMatch('m-1')).toEqual([]);
    });
  });

  describe('add', () => {
    it('should add player to lineup', async () => {
      const whereChain = {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: true }),
        }),
      };
      mockCollection.where.mockReturnValue(whereChain);
      mockCollection.add.mockResolvedValue({ id: 'new-l' });

      const result = await service.add({
        matchId: 'm-1',
        userId: 'u-1',
        type: LineupType.STARTING,
      });

      expect(result.id).toBe('new-l');
      expect(result.type).toBe(LineupType.STARTING);
    });

    it('should throw ConflictException when player already in lineup', async () => {
      const whereChain = {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: false }),
        }),
      };
      mockCollection.where.mockReturnValue(whereChain);

      await expect(
        service.add({
          matchId: 'm-1',
          userId: 'u-1',
          type: LineupType.STARTING,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('add with slotIndex', () => {
    it('persists slotIndex when provided', async () => {
      const whereChain = {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: true }),
        }),
      };
      mockCollection.where.mockReturnValue(whereChain);
      mockCollection.add.mockResolvedValue({ id: 'new-l' });

      const result = await service.add({
        matchId: 'm-1',
        userId: 'u-1',
        type: LineupType.STARTING,
        slotIndex: 3,
      });

      expect(result.slotIndex).toBe(3);
      const addedData = mockCollection.add.mock.calls[0][0];
      expect(addedData.slotIndex).toBe(3);
    });
  });

  describe('update', () => {
    it('updates slotIndex of an existing lineup', async () => {
      const docRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'l-1',
          data: () => ({
            matchId: 'm-1',
            userId: 'u-1',
            type: LineupType.STARTING,
            slotIndex: 5,
            createdAt: { toDate: () => new Date() },
          }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(docRef);

      const result = await service.update('l-1', { slotIndex: 5 });
      expect(result.slotIndex).toBe(5);
      expect(docRef.update).toHaveBeenCalledWith(
        expect.objectContaining({ slotIndex: 5 }),
      );
    });

    it('updates type and slotIndex together', async () => {
      const docRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'l-1',
          data: () => ({
            matchId: 'm-1',
            userId: 'u-1',
            type: LineupType.SUBSTITUTE,
            slotIndex: null,
            createdAt: { toDate: () => new Date() },
          }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(docRef);

      const result = await service.update('l-1', {
        type: LineupType.SUBSTITUTE,
        slotIndex: null,
      });
      expect(result.type).toBe(LineupType.SUBSTITUTE);
      expect(result.slotIndex).toBeNull();
    });

    it('throws NotFoundException when updating missing lineup', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });
      await expect(service.update('missing', { slotIndex: 2 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove lineup entry', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      await service.remove('l-1');
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
