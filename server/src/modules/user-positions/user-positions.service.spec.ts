import { Test, TestingModule } from '@nestjs/testing';
import { UserPositionsService } from './user-positions.service';
import { FIRESTORE } from '../../config';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UserPositionsService', () => {
  let service: UserPositionsService;
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
        UserPositionsService,
        { provide: FIRESTORE, useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<UserPositionsService>(UserPositionsService);
  });

  describe('findByUser', () => {
    it('should return positions for a user', async () => {
      const mockDocs = [
        {
          id: 'up-1',
          data: () => ({
            userId: 'user-1',
            positionId: 'pos-1',
            createdAt: { toDate: () => new Date() },
          }),
        },
      ];
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findByUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].positionId).toBe('pos-1');
      expect(mockCollection.where).toHaveBeenCalledWith(
        'userId',
        '==',
        'user-1',
      );
    });

    it('should return empty array when user has no positions', async () => {
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
      });

      expect(await service.findByUser('user-1')).toEqual([]);
    });
  });

  describe('assign', () => {
    it('should assign position to user', async () => {
      // No existing assignment
      const whereChain = {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: true }),
        }),
      };
      mockCollection.where.mockReturnValue(whereChain);
      mockCollection.add.mockResolvedValue({ id: 'new-up' });

      const result = await service.assign({
        userId: 'user-1',
        positionId: 'pos-1',
      });

      expect(result.id).toBe('new-up');
      expect(result.userId).toBe('user-1');
      expect(result.positionId).toBe('pos-1');
    });

    it('should throw ConflictException when already assigned', async () => {
      const whereChain = {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: false }),
        }),
      };
      mockCollection.where.mockReturnValue(whereChain);

      await expect(
        service.assign({ userId: 'user-1', positionId: 'pos-1' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove assignment when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      await service.remove('up-1');
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
