import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FIRESTORE } from '../../config';
import { UserPositionsService } from './user-positions.service';

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
    it('should assign position with type to user', async () => {
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
        type: 'primary',
      });

      expect(result.id).toBe('new-up');
      expect(result.userId).toBe('user-1');
      expect(result.positionId).toBe('pos-1');
      expect(result.type).toBe('primary');
    });

    it('should assign sub position', async () => {
      const whereChain = {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: true }),
        }),
      };
      mockCollection.where.mockReturnValue(whereChain);
      mockCollection.add.mockResolvedValue({ id: 'new-up-2' });

      const result = await service.assign({
        userId: 'user-1',
        positionId: 'pos-2',
        type: 'sub',
      });

      expect(result.type).toBe('sub');
    });

    it('should throw ConflictException when position already assigned', async () => {
      const whereChain = {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: false }),
        }),
      };
      mockCollection.where.mockReturnValue(whereChain);

      await expect(
        service.assign({ userId: 'user-1', positionId: 'pos-1', type: 'sub' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when assigning second primary position', async () => {
      let callCount = 0;
      mockCollection.where.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: duplicate check (userId == user-1) -> chains to positionId check
          return {
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({ empty: true }), // no duplicate
            }),
          };
        }
        // Second call: primary check (userId == user-1) -> chains to type check
        return {
          where: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ empty: false }), // already has primary
          }),
        };
      });

      await expect(
        service.assign({
          userId: 'user-1',
          positionId: 'pos-2',
          type: 'primary',
        }),
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
