import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FIRESTORE } from '../../config';
import { TeamUniformsService } from './team-uniforms.service';

describe('TeamUniformsService', () => {
  let service: TeamUniformsService;

  let mockFirestore: any;

  let mockCollection: any;

  beforeEach(async () => {
    mockCollection = {
      doc: jest.fn(),
      where: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
      orderBy: jest.fn().mockReturnThis(),
    };

    mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamUniformsService,
        { provide: FIRESTORE, useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<TeamUniformsService>(TeamUniformsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all uniforms', async () => {
      const mockDocs = [
        {
          id: 'uni-1',
          data: () => ({
            year: 2026,
            name: 'Home Kit',
            numberColor: '#ffffff',
            shirtColor: '#ff0000',
            pantColor: '#000000',
            createdAt: { toDate: () => new Date('2026-01-01') },
            updatedAt: { toDate: () => new Date('2026-01-01') },
          }),
        },
      ];
      mockCollection.get.mockResolvedValue({ docs: mockDocs });

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].year).toBe(2026);
      expect(result[0].shirtColor).toBe('#ff0000');
      expect(result[0].pantColor).toBe('#000000');
      expect(result[0].numberColor).toBe('#ffffff');
      expect(mockFirestore.collection).toHaveBeenCalledWith('team_uniforms');
    });

    it('should return empty array when no uniforms', async () => {
      mockCollection.get.mockResolvedValue({ docs: [] });
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findByYear', () => {
    it('should return uniforms filtered by year', async () => {
      const mockDocs = [
        {
          id: 'uni-1',
          data: () => ({
            year: 2026,
            name: 'Home Kit',
            numberColor: '#ffffff',
            shirtColor: '#ff0000',
            pantColor: '#000000',
            createdAt: { toDate: () => new Date('2026-01-01') },
            updatedAt: { toDate: () => new Date('2026-01-01') },
          }),
        },
      ];
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findByYear(2026);

      expect(result).toHaveLength(1);
      expect(result[0].year).toBe(2026);
      expect(mockCollection.where).toHaveBeenCalledWith('year', '==', 2026);
    });
  });

  describe('create', () => {
    it('should create uniform with color fields', async () => {
      const dto = {
        year: 2026,
        name: 'Home Kit',
        numberColor: '#ffffff',
        shirtColor: '#ff0000',
        pantColor: '#000000',
      };

      const mockDocRef = { id: 'uni-new' };
      mockCollection.add.mockResolvedValue(mockDocRef);

      const result = await service.create(dto);

      expect(result.id).toBe('uni-new');
      expect(result.year).toBe(2026);
      expect(result.name).toBe('Home Kit');
      expect(result.shirtColor).toBe('#ff0000');
      expect(result.pantColor).toBe('#000000');
      expect(result.numberColor).toBe('#ffffff');
      expect(mockCollection.add).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update uniform when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'uni-1',
          data: () => ({
            year: 2026,
            name: 'Home Kit Updated',
            numberColor: '#ffffff',
            shirtColor: '#00ff00',
            pantColor: '#000000',
            createdAt: { toDate: () => new Date('2026-01-01') },
            updatedAt: { toDate: () => new Date('2026-04-10') },
          }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.update('uni-1', {
        name: 'Home Kit Updated',
        shirtColor: '#00ff00',
      });

      expect(result.name).toBe('Home Kit Updated');
      expect(result.shirtColor).toBe('#00ff00');
      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Home Kit Updated',
          shirtColor: '#00ff00',
        }),
      );
    });

    it('should throw NotFoundException when updating missing uniform', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: false }),
        update: jest.fn(),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete uniform when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      await service.remove('uni-1');

      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when uniform not found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: false }),
        delete: jest.fn(),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
