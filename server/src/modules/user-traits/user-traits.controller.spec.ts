import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserRole } from '../users/types';
import { UserTraitsController } from './user-traits.controller';
import { UserTraitsService } from './user-traits.service';

describe('UserTraitsController', () => {
  let app: INestApplication;
  let mockService: Partial<UserTraitsService>;

  beforeEach(async () => {
    mockService = {
      findByUser: jest.fn().mockResolvedValue([]),
      assign: jest.fn(),
      updateRating: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserTraitsController],
      providers: [{ provide: UserTraitsService, useValue: mockService }],
    }).compile();

    app = module.createNestApplication();

    app.use((req: any, _res: any, next: any) => {
      req.user = { id: 'admin-1', role: UserRole.PRESIDENT };
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

  it('GET /user-traits/:userId returns list', async () => {
    (mockService.findByUser as jest.Mock).mockResolvedValue([{ id: 'ut1' }]);
    const res = await request(app.getHttpServer()).get('/user-traits/u1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(mockService.findByUser).toHaveBeenCalledWith('u1');
  });

  it('POST /user-traits assigns with valid half-step rating', async () => {
    (mockService.assign as jest.Mock).mockResolvedValue({ id: 'new' });
    const res = await request(app.getHttpServer())
      .post('/user-traits')
      .send({ userId: 'u1', traitId: 't1', rating: 3.5 });
    expect(res.status).toBe(201);
  });

  it('POST /user-traits accepts integer rating in 1-5 range', async () => {
    (mockService.assign as jest.Mock).mockResolvedValue({ id: 'new' });
    const res = await request(app.getHttpServer())
      .post('/user-traits')
      .send({ userId: 'u1', traitId: 't1', rating: 5 });
    expect(res.status).toBe(201);
  });

  it('POST /user-traits rejects non-half-step rating (3.7)', async () => {
    const res = await request(app.getHttpServer())
      .post('/user-traits')
      .send({ userId: 'u1', traitId: 't1', rating: 3.7 });
    expect(res.status).toBe(400);
  });

  it('POST /user-traits rejects rating below 1 (0.5)', async () => {
    const res = await request(app.getHttpServer())
      .post('/user-traits')
      .send({ userId: 'u1', traitId: 't1', rating: 0.5 });
    expect(res.status).toBe(400);
  });

  it('POST /user-traits rejects rating above 5 (5.5)', async () => {
    const res = await request(app.getHttpServer())
      .post('/user-traits')
      .send({ userId: 'u1', traitId: 't1', rating: 5.5 });
    expect(res.status).toBe(400);
  });

  it('PATCH /user-traits/:id updates with half-step rating', async () => {
    (mockService.updateRating as jest.Mock).mockResolvedValue({ id: 'ut1' });
    const res = await request(app.getHttpServer())
      .patch('/user-traits/ut1')
      .send({ rating: 4.5 });
    expect(res.status).toBe(200);
    expect(mockService.updateRating).toHaveBeenCalledWith('ut1', {
      rating: 4.5,
    });
  });

  it('PATCH /user-traits/:id rejects non-half-step rating', async () => {
    const res = await request(app.getHttpServer())
      .patch('/user-traits/ut1')
      .send({ rating: 4.2 });
    expect(res.status).toBe(400);
  });

  it('DELETE /user-traits/:id removes', async () => {
    const res = await request(app.getHttpServer()).delete('/user-traits/ut1');
    expect(res.status).toBe(200);
    expect(mockService.remove).toHaveBeenCalledWith('ut1');
  });
});
