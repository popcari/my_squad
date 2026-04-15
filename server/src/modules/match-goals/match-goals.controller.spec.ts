import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserRole } from '../users/types';
import { MatchGoalsController } from './match-goals.controller';
import { MatchGoalsService } from './match-goals.service';

describe('MatchGoalsController', () => {
  let app: INestApplication;
  let mockService: Partial<MatchGoalsService>;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn().mockResolvedValue([]),
      findByMatch: jest.fn().mockResolvedValue([]),
      findByScorer: jest.fn().mockResolvedValue([]),
      add: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchGoalsController],
      providers: [{ provide: MatchGoalsService, useValue: mockService }],
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

  it('GET /match-goals returns list', async () => {
    const res = await request(app.getHttpServer()).get('/match-goals');
    expect(res.status).toBe(200);
  });

  it('GET /match-goals/match/:matchId', async () => {
    await request(app.getHttpServer()).get('/match-goals/match/m1');
    expect(mockService.findByMatch).toHaveBeenCalledWith('m1');
  });

  it('GET /match-goals/scorer/:userId', async () => {
    await request(app.getHttpServer()).get('/match-goals/scorer/u1');
    expect(mockService.findByScorer).toHaveBeenCalledWith('u1');
  });

  it('POST /match-goals adds', async () => {
    (mockService.add as jest.Mock).mockResolvedValue({ id: 'g1' });
    const res = await request(app.getHttpServer())
      .post('/match-goals')
      .send({ matchId: 'm1', scorerId: 'u1', minute: 45 });
    expect(res.status).toBe(201);
  });

  it('DELETE /match-goals/:id removes', async () => {
    const res = await request(app.getHttpServer()).delete('/match-goals/g1');
    expect(res.status).toBe(200);
    expect(mockService.remove).toHaveBeenCalledWith('g1');
  });
});
