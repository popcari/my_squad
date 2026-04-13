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

  it('GET /user-traits/:userId returns list', async () => {
    (mockService.findByUser as jest.Mock).mockResolvedValue([{ id: 'ut1' }]);
    const res = await request(app.getHttpServer()).get('/user-traits/u1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(mockService.findByUser).toHaveBeenCalledWith('u1');
  });

  it('POST /user-traits assigns', async () => {
    (mockService.assign as jest.Mock).mockResolvedValue({ id: 'new' });
    const res = await request(app.getHttpServer())
      .post('/user-traits')
      .send({ userId: 'u1', traitId: 't1', rating: 80 });
    expect(res.status).toBe(201);
  });

  it('PATCH /user-traits/:id updates rating', async () => {
    (mockService.updateRating as jest.Mock).mockResolvedValue({ id: 'ut1' });
    const res = await request(app.getHttpServer())
      .patch('/user-traits/ut1')
      .send({ rating: 90 });
    expect(res.status).toBe(200);
    expect(mockService.updateRating).toHaveBeenCalledWith('ut1', { rating: 90 });
  });

  it('DELETE /user-traits/:id removes', async () => {
    const res = await request(app.getHttpServer()).delete('/user-traits/ut1');
    expect(res.status).toBe(200);
    expect(mockService.remove).toHaveBeenCalledWith('ut1');
  });
});
