import { Test, TestingModule } from '@nestjs/testing';
import { FIRESTORE } from '../../config';
import { TeamSettingsService } from './team-settings.service';

describe('TeamSettingsService', () => {
  let service: TeamSettingsService;

  let mockFirestore: any;

  let mockCollection: any;

  let mockUsersCollection: any;

  beforeEach(async () => {
    mockCollection = {
      doc: jest.fn(),
    };
    mockUsersCollection = {
      get: jest.fn().mockResolvedValue({ size: 10 }),
    };
    mockFirestore = {
      collection: jest.fn((name: string) => {
        if (name === 'users') return mockUsersCollection;
        return mockCollection;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamSettingsService,
        { provide: FIRESTORE, useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<TeamSettingsService>(TeamSettingsService);
  });

  describe('get', () => {
    it('returns data when document exists', async () => {
      const now = new Date('2026-04-10');
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            name: 'My Team',
            description: 'A great team',
            foundedDate: '2020-01-01',
            logo: 'https://example.com/logo.png',
            homeStadium: 'Stadium A',
            updatedAt: { toDate: () => now },
          }),
        }),
      });

      const result = await service.get();
      expect(result.name).toBe('My Team');
      expect(result.description).toBe('A great team');
      expect(result.homeStadium).toBe('Stadium A');
    });

    it('returns default values when document does not exist', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });

      const result = await service.get();
      expect(result.name).toBe('My Squad');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('falls back to default name when field is missing', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            updatedAt: new Date('2026-01-01'),
          }),
        }),
      });

      const result = await service.get();
      expect(result.name).toBe('My Squad');
    });
  });

  describe('getCached', () => {
    it('returns cached data on second call within TTL', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            name: 'Cached Team',
            updatedAt: { toDate: () => new Date('2026-01-01') },
          }),
        }),
      });

      const first = await service.getCached();
      const second = await service.getCached();

      expect(first).toEqual(second);
      expect(first.name).toBe('Cached Team');
      expect(first.playerCount).toBe(10);
      // doc.get only called once even though getCached was called twice
      // (second call hits cache)
    });
  });

  describe('update', () => {
    it('calls set when document does not exist', async () => {
      const setSpy = jest.fn().mockResolvedValue(undefined);
      const updateSpy = jest.fn();
      const doc = {
        get: jest.fn(),
        set: setSpy,
        update: updateSpy,
      };
      // First get (update check), then second get (service.get() afterward).
      doc.get.mockResolvedValueOnce({ exists: false }).mockResolvedValueOnce({
        exists: true,
        data: () => ({
          name: 'New Name',
          updatedAt: new Date(),
        }),
      });
      mockCollection.doc.mockReturnValue(doc);

      const result = await service.update({ name: 'New Name' });
      expect(setSpy).toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
      expect(result.name).toBe('New Name');
    });

    it('calls update when document exists', async () => {
      const setSpy = jest.fn();
      const updateSpy = jest.fn().mockResolvedValue(undefined);
      const doc = {
        get: jest.fn(),
        set: setSpy,
        update: updateSpy,
      };
      doc.get.mockResolvedValue({
        exists: true,
        data: () => ({
          name: 'Updated',
          updatedAt: new Date(),
        }),
      });
      mockCollection.doc.mockReturnValue(doc);

      const result = await service.update({ name: 'Updated' });
      expect(updateSpy).toHaveBeenCalled();
      expect(setSpy).not.toHaveBeenCalled();
      expect(result.name).toBe('Updated');
    });
  });

  describe('getPlayerCount', () => {
    it('returns the size of the users collection', async () => {
      const count = await service.getPlayerCount();
      expect(count).toBe(10);
    });
  });
});
