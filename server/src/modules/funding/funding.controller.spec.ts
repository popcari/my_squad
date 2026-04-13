import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserRole } from '../users/types';
import { FundingController } from './funding.controller';
import { FundingService } from './funding.service';

describe('FundingController', () => {
  let app: INestApplication;
  let mockService: Partial<FundingService>;

  beforeEach(async () => {
    mockService = {
      findAllRounds: jest.fn().mockResolvedValue([]),
      createRound: jest.fn(),
      updateRound: jest.fn(),
      removeRound: jest.fn(),
      findContributions: jest.fn().mockResolvedValue([]),
      createContribution: jest.fn(),
      removeContribution: jest.fn(),
      findAllExpenses: jest.fn().mockResolvedValue([]),
      createExpense: jest.fn(),
      updateExpense: jest.fn(),
      removeExpense: jest.fn(),
      getSummary: jest
        .fn()
        .mockResolvedValue({ totalIncome: 0, totalExpense: 0, balance: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FundingController],
      providers: [{ provide: FundingService, useValue: mockService }],
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

  describe('rounds', () => {
    it('GET /funding/rounds', async () => {
      const res = await request(app.getHttpServer()).get('/funding/rounds');
      expect(res.status).toBe(200);
    });

    it('POST /funding/rounds creates', async () => {
      (mockService.createRound as jest.Mock).mockResolvedValue({ id: 'r1' });
      const res = await request(app.getHttpServer())
        .post('/funding/rounds')
        .send({ name: 'Round 1' });
      expect(res.status).toBe(201);
    });

    it('PATCH /funding/rounds/:id updates', async () => {
      (mockService.updateRound as jest.Mock).mockResolvedValue({ id: 'r1' });
      const res = await request(app.getHttpServer())
        .patch('/funding/rounds/r1')
        .send({ name: 'Updated' });
      expect(res.status).toBe(200);
      expect(mockService.updateRound).toHaveBeenCalledWith('r1', {
        name: 'Updated',
      });
    });

    it('DELETE /funding/rounds/:id removes', async () => {
      const res = await request(app.getHttpServer()).delete(
        '/funding/rounds/r1',
      );
      expect(res.status).toBe(200);
      expect(mockService.removeRound).toHaveBeenCalledWith('r1');
    });
  });

  describe('contributions', () => {
    it('GET /funding/contributions with roundId filter', async () => {
      await request(app.getHttpServer()).get(
        '/funding/contributions?roundId=r1',
      );
      expect(mockService.findContributions).toHaveBeenCalledWith('r1');
    });

    it('POST /funding/contributions creates', async () => {
      (mockService.createContribution as jest.Mock).mockResolvedValue({
        id: 'c1',
      });
      const res = await request(app.getHttpServer())
        .post('/funding/contributions')
        .send({
          roundId: 'r1',
          userId: 'u1',
          amount: 50000,
          type: 'recurring',
          date: '2026-04-01',
        });
      expect(res.status).toBe(201);
    });

    it('DELETE /funding/contributions/:id removes', async () => {
      const res = await request(app.getHttpServer()).delete(
        '/funding/contributions/c1',
      );
      expect(res.status).toBe(200);
    });
  });

  describe('expenses', () => {
    it('GET /funding/expenses', async () => {
      const res = await request(app.getHttpServer()).get('/funding/expenses');
      expect(res.status).toBe(200);
    });

    it('POST /funding/expenses creates', async () => {
      (mockService.createExpense as jest.Mock).mockResolvedValue({ id: 'e1' });
      const res = await request(app.getHttpServer())
        .post('/funding/expenses')
        .send({ description: 'Balls', amount: 30000, date: '2026-04-01' });
      expect(res.status).toBe(201);
    });

    it('PATCH /funding/expenses/:id updates', async () => {
      (mockService.updateExpense as jest.Mock).mockResolvedValue({ id: 'e1' });
      const res = await request(app.getHttpServer())
        .patch('/funding/expenses/e1')
        .send({ amount: 40000 });
      expect(res.status).toBe(200);
    });

    it('DELETE /funding/expenses/:id removes', async () => {
      const res = await request(app.getHttpServer()).delete(
        '/funding/expenses/e1',
      );
      expect(res.status).toBe(200);
    });
  });

  it('GET /funding/summary returns totals', async () => {
    const res = await request(app.getHttpServer()).get('/funding/summary');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('balance');
  });
});
