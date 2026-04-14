import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserRole } from '../users/types';
import { FormationsController } from './formations.controller';
import { FormationsService } from './formations.service';

describe('FormationsController', () => {
  let app: INestApplication;
  let mockService: Partial<FormationsService>;

  const validSlots = [
    { role: 'GK', x: 50, y: 10 },
    { role: 'LB', x: 20, y: 35 },
    { role: 'CB', x: 50, y: 30 },
    { role: 'RB', x: 80, y: 35 },
    { role: 'LM', x: 25, y: 65 },
    { role: 'RM', x: 75, y: 65 },
    { role: 'ST', x: 50, y: 88 },
  ];

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormationsController],
      providers: [{ provide: FormationsService, useValue: mockService }],
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

  it('GET /formations returns list', async () => {
    const res = await request(app.getHttpServer()).get('/formations');
    expect(res.status).toBe(200);
  });

  it('GET /formations/:id returns one', async () => {
    (mockService.findOne as jest.Mock).mockResolvedValue({ id: 'f1' });
    const res = await request(app.getHttpServer()).get('/formations/f1');
    expect(res.status).toBe(200);
    expect(mockService.findOne).toHaveBeenCalledWith('f1');
  });

  it('POST /formations creates with 7 slots', async () => {
    (mockService.create as jest.Mock).mockResolvedValue({
      id: 'new',
      name: '3-2-1',
      slots: validSlots,
    });
    const res = await request(app.getHttpServer())
      .post('/formations')
      .send({ name: '3-2-1', slots: validSlots });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('new');
  });

  it('POST /formations rejects when slots count != 7', async () => {
    const res = await request(app.getHttpServer())
      .post('/formations')
      .send({ name: '4-3-1', slots: validSlots.slice(0, 5) });
    expect(res.status).toBe(400);
  });

  it('POST /formations rejects when slot x out of range', async () => {
    const bad = [{ ...validSlots[0], x: 150 }, ...validSlots.slice(1)];
    const res = await request(app.getHttpServer())
      .post('/formations')
      .send({ name: 'Bad', slots: bad });
    expect(res.status).toBe(400);
  });

  it('PATCH /formations/:id updates', async () => {
    (mockService.update as jest.Mock).mockResolvedValue({
      id: 'f1',
      name: 'Renamed',
      slots: validSlots,
    });
    const res = await request(app.getHttpServer())
      .patch('/formations/f1')
      .send({ name: 'Renamed' });
    expect(res.status).toBe(200);
    expect(mockService.update).toHaveBeenCalledWith('f1', { name: 'Renamed' });
  });

  it('DELETE /formations/:id removes', async () => {
    const res = await request(app.getHttpServer()).delete('/formations/f1');
    expect(res.status).toBe(200);
    expect(mockService.remove).toHaveBeenCalledWith('f1');
  });
});
