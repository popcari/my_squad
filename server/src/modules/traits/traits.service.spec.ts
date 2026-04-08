import { Test, TestingModule } from '@nestjs/testing';
import { TraitsService } from './traits.service';
import { FIRESTORE } from '../../config';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('TraitsService', () => {
  let service: TraitsService;
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
        TraitsService,
        { provide: FIRESTORE, useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<TraitsService>(TraitsService);
  });

  describe('findAll', () => {
    it('should return all traits', async () => {
      const mockDocs = [
        {
          id: 't-1',
          data: () => ({
            name: 'Speed',
            description: 'Running speed',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];
      mockCollection.get.mockResolvedValue({ docs: mockDocs });

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Speed');
    });

    it('should return empty array when no traits', async () => {
      mockCollection.get.mockResolvedValue({ docs: [] });
      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return trait when found', async () => {
      const mockDoc = {
        exists: true,
        id: 't-1',
        data: () => ({
          name: 'Speed',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockDoc),
      });

      const result = await service.findOne('t-1');
      expect(result.name).toBe('Speed');
    });

    it('should throw NotFoundException when not found', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create trait with valid data', async () => {
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ empty: true }),
      });
      mockCollection.add.mockResolvedValue({ id: 'new-t' });

      const result = await service.create({
        name: 'Stamina',
        description: 'Endurance level',
      });
      expect(result.id).toBe('new-t');
      expect(result.name).toBe('Stamina');
    });

    it('should throw ConflictException when name exists', async () => {
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ empty: false }),
      });
      await expect(service.create({ name: 'Speed' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update trait when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 't-1',
          data: () => ({
            name: 'Updated',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.update('t-1', { name: 'Updated' });
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
    it('should delete trait when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      await service.remove('t-1');
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
