import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';
import { UploadService } from './upload.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
    api: {
      resources: jest.fn(),
    },
  },
}));

describe('UploadService', () => {
  let service: UploadService;
  let configService: ConfigService;

  const mockConfigValues: Record<string, string> = {
    'cloudinary.cloudName': 'test-cloud',
    'cloudinary.apiKey': 'test-key',
    'cloudinary.apiSecret': 'test-secret',
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfigValues[key]),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should configure cloudinary on init', () => {
    service.onModuleInit();
    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
    });
  });

  describe('upload', () => {
    const mockFile: Express.Multer.File = {
      buffer: Buffer.from('fake-image'),
      originalname: 'avatar.png',
      mimetype: 'image/png',
      fieldname: 'file',
      encoding: '7bit',
      size: 1024,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    it('should upload file and return secure_url', async () => {
      const mockResult = {
        secure_url:
          'https://res.cloudinary.com/test/image/upload/v1/avatars/123.png',
        public_id: 'avatars/123',
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options: any, callback: any) => {
          callback(null, mockResult);
          return { end: jest.fn() };
        },
      );

      const result = await service.upload(mockFile, 'avatars');

      expect(result).toEqual({
        url: mockResult.secure_url,
        publicId: mockResult.public_id,
      });
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'avatars' },
        expect.any(Function),
      );
    });

    it('should throw error when upload fails', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options: any, callback: any) => {
          callback(new Error('Upload failed'), null);
          return { end: jest.fn() };
        },
      );

      await expect(service.upload(mockFile, 'avatars')).rejects.toThrow(
        'Upload failed',
      );
    });

    it('should use default folder when not specified', async () => {
      const mockResult = {
        secure_url:
          'https://res.cloudinary.com/test/image/upload/v1/uploads/123.png',
        public_id: 'uploads/123',
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options: any, callback: any) => {
          callback(null, mockResult);
          return { end: jest.fn() };
        },
      );

      await service.upload(mockFile);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'uploads' },
        expect.any(Function),
      );
    });
  });

  describe('listImages', () => {
    it('should return images from a folder', async () => {
      (cloudinary.api.resources as jest.Mock).mockResolvedValue({
        resources: [
          {
            secure_url: 'https://res.cloudinary.com/test/avatars/a.png',
            public_id: 'avatars/a',
            created_at: '2026-01-01',
          },
          {
            secure_url: 'https://res.cloudinary.com/test/avatars/b.png',
            public_id: 'avatars/b',
            created_at: '2026-01-02',
          },
        ],
      });

      const result = await service.listImages('avatars');

      expect(result).toEqual([
        {
          url: 'https://res.cloudinary.com/test/avatars/a.png',
          publicId: 'avatars/a',
          createdAt: '2026-01-01',
        },
        {
          url: 'https://res.cloudinary.com/test/avatars/b.png',
          publicId: 'avatars/b',
          createdAt: '2026-01-02',
        },
      ]);
      expect(cloudinary.api.resources).toHaveBeenCalledWith({
        type: 'upload',
        prefix: 'avatars',
        max_results: 50,
        resource_type: 'image',
      });
    });

    it('should return empty array when no images', async () => {
      (cloudinary.api.resources as jest.Mock).mockResolvedValue({
        resources: [],
      });

      const result = await service.listImages('avatars');
      expect(result).toEqual([]);
    });
  });

  describe('deleteImage', () => {
    it('should call cloudinary destroy with the given publicId', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      await service.deleteImage('avatars/123');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('avatars/123');
    });

    it('should propagate error when cloudinary destroy fails', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        new Error('Destroy failed'),
      );

      await expect(service.deleteImage('avatars/123')).rejects.toThrow(
        'Destroy failed',
      );
    });
  });
});
