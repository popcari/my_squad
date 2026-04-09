import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

describe('UploadController', () => {
  let app: INestApplication;
  let mockUploadService: Partial<UploadService>;

  beforeEach(async () => {
    mockUploadService = {
      listImages: jest.fn().mockResolvedValue([]),
      deleteImage: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: UploadService, useValue: mockUploadService }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /uploads/images', () => {
    it('should return images for the given folder', async () => {
      const mockImages = [
        {
          url: 'https://res.cloudinary.com/test/avatars/a.png',
          publicId: 'avatars/a',
          createdAt: '2026-01-01',
        },
      ];
      (mockUploadService.listImages as jest.Mock).mockResolvedValue(mockImages);

      const response = await request(app.getHttpServer()).get(
        '/uploads/images?folder=avatars',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockImages);
      expect(mockUploadService.listImages).toHaveBeenCalledWith('avatars');
    });

    it('should use default folder "uploads" when folder query is omitted', async () => {
      await request(app.getHttpServer()).get('/uploads/images');

      expect(mockUploadService.listImages).toHaveBeenCalledWith('uploads');
    });
  });

  describe('DELETE /uploads/images', () => {
    it('should delete image by publicId and return 200', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/uploads/images?publicId=avatars%2F123',
      );

      expect(response.status).toBe(200);
      expect(mockUploadService.deleteImage).toHaveBeenCalledWith('avatars/123');
    });

    it('should call deleteImage with the exact publicId from query', async () => {
      await request(app.getHttpServer()).delete(
        '/uploads/images?publicId=avatars%2Fsome-image',
      );

      expect(mockUploadService.deleteImage).toHaveBeenCalledWith(
        'avatars/some-image',
      );
    });
  });
});
