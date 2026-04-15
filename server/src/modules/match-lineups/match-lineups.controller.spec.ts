import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserRole } from '../users/types';
import { MatchLineupsController } from './match-lineups.controller';
import { MatchLineupsService } from './match-lineups.service';

describe('MatchLineupsController', () => {
  let app: INestApplication;
  let mockService: Partial<MatchLineupsService>;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn().mockResolvedValue([]),
      findByMatch: jest.fn().mockResolvedValue([]),
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchLineupsController],
      providers: [{ provide: MatchLineupsService, useValue: mockService }],
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

  it('GET /match-lineups returns every lineup', async () => {
    (mockService.findAll as jest.Mock).mockResolvedValue([
      { id: 'l1', matchId: 'm1', userId: 'u1', type: 'starting' },
      { id: 'l2', matchId: 'm2', userId: 'u2', type: 'substitute' },
    ]);
    const res = await request(app.getHttpServer()).get('/match-lineups');
    expect(res.status).toBe(200);
    expect(mockService.findAll).toHaveBeenCalled();
    expect(res.body).toHaveLength(2);
  });

  it('GET /match-lineups/:matchId returns list', async () => {
    const res = await request(app.getHttpServer()).get('/match-lineups/m1');
    expect(res.status).toBe(200);
    expect(mockService.findByMatch).toHaveBeenCalledWith('m1');
  });

  it('POST /match-lineups adds', async () => {
    (mockService.add as jest.Mock).mockResolvedValue({ id: 'l1' });
    const res = await request(app.getHttpServer())
      .post('/match-lineups')
      .send({ matchId: 'm1', userId: 'u1', type: 'starting' });
    expect(res.status).toBe(201);
  });

  it('POST /match-lineups accepts optional slotIndex', async () => {
    (mockService.add as jest.Mock).mockResolvedValue({
      id: 'l1',
      slotIndex: 2,
    });
    const res = await request(app.getHttpServer()).post('/match-lineups').send({
      matchId: 'm1',
      userId: 'u1',
      type: 'starting',
      slotIndex: 2,
    });
    expect(res.status).toBe(201);
    expect(mockService.add).toHaveBeenCalledWith({
      matchId: 'm1',
      userId: 'u1',
      type: 'starting',
      slotIndex: 2,
    });
  });

  it('PATCH /match-lineups/:id updates', async () => {
    (mockService.update as jest.Mock).mockResolvedValue({
      id: 'l1',
      slotIndex: 4,
    });
    const res = await request(app.getHttpServer())
      .patch('/match-lineups/l1')
      .send({ slotIndex: 4 });
    expect(res.status).toBe(200);
    expect(mockService.update).toHaveBeenCalledWith('l1', { slotIndex: 4 });
  });

  it('DELETE /match-lineups/:id removes', async () => {
    const res = await request(app.getHttpServer()).delete('/match-lineups/l1');
    expect(res.status).toBe(200);
    expect(mockService.remove).toHaveBeenCalledWith('l1');
  });
});
