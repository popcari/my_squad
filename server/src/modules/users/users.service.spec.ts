import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FIRESTORE } from '../../config';
import { UserRole } from './types';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockFirestore: any;
  let mockCollection: any;

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
        UsersService,
        { provide: FIRESTORE, useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users when collection has data', async () => {
      // Arrange
      const mockDocs = [
        {
          id: 'user-1',
          data: () => ({
            email: 'president@test.com',
            displayName: 'Boss',
            role: UserRole.PRESIDENT,
            createdAt: { toDate: () => new Date('2026-01-01') },
            updatedAt: { toDate: () => new Date('2026-01-01') },
          }),
        },
        {
          id: 'user-2',
          data: () => ({
            email: 'coach@test.com',
            displayName: 'Coach',
            role: UserRole.COACH,
            createdAt: { toDate: () => new Date('2026-01-01') },
            updatedAt: { toDate: () => new Date('2026-01-01') },
          }),
        },
      ];
      mockCollection.get.mockResolvedValue({ docs: mockDocs });

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user-1');
      expect(result[0].role).toBe(UserRole.PRESIDENT);
      expect(result[1].role).toBe(UserRole.COACH);
      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
    });

    it('should return empty array when no users exist', async () => {
      mockCollection.get.mockResolvedValue({ docs: [] });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return user when found by id', async () => {
      const mockDoc = {
        exists: true,
        id: 'user-1',
        data: () => ({
          email: 'player@test.com',
          displayName: 'Player 1',
          role: UserRole.PLAYER,
          createdAt: { toDate: () => new Date('2026-01-01') },
          updatedAt: { toDate: () => new Date('2026-01-01') },
        }),
      };
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockDoc),
      });

      const result = await service.findOne('user-1');

      expect(result.id).toBe('user-1');
      expect(result.role).toBe(UserRole.PLAYER);
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockDoc = { exists: false };
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockDoc),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create user with valid data', async () => {
      const dto = {
        email: 'new@test.com',
        displayName: 'New User',
        role: UserRole.PLAYER,
      };

      // No existing user with same email
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ empty: true }),
      });

      const mockDocRef = { id: 'new-id' };
      mockCollection.add.mockResolvedValue(mockDocRef);

      const result = await service.create(dto);

      expect(result.id).toBe('new-id');
      expect(result.email).toBe('new@test.com');
      expect(result.role).toBe(UserRole.PLAYER);
      expect(mockCollection.add).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      const dto = {
        email: 'existing@test.com',
        displayName: 'Duplicate',
        role: UserRole.COACH,
      };

      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ empty: false }),
      });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update user when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'user-1',
          data: () => ({
            email: 'old@test.com',
            displayName: 'Updated Name',
            role: UserRole.PLAYER,
            createdAt: { toDate: () => new Date('2026-01-01') },
            updatedAt: { toDate: () => new Date('2026-04-08') },
          }),
        }),
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      const result = await service.update('user-1', {
        displayName: 'Updated Name',
      });

      expect(result.displayName).toBe('Updated Name');
      expect(mockDocRef.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating nonexistent user', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: false }),
        update: jest.fn(),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      await expect(
        service.update('nonexistent', { displayName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete user when found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({ exists: true }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      mockCollection.doc.mockReturnValue(mockDocRef);

      await service.remove('user-1');

      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when deleting nonexistent user', async () => {
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

  describe('findByRole', () => {
    it('should return users filtered by role', async () => {
      const mockDocs = [
        {
          id: 'player-1',
          data: () => ({
            email: 'p1@test.com',
            displayName: 'Player 1',
            role: UserRole.PLAYER,
            createdAt: { toDate: () => new Date('2026-01-01') },
            updatedAt: { toDate: () => new Date('2026-01-01') },
          }),
        },
      ];
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      });

      const result = await service.findByRole(UserRole.PLAYER);

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe(UserRole.PLAYER);
      expect(mockCollection.where).toHaveBeenCalledWith(
        'role',
        '==',
        UserRole.PLAYER,
      );
    });

    it('should return empty array when no users with given role', async () => {
      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
      });

      const result = await service.findByRole(UserRole.PRESIDENT);

      expect(result).toEqual([]);
    });
  });
});
