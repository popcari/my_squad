import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let app: INestApplication;
  let mockUsersService: Partial<UsersService>;
  let jwtService: JwtService;

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1d' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    jwtService = module.get<JwtService>(JwtService);

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
    it('should return 400 when phone is missing on register', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          displayName: 'Test',
          role: 'player',
          password: 'Hello123',
        });

      expect(response.status).toBe(400);
    });

    it('should return 201 with accessToken and user when registering', async () => {
      const dto = {
        email: 'test@test.com',
        displayName: 'Test',
        role: 'player',
        password: 'Hello123',
        phone: '0901234567',
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
      expect(response.body.user.id).toBe('new-id');
      expect(response.body.user.password).toBeUndefined();
      expect(typeof response.body.accessToken).toBe('string');
      const decoded = jwtService.verify<{ sub: string; role: string }>(
        response.body.accessToken,
      );
      expect(decoded.sub).toBe('new-id');
      expect(decoded.role).toBe('player');
    });

    it('should return 400 when password has no uppercase letter', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          displayName: 'Test',
          role: 'player',
          password: 'hello123',
          phone: '0901234567',
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
          phone: '0901234567',
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
          phone: '0901234567',
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
          phone: '0901234567',
        });

      expect(response.status).toBe(400);
    });

    it('should hash password before saving', async () => {
      const dto = {
        email: 'test@test.com',
        displayName: 'Test',
        role: 'player',
        password: 'Hello123',
        phone: '0901234567',
      };
      (mockUsersService.create as jest.Mock).mockResolvedValue({
        id: 'new-id',
        role: 'player',
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
    it('should return 200 with accessToken and user when credentials match', async () => {
      const hashedPassword = await bcrypt.hash('Hello123', 10);
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        displayName: 'Test',
        role: 'player',
        password: hashedPassword,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'Hello123' });

      expect(response.status).toBe(201);
      expect(response.body.user.id).toBe('user-1');
      expect(response.body.user.password).toBeUndefined();
      expect(typeof response.body.accessToken).toBe('string');
      const decoded = jwtService.verify<{ sub: string; role: string }>(
        response.body.accessToken,
      );
      expect(decoded.sub).toBe('user-1');
      expect(decoded.role).toBe('player');
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
        role: 'player',
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
