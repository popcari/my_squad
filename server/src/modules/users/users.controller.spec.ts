import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MatchGoalsService } from '../match-goals/match-goals.service';
import { UploadService } from '../upload/upload.service';
import { UserPositionsService } from '../user-positions/user-positions.service';
import { UserTraitsService } from '../user-traits/user-traits.service';
import { UserRole } from './types';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let app: INestApplication;
  let mockService: Partial<UsersService>;
  let mockUserPositionsService: Partial<UserPositionsService>;
  let mockUserTraitsService: Partial<UserTraitsService>;
  let mockMatchGoalsService: Partial<MatchGoalsService>;
  let mockUploadService: Partial<UploadService>;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByRole: jest.fn().mockResolvedValue([]),
    };

    mockUserPositionsService = {
      findByUser: jest.fn().mockResolvedValue([]),
    };

    mockUserTraitsService = {
      findByUser: jest.fn().mockResolvedValue([]),
    };

    mockMatchGoalsService = {
      findByScorer: jest.fn().mockResolvedValue([]),
      findByAssist: jest.fn().mockResolvedValue([]),
    };

    mockUploadService = {
      upload: jest.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/test/avatars/123.png',
        publicId: 'avatars/123',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockService },
        { provide: UserPositionsService, useValue: mockUserPositionsService },
        { provide: UserTraitsService, useValue: mockUserTraitsService },
        { provide: MatchGoalsService, useValue: mockMatchGoalsService },
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compile();

    app = module.createNestApplication();
    app.use((req: any, _res: any, next: any) => {
      const userId = req.headers['x-user-id'];
      if (userId) {
        req.user = { id: userId };
      }
      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return 200 and empty array when no users', async () => {
      const response = await request(app.getHttpServer()).get('/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 200 and users list', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'test@test.com',
          displayName: 'Test',
          role: UserRole.PLAYER,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ];
      (mockService.findAll as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app.getHttpServer()).get('/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('GET /users/:id/profile', () => {
    it('should return 200 with aggregated profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'player@test.com',
        displayName: 'Player 1',
        role: UserRole.PLAYER,
        jerseyNumber: 10,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };
      (mockService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockUserPositionsService.findByUser as jest.Mock).mockResolvedValue([
        { id: 'up-1', userId: 'user-1', positionId: 'pos-1' },
      ]);
      (mockUserTraitsService.findByUser as jest.Mock).mockResolvedValue([
        { id: 'ut-1', userId: 'user-1', traitId: 't-1', rating: 85 },
      ]);
      (mockMatchGoalsService.findByScorer as jest.Mock).mockResolvedValue([
        { id: 'g-1' },
        { id: 'g-2' },
      ]);
      (mockMatchGoalsService.findByAssist as jest.Mock).mockResolvedValue([
        { id: 'g-3' },
      ]);

      const response = await request(app.getHttpServer()).get(
        '/users/user-1/profile',
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('user-1');
      expect(response.body.positions).toHaveLength(1);
      expect(response.body.traits).toHaveLength(1);
      expect(response.body.stats.goals).toBe(2);
      expect(response.body.stats.assists).toBe(1);
    });
  });

  describe('GET /users/:id', () => {
    it('should return 200 and user when found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        displayName: 'Test',
        role: UserRole.PLAYER,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };
      (mockService.findOne as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer()).get('/users/user-1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('user-1');
    });
  });

  describe('GET /users/role/:role', () => {
    it('should return 200 and users filtered by role', async () => {
      const mockPlayers = [
        {
          id: 'p-1',
          email: 'player@test.com',
          displayName: 'Player',
          role: UserRole.PLAYER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (mockService.findByRole as jest.Mock).mockResolvedValue(mockPlayers);

      const response = await request(app.getHttpServer()).get(
        '/users/role/player',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(mockService.findByRole).toHaveBeenCalledWith(UserRole.PLAYER);
    });
  });

  describe('POST /users', () => {
    it('should return 201 when creating user with valid data', async () => {
      const dto = {
        email: 'new@test.com',
        displayName: 'New User',
        role: 'player',
      };
      const createdUser = {
        id: 'new-id',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockService.create as jest.Mock).mockResolvedValue(createdUser);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(dto);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('new-id');
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ displayName: 'No Email', role: 'player' });

      expect(response.status).toBe(400);
    });

    it('should return 400 when role is invalid', async () => {
      const response = await request(app.getHttpServer()).post('/users').send({
        email: 'test@test.com',
        displayName: 'Bad Role',
        role: 'admin',
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when jerseyNumber is out of range', async () => {
      const response = await request(app.getHttpServer()).post('/users').send({
        email: 'test@test.com',
        displayName: 'Test',
        role: 'player',
        jerseyNumber: 100,
      });

      expect(response.status).toBe(400);
    });

    it('should return 201 when creating user with jerseyNumber', async () => {
      const dto = {
        email: 'player@test.com',
        displayName: 'Player',
        role: 'player',
        jerseyNumber: 10,
      };
      const created = {
        id: 'p-1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockService.create as jest.Mock).mockResolvedValue(created);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(dto);

      expect(response.status).toBe(201);
      expect(response.body.jerseyNumber).toBe(10);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should return 200 when updating user', async () => {
      const updatedUser = {
        id: 'user-1',
        email: 'test@test.com',
        displayName: 'Updated',
        role: UserRole.PLAYER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockService.update as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .patch('/users/user-1')
        .send({ displayName: 'Updated' });

      expect(response.status).toBe(200);
      expect(response.body.displayName).toBe('Updated');
    });

    it('should return 400 when updating with invalid role', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/user-1')
        .send({ role: 'admin' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should return 200 when deleting user', async () => {
      (mockService.remove as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app.getHttpServer()).delete(
        '/users/user-1',
      );

      expect(response.status).toBe(200);
    });
  });

  describe('POST /users/:id/avatar', () => {
    it('should upload avatar and update user', async () => {
      const updatedUser = {
        id: 'user-1',
        email: 'test@test.com',
        displayName: 'Test',
        role: UserRole.PLAYER,
        avatar: 'https://res.cloudinary.com/test/avatars/123.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockService.update as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .post('/users/user-1/avatar')
        .attach('avatar', Buffer.from('fake-image'), 'avatar.png');

      expect(response.status).toBe(201);
      expect(mockUploadService.upload).toHaveBeenCalledWith(
        expect.objectContaining({ originalname: 'avatar.png' }),
        'avatars',
      );
      expect(mockService.update).toHaveBeenCalledWith('user-1', {
        avatar: 'https://res.cloudinary.com/test/avatars/123.png',
      });
      expect(response.body.avatar).toBe(
        'https://res.cloudinary.com/test/avatars/123.png',
      );
    });

    it('should return 400 when no file is provided', async () => {
      const response = await request(app.getHttpServer()).post(
        '/users/user-1/avatar',
      );

      expect(response.status).toBe(400);
    });

    it('should return 403 when player tries to upload another player avatar', async () => {
      (mockService.findOne as jest.Mock).mockResolvedValue({
        id: 'requester',
        role: UserRole.PLAYER,
      });

      const response = await request(app.getHttpServer())
        .post('/users/other-user/avatar')
        .set('X-User-Id', 'requester')
        .attach('avatar', Buffer.from('fake-image'), 'avatar.png');

      expect(response.status).toBe(403);
      expect(mockUploadService.upload).not.toHaveBeenCalled();
    });

    it('should allow player to upload their own avatar', async () => {
      const updatedUser = {
        id: 'user-1',
        avatar: 'https://res.cloudinary.com/test/avatars/123.png',
      };
      (mockService.update as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .post('/users/user-1/avatar')
        .set('X-User-Id', 'user-1')
        .attach('avatar', Buffer.from('fake-image'), 'avatar.png');

      expect(response.status).toBe(201);
      expect(mockUploadService.upload).toHaveBeenCalled();
    });

    it('should return 403 when coach tries to upload another player avatar', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/other-user/avatar')
        .set('X-User-Id', 'coach-1')
        .attach('avatar', Buffer.from('fake-image'), 'avatar.png');

      expect(response.status).toBe(403);
      expect(mockUploadService.upload).not.toHaveBeenCalled();
    });

    it('should return 400 when uploading non-image file', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/user-1/avatar')
        .set('X-User-Id', 'user-1')
        .attach('avatar', Buffer.from('fake-doc'), {
          filename: 'file.xlsx',
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

      expect(response.status).toBe(400);
      expect(mockUploadService.upload).not.toHaveBeenCalled();
    });

    it('should return 400 when uploading .docx file', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/user-1/avatar')
        .set('X-User-Id', 'user-1')
        .attach('avatar', Buffer.from('fake-doc'), {
          filename: 'report.docx',
          contentType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

      expect(response.status).toBe(400);
      expect(mockUploadService.upload).not.toHaveBeenCalled();
    });
  });
});
