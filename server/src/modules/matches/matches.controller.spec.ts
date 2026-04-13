import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserRole } from '../users/types';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

describe('MatchesController', () => {
  let app: INestApplication;
  let mockService: Partial<MatchesService>;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn().mockResolvedValue([]),
      findByMonth: jest.fn().mockResolvedValue([]),
      findUpcoming: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [{ provide: MatchesService, useValue: mockService }],
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

  it('GET /matches returns list', async () => {
    const res = await request(app.getHttpServer()).get('/matches');
    expect(res.status).toBe(200);
  });

  it('GET /matches/month filters by year/month', async () => {
    await request(app.getHttpServer()).get('/matches/month?year=2026&month=4');
    expect(mockService.findByMonth).toHaveBeenCalledWith(2026, 4);
  });

  it('GET /matches/upcoming returns upcoming', async () => {
    const res = await request(app.getHttpServer()).get('/matches/upcoming');
    expect(res.status).toBe(200);
    expect(mockService.findUpcoming).toHaveBeenCalled();
  });

  it('GET /matches/:id returns one', async () => {
    (mockService.findOne as jest.Mock).mockResolvedValue({ id: 'm1' });
    await request(app.getHttpServer()).get('/matches/m1');
    expect(mockService.findOne).toHaveBeenCalledWith('m1');
  });

  it('POST /matches creates', async () => {
    (mockService.create as jest.Mock).mockResolvedValue({ id: 'new' });
    const res = await request(app.getHttpServer()).post('/matches').send({
      opponent: 'FC Rivals',
      matchDate: '2026-05-01T15:00:00.000Z',
      location: 'Home',
    });
    expect(res.status).toBe(201);
  });

  it('PATCH /matches/:id updates', async () => {
    (mockService.update as jest.Mock).mockResolvedValue({ id: 'm1' });
    const res = await request(app.getHttpServer())
      .patch('/matches/m1')
      .send({ homeScore: 2, awayScore: 1, status: 'completed' });
    expect(res.status).toBe(200);
    expect(mockService.update).toHaveBeenCalledWith('m1', {
      homeScore: 2,
      awayScore: 1,
      status: 'completed',
    });
  });

  it('DELETE /matches/:id removes', async () => {
    const res = await request(app.getHttpServer()).delete('/matches/m1');
    expect(res.status).toBe(200);
    expect(mockService.remove).toHaveBeenCalledWith('m1');
  });
});
