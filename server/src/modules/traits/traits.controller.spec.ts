import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserRole } from '../users/types';
import { TraitsController } from './traits.controller';
import { TraitsService } from './traits.service';

describe('TraitsController', () => {
  let app: INestApplication;
  let mockService: Partial<TraitsService>;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TraitsController],
      providers: [{ provide: TraitsService, useValue: mockService }],
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

  it('GET /traits returns list', async () => {
    (mockService.findAll as jest.Mock).mockResolvedValue([{ id: 't1' }]);
    const res = await request(app.getHttpServer()).get('/traits');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('GET /traits/:id returns one', async () => {
    (mockService.findOne as jest.Mock).mockResolvedValue({ id: 't1' });
    const res = await request(app.getHttpServer()).get('/traits/t1');
    expect(res.status).toBe(200);
    expect(mockService.findOne).toHaveBeenCalledWith('t1');
  });

  it('POST /traits creates', async () => {
    (mockService.create as jest.Mock).mockResolvedValue({ id: 'new' });
    const res = await request(app.getHttpServer())
      .post('/traits')
      .send({ name: 'Speed' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('new');
  });

  it('PATCH /traits/:id updates', async () => {
    (mockService.update as jest.Mock).mockResolvedValue({ id: 't1' });
    const res = await request(app.getHttpServer())
      .patch('/traits/t1')
      .send({ name: 'Stamina' });
    expect(res.status).toBe(200);
    expect(mockService.update).toHaveBeenCalledWith('t1', { name: 'Stamina' });
  });

  it('DELETE /traits/:id removes', async () => {
    const res = await request(app.getHttpServer()).delete('/traits/t1');
    expect(res.status).toBe(200);
    expect(mockService.remove).toHaveBeenCalledWith('t1');
  });
});
