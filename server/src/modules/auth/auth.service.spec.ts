import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../users/types';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1d' },
        }),
      ],
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('generateAccessToken', () => {
    it('should return a signed JWT string', () => {
      const token = service.generateAccessToken({
        id: 'user-1',
        role: UserRole.PLAYER,
      });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should embed user id as sub and role in payload', () => {
      const token = service.generateAccessToken({
        id: 'user-42',
        role: UserRole.COACH,
      });
      const decoded = jwtService.verify<{ sub: string; role: string }>(token);
      expect(decoded.sub).toBe('user-42');
      expect(decoded.role).toBe(UserRole.COACH);
    });

    it('should produce a token that expires in 1 day', () => {
      const now = Math.floor(Date.now() / 1000);
      const token = service.generateAccessToken({
        id: 'user-1',
        role: UserRole.PLAYER,
      });
      const decoded = jwtService.verify<{ exp: number; iat: number }>(token);
      const oneDay = 24 * 60 * 60;
      expect(decoded.exp - decoded.iat).toBe(oneDay);
      expect(decoded.exp).toBeGreaterThanOrEqual(now + oneDay - 5);
      expect(decoded.exp).toBeLessThanOrEqual(now + oneDay + 5);
    });
  });
});
