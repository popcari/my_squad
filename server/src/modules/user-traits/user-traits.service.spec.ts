import { Test, TestingModule } from '@nestjs/testing';
import { UserTraitsService } from './user-traits.service';
import { FIRESTORE } from '../../config';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UserTraitsService', () => {
  let service: UserTraitsService;
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
        UserTraitsService,
        { provide: FIRESTORE, useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<UserTraitsService>(UserTraitsService);
  });

  describe('findByUser', () => {
    it('should return traits with ratings for a user', async () => {
      const mockDocs = [
        {
          id: 'ut-1',
          data: () => ({
            userId: 'user-1',
            traitId: 'trait-speed',
            rating: 85,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
        {
          id: 'ut-2',
          data: () => ({
            userId: 'user-1',
            traitId: 'trait-stamina',
            rating: 70,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findByUser('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].rating).toBe(85);
      expect(result[1].rating).toBe(70);
    });

    it('should return empty array when user has no traits', async () => {
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
      });
      expect(await service.findByUser('user-1')).toEqual([]);
    });
  });

  describe('assign', () => {
    it('should assign trait with rating to user', async () => {
      const whereChain = {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: true }),
        }),
      };
      mockCollection.where.mockReturnValue(whereChain);
      mockCollection.add.mockResolvedValue({ id: 'new-ut' });

      const result = await service.assign({
        userId: 'user-1',
        traitId: 'trait-speed',
        rating: 90,
      });

      expect(result.id).toBe('new-ut');
      expect(result.rating).toBe(90);
    });

    it('should throw ConflictException when trait already assigned', async () => {
      const whereChain = {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: false }),
        }),
      };
      mockCollection.where.mockReturnValue(whereChain);

      await expect(
        service.assign({
          userId: 'user-1',
          traitId: 'trait-speed',
          rating: 80,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateRating', () => {
    it('should update rating when assignment exists', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'ut-1',
          data: () => ({
            userId: 'user-1',
            traitId: 'trait-speed',
            rating: 95,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.updateRating('ut-1', { rating: 95 });

      expect(result.rating).toBe(95);
      expect(mockDocRef.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
        update: jest.fn(),
      });

      await expect(service.updateRating('x', { rating: 50 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove trait assignment', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      await service.remove('ut-1');
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
