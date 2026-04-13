import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserRole } from '../users/types';
import { UserPositionsController } from './user-positions.controller';
import { UserPositionsService } from './user-positions.service';

describe('UserPositionsController', () => {
  let app: INestApplication;
  let mockService: Partial<UserPositionsService>;

  beforeEach(async () => {
    mockService = {
      findByUser: jest.fn().mockResolvedValue([]),
      assign: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPositionsController],
      providers: [{ provide: UserPositionsService, useValue: mockService }],
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

  it('GET /user-positions/:userId returns list', async () => {
    (mockService.findByUser as jest.Mock).mockResolvedValue([{ id: 'up1' }]);
    const res = await request(app.getHttpServer()).get('/user-positions/u1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(mockService.findByUser).toHaveBeenCalledWith('u1');
  });

  it('POST /user-positions assigns', async () => {
    (mockService.assign as jest.Mock).mockResolvedValue({ id: 'new' });
    const res = await request(app.getHttpServer())
      .post('/user-positions')
      .send({ userId: 'u1', positionId: 'p1', type: 'primary' });
    expect(res.status).toBe(201);
  });

  it('DELETE /user-positions/:id removes', async () => {
    const res = await request(app.getHttpServer()).delete(
      '/user-positions/up1',
    );
    expect(res.status).toBe(200);
    expect(mockService.remove).toHaveBeenCalledWith('up1');
  });
});
