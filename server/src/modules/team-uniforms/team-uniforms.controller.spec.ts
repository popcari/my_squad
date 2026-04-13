import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserRole } from '../users/types';
import { TeamUniformsController } from './team-uniforms.controller';
import { TeamUniformsService } from './team-uniforms.service';

describe('TeamUniformsController', () => {
  let app: INestApplication;
  let mockService: Partial<TeamUniformsService>;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn().mockResolvedValue([]),
      findByYear: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamUniformsController],
      providers: [{ provide: TeamUniformsService, useValue: mockService }],
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

  describe('GET /team-uniforms', () => {
    it('should return 200 and empty array', async () => {
      const response = await request(app.getHttpServer()).get('/team-uniforms');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should filter by year query param', async () => {
      (mockService.findByYear as jest.Mock).mockResolvedValue([
        {
          id: 'u1',
          year: 2026,
          name: 'Home',
          numberColor: '#ffffff',
          shirtColor: '#ff0000',
          pantColor: '#000000',
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/team-uniforms')
        .query({ year: 2026 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(mockService.findByYear).toHaveBeenCalledWith(2026);
    });
  });

  describe('POST /team-uniforms', () => {
    it('should return 201 when creating uniform with color fields', async () => {
      const dto = {
        year: 2026,
        name: 'Home Kit',
        numberColor: '#ffffff',
        shirtColor: '#ff0000',
        pantColor: '#000000',
      };
      const created = {
        id: 'u-new',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockService.create as jest.Mock).mockResolvedValue(created);

      const response = await request(app.getHttpServer())
        .post('/team-uniforms')
        .send(dto);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('u-new');
      expect(response.body.shirtColor).toBe('#ff0000');
      expect(response.body.pantColor).toBe('#000000');
      expect(response.body.numberColor).toBe('#ffffff');
    });

    it('should return 400 when shirtColor is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/team-uniforms')
        .send({
          year: 2026,
          name: 'Home Kit',
          numberColor: '#ffffff',
          pantColor: '#000000',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when year is out of range', async () => {
      const response = await request(app.getHttpServer())
        .post('/team-uniforms')
        .send({
          year: 1800,
          name: 'Home Kit',
          numberColor: '#ffffff',
          shirtColor: '#ff0000',
          pantColor: '#000000',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /team-uniforms/:id', () => {
    it('should return 200 when updating uniform with partial payload', async () => {
      const updated = {
        id: 'u-1',
        year: 2026,
        name: 'Home Kit Updated',
        numberColor: '#ffffff',
        shirtColor: '#00ff00',
        pantColor: '#000000',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockService.update as jest.Mock).mockResolvedValue(updated);

      const response = await request(app.getHttpServer())
        .patch('/team-uniforms/u-1')
        .send({ name: 'Home Kit Updated', shirtColor: '#00ff00' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Home Kit Updated');
      expect(response.body.shirtColor).toBe('#00ff00');
      expect(mockService.update).toHaveBeenCalledWith('u-1', {
        name: 'Home Kit Updated',
        shirtColor: '#00ff00',
      });
    });

    it('should return 400 when updating with invalid color', async () => {
      const response = await request(app.getHttpServer())
        .patch('/team-uniforms/u-1')
        .send({ shirtColor: 'not-a-hex' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /team-uniforms/:id', () => {
    it('should return 200 when deleting uniform', async () => {
      (mockService.remove as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app.getHttpServer()).delete(
        '/team-uniforms/u-1',
      );

      expect(response.status).toBe(200);
      expect(mockService.remove).toHaveBeenCalledWith('u-1');
    });
  });
});
