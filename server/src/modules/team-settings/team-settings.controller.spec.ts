import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserRole } from '../users/types';
import { TeamSettingsController } from './team-settings.controller';
import { TeamSettingsService } from './team-settings.service';

describe('TeamSettingsController', () => {
  let app: INestApplication;
  let mockService: Partial<TeamSettingsService>;

  beforeEach(async () => {
    mockService = {
      getCached: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamSettingsController],
      providers: [{ provide: TeamSettingsService, useValue: mockService }],
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

  it('GET /team-settings returns cached settings', async () => {
    (mockService.getCached as jest.Mock).mockResolvedValue({
      name: 'My Squad',
      playerCount: 10,
      updatedAt: new Date(),
    });
    const res = await request(app.getHttpServer()).get('/team-settings');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('My Squad');
  });

  it('PATCH /team-settings updates', async () => {
    (mockService.update as jest.Mock).mockResolvedValue({ name: 'New Name' });
    const res = await request(app.getHttpServer())
      .patch('/team-settings')
      .send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect(mockService.update).toHaveBeenCalledWith({ name: 'New Name' });
  });
});
