import { Test, TestingModule } from '@nestjs/testing';
import { PositionsService } from './positions.service';
import { FIRESTORE } from '../../config';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('PositionsService', () => {
  let service: PositionsService;
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
        PositionsService,
        { provide: FIRESTORE, useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<PositionsService>(PositionsService);
  });

  describe('findAll', () => {
    it('should return all positions', async () => {
      const mockDocs = [
        {
          id: 'pos-1',
          data: () => ({
            name: 'GK',
            description: 'Goalkeeper',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
        {
          id: 'pos-2',
          data: () => ({
            name: 'CB',
            description: 'Center Back',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];
      mockCollection.get.mockResolvedValue({ docs: mockDocs });

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('GK');
      expect(mockFirestore.collection).toHaveBeenCalledWith('positions');
    });

    it('should return empty array when no positions', async () => {
      mockCollection.get.mockResolvedValue({ docs: [] });
      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return position when found', async () => {
      const mockDoc = {
        exists: true,
        id: 'pos-1',
        data: () => ({
          name: 'GK',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockDoc),
      });

      const result = await service.findOne('pos-1');
      expect(result.name).toBe('GK');
    });

    it('should throw NotFoundException when not found', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create position with valid data', async () => {
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ empty: true }),
      });
      mockCollection.add.mockResolvedValue({ id: 'new-pos' });

      const result = await service.create({
        name: 'ST',
        description: 'Striker',
      });

      expect(result.id).toBe('new-pos');
      expect(result.name).toBe('ST');
    });

    it('should throw ConflictException when name already exists', async () => {
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ empty: false }),
      });

      await expect(service.create({ name: 'GK' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update position when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'pos-1',
          data: () => ({
            name: 'Updated',
            description: 'Updated desc',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.update('pos-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when not found', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
        update: jest.fn(),
      });

      await expect(service.update('x', { name: 'Y' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete position when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      await service.remove('pos-1');
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
