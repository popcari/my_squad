import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { EmailService } from './email.service';

describe('AuthController', () => {
  let app: INestApplication;
  let mockUsersService: Partial<UsersService>;

  let mockEmailService: { sendPasswordReset: jest.Mock };

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    mockEmailService = {
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    app = module.createNestApplication();

    app.use((req: any, _res: any, next: any) => {
      const userId = req.headers['x-user-id'];
      if (userId) req.user = { id: userId, role: 'player' };
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

    it('should return 201 when registering with valid password', async () => {
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

  describe('POST /auth/change-password', () => {
    const setupUser = async (currentPw = 'OldPass1') => {
      const hashed = await bcrypt.hash(currentPw, 10);
      (mockUsersService.findOne as jest.Mock).mockResolvedValue({
        id: 'u-1',
        email: 'test@test.com',
        password: hashed,
      });
    };

    it('returns 401 when user is not authenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/change-password')
        .send({ currentPassword: 'OldPass1', newPassword: 'NewPass1' });
      expect(res.status).toBe(401);
    });

    it('returns 401 when current password does not match', async () => {
      await setupUser();
      const res = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('x-user-id', 'u-1')
        .send({ currentPassword: 'WrongOld1', newPassword: 'NewPass1' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when new password is weak (no uppercase)', async () => {
      await setupUser();
      const res = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('x-user-id', 'u-1')
        .send({ currentPassword: 'OldPass1', newPassword: 'weakpw1' });
      expect(res.status).toBe(400);
    });

    it('hashes new password and updates the user on success', async () => {
      await setupUser();
      (mockUsersService.update as jest.Mock).mockResolvedValue({ id: 'u-1' });

      const res = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('x-user-id', 'u-1')
        .send({ currentPassword: 'OldPass1', newPassword: 'NewPass1' });

      expect(res.status).toBe(201);
      const updateCall = (mockUsersService.update as jest.Mock).mock.calls[0];
      expect(updateCall[0]).toBe('u-1');
      const savedHash = updateCall[1].password;
      expect(savedHash).not.toBe('NewPass1');
      expect(await bcrypt.compare('NewPass1', savedHash)).toBe(true);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('returns 200 with a generic message when email is unknown (no leak)', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nobody@test.com' });
      expect(res.status).toBe(201);
      expect(mockEmailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('generates a random password, saves its bcrypt hash, and emails the plain text', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue({
        id: 'u-1',
        email: 'a@b.com',
        displayName: 'Alpha',
      });
      (mockUsersService.update as jest.Mock).mockResolvedValue({ id: 'u-1' });

      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'a@b.com' });

      expect(res.status).toBe(201);

      const updateCall = (mockUsersService.update as jest.Mock).mock.calls[0];
      expect(updateCall[0]).toBe('u-1');
      expect(typeof updateCall[1].password).toBe('string');
      expect(updateCall[1].password).toMatch(/^\$2[ab]\$/);

      expect(mockEmailService.sendPasswordReset).toHaveBeenCalledTimes(1);
      const emailArg = (mockEmailService.sendPasswordReset as jest.Mock).mock
        .calls[0][0];
      expect(emailArg.to).toBe('a@b.com');
      expect(emailArg.name).toBe('Alpha');

      const plainPw: string = emailArg.tempPassword;
      expect(typeof plainPw).toBe('string');
      // Must contain at least 1 uppercase and 1 digit
      expect(plainPw).toMatch(/[A-Z]/);
      expect(plainPw).toMatch(/\d/);
      // The plain password must bcrypt-match the hash saved
      expect(await bcrypt.compare(plainPw, updateCall[1].password)).toBe(true);
    });

    it('generates different random passwords on repeated calls', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue({
        id: 'u-1',
        email: 'a@b.com',
        displayName: 'Alpha',
      });
      (mockUsersService.update as jest.Mock).mockResolvedValue({ id: 'u-1' });

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'a@b.com' });
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'a@b.com' });

      const pw1 = (mockEmailService.sendPasswordReset as jest.Mock).mock
        .calls[0][0].tempPassword;
      const pw2 = (mockEmailService.sendPasswordReset as jest.Mock).mock
        .calls[1][0].tempPassword;
      expect(pw1).not.toBe(pw2);
    });
  });
});
