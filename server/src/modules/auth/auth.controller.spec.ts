import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let app: INestApplication;
  let mockUsersService: Partial<UsersService>;

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    app = module.createNestApplication();
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

  describe('POST /auth/register', () => {
    it('should return 201 when registering with valid password', async () => {
      const dto = {
        email: 'test@test.com',
        displayName: 'Test',
        role: 'player',
        password: 'Hello123',
      };
      (mockUsersService.create as jest.Mock).mockResolvedValue({
        id: 'new-id',
        email: dto.email,
        displayName: dto.displayName,
        role: dto.role,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('new-id');
      // Password should not be in response
      expect(response.body.password).toBeUndefined();
    });

    it('should return 400 when password has no uppercase letter', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          displayName: 'Test',
          role: 'player',
          password: 'hello123',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when password has no number', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          displayName: 'Test',
          role: 'player',
          password: 'HelloWorld',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when password exceeds 32 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          displayName: 'Test',
          role: 'player',
          password: 'A1' + 'a'.repeat(31),
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          displayName: 'Test',
          role: 'player',
        });

      expect(response.status).toBe(400);
    });

    it('should hash password before saving', async () => {
      const dto = {
        email: 'test@test.com',
        displayName: 'Test',
        role: 'player',
        password: 'Hello123',
      };
      (mockUsersService.create as jest.Mock).mockResolvedValue({
        id: 'new-id',
      });

      await request(app.getHttpServer()).post('/auth/register').send(dto);

      const createCall = (mockUsersService.create as jest.Mock).mock.calls[0];
      const savedPassword = createCall[0].password;
      // Should be hashed, not plain text
      expect(savedPassword).not.toBe('Hello123');
      expect(await bcrypt.compare('Hello123', savedPassword)).toBe(true);
    });
  });

  describe('POST /auth/login', () => {
    it('should return 200 when email and password match', async () => {
      const hashedPassword = await bcrypt.hash('Hello123', 10);
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        displayName: 'Test',
        password: hashedPassword,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'Hello123' });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('user-1');
      // Password should not be in response
      expect(response.body.password).toBeUndefined();
    });

    it('should return 401 when user not found', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@test.com', password: 'Hello123' });

      expect(response.status).toBe(401);
    });

    it('should return 401 when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('Hello123', 10);
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        password: hashedPassword,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'WrongPass1' });

      expect(response.status).toBe(401);
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com' });

      expect(response.status).toBe(400);
    });
  });
});
