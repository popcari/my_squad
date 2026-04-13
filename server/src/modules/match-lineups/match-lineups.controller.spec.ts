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
      findByMatch: jest.fn().mockResolvedValue([]),
      add: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchLineupsController],
      providers: [{ provide: MatchLineupsService, useValue: mockService }],
    }).compile();

    app = module.createNestApplication();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  it('DELETE /match-lineups/:id removes', async () => {
    const res = await request(app.getHttpServer()).delete('/match-lineups/l1');
    expect(res.status).toBe(200);
    expect(mockService.remove).toHaveBeenCalledWith('l1');
  });
});
