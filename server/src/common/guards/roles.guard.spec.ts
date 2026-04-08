import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../modules/users/types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const mockContext = (user?: { role: UserRole }): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow access when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('should allow access when user has required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.COACH, UserRole.PRESIDENT]);

    expect(guard.canActivate(mockContext({ role: UserRole.COACH }))).toBe(true);
  });

  it('should deny access when user has insufficient role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.COACH, UserRole.PRESIDENT]);

    expect(() =>
      guard.canActivate(mockContext({ role: UserRole.PLAYER })),
    ).toThrow(ForbiddenException);
  });

  it('should deny access when no user on request', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.COACH, UserRole.PRESIDENT]);

    expect(() => guard.canActivate(mockContext())).toThrow(ForbiddenException);
  });

  it('should allow president access to coach+ endpoints', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.COACH, UserRole.PRESIDENT]);

    expect(guard.canActivate(mockContext({ role: UserRole.PRESIDENT }))).toBe(
      true,
    );
  });
});
