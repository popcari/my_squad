import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../modules/users/types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let jwtService: JwtService;

  beforeEach(() => {
    reflector = new Reflector();
    jwtService = new JwtService({ secret: 'test-secret' });
    guard = new JwtAuthGuard(reflector, jwtService);
  });

  const mockContext = (
    authHeader?: string,
    extra: Record<string, unknown> = {},
  ): ExecutionContext => {
    const req: Record<string, unknown> = {
      headers: authHeader ? { authorization: authHeader } : {},
      ...extra,
    };
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access when route is marked @Public', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) => key === IS_PUBLIC_KEY);

    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('should throw UnauthorizedException when no Authorization header', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(mockContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when header is not Bearer scheme', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() => guard.canActivate(mockContext('Basic abc'))).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when token is invalid', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    expect(() =>
      guard.canActivate(mockContext('Bearer not-a-real-jwt')),
    ).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token is expired', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const expiredToken = jwtService.sign(
      { sub: 'user-1', role: UserRole.PLAYER },
      { expiresIn: '-1s' },
    );

    expect(() => guard.canActivate(mockContext(`Bearer ${expiredToken}`))).toThrow(
      UnauthorizedException,
    );
  });

  it('should set req.user and allow access for valid token', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = jwtService.sign({
      sub: 'user-42',
      role: UserRole.COACH,
    });
    const req: { user?: { id: string; role: UserRole } } = {};
    const ctx = {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: `Bearer ${token}` }, ...req }),
      }),
    } as unknown as ExecutionContext;

    // We need the same req reference; re-build with object identity
    const realReq: { headers: Record<string, string>; user?: unknown } = {
      headers: { authorization: `Bearer ${token}` },
    };
    const realCtx = {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({ getRequest: () => realReq }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(realCtx)).toBe(true);
    expect(realReq.user).toEqual({ id: 'user-42', role: UserRole.COACH });
    // silence unused lint
    void ctx;
  });
});
