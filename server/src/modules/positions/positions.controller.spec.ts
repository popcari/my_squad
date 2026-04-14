import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserRole } from '../users/types';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

describe('PositionsController', () => {
  let app: INestApplication;
  let mockService: Partial<PositionsService>;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionsController],
      providers: [{ provide: PositionsService, useValue: mockService }],
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

  it('GET /positions returns list', async () => {
    (mockService.findAll as jest.Mock).mockResolvedValue([{ id: 'p1' }]);
    const res = await request(app.getHttpServer()).get('/positions');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('GET /positions/:id returns one', async () => {
    (mockService.findOne as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = await request(app.getHttpServer()).get('/positions/p1');
    expect(res.status).toBe(200);
    expect(mockService.findOne).toHaveBeenCalledWith('p1');
  });

  it('POST /positions creates', async () => {
    (mockService.create as jest.Mock).mockResolvedValue({ id: 'new' });
    const res = await request(app.getHttpServer())
      .post('/positions')
      .send({ name: 'ST' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('new');
  });

  it('PATCH /positions/:id updates', async () => {
    (mockService.update as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = await request(app.getHttpServer())
      .patch('/positions/p1')
      .send({ name: 'GK' });
    expect(res.status).toBe(200);
    expect(mockService.update).toHaveBeenCalledWith('p1', { name: 'GK' });
  });

  it('DELETE /positions/:id removes', async () => {
    const res = await request(app.getHttpServer()).delete('/positions/p1');
    expect(res.status).toBe(200);
    expect(mockService.remove).toHaveBeenCalledWith('p1');
  });
});
