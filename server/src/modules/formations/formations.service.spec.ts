import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FIRESTORE } from '../../config';
import { FormationsService } from './formations.service';

describe('FormationsService', () => {
  let service: FormationsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockFirestore: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCollection: any;

  beforeEach(async () => {
    mockCollection = {
      doc: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
    };
    mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormationsService,
        { provide: FIRESTORE, useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<FormationsService>(FormationsService);
  });

  const sampleSlots = [
    { role: 'GK', x: 50, y: 10 },
    { role: 'LB', x: 20, y: 35 },
    { role: 'CB', x: 50, y: 30 },
    { role: 'RB', x: 80, y: 35 },
    { role: 'LM', x: 25, y: 65 },
    { role: 'RM', x: 75, y: 65 },
    { role: 'ST', x: 50, y: 88 },
  ];

  describe('findAll', () => {
    it('returns all formations', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          {
            id: 'f1',
            data: () => ({
              name: '3-2-1',
              slots: sampleSlots,
              createdAt: { toDate: () => new Date('2026-01-01') },
              updatedAt: { toDate: () => new Date('2026-01-01') },
            }),
          },
        ],
      });

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('3-2-1');
      expect(result[0].slots).toHaveLength(7);
      expect(mockFirestore.collection).toHaveBeenCalledWith('formations');
    });
  });

  describe('findOne', () => {
    it('returns formation when found', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'f1',
          data: () => ({
            name: '3-2-1',
            slots: sampleSlots,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        }),
      });

      const result = await service.findOne('f1');
      expect(result.id).toBe('f1');
    });

    it('throws NotFoundException when not found', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates formation with 7 slots', async () => {
      mockCollection.add.mockResolvedValue({ id: 'new' });
      const result = await service.create({
        name: '3-2-1',
        slots: sampleSlots,
      });
      expect(result.id).toBe('new');
      expect(result.slots).toHaveLength(7);
      expect(mockCollection.add).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates formation when exists', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'f1',
          data: () => ({
            name: '2-3-1',
            slots: sampleSlots,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.update('f1', { name: '2-3-1' });
      expect(result.name).toBe('2-3-1');
      expect(mockDocRef.update).toHaveBeenCalled();
    });

    it('throws NotFoundException when updating missing formation', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
        update: jest.fn(),
      });
      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes formation when exists', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);
      await service.remove('f1');
      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('throws NotFoundException when removing missing formation', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
        delete: jest.fn(),
      });
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
