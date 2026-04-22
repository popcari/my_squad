import { act, renderHook, waitFor } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AuthProvider, useAuth } from './auth-context';
import type { User } from '@/types';

function base64url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function makeToken(expSecondsFromNow: number): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      sub: 'user-1',
      role: 'player',
      exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    }),
  );
  return `${header}.${payload}.signature`;
}

const mockUser: User = {
  id: 'user-1',
  email: 'a@b.com',
  displayName: 'Alice',
  role: 'player',
} as unknown as User;

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should store both access_token and user on login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const token = makeToken(3600);

    act(() => {
      result.current.login(mockUser, token);
    });

    expect(localStorage.getItem('access_token')).toBe(token);
    expect(JSON.parse(localStorage.getItem('user')!)).toMatchObject({
      id: 'user-1',
    });
    await waitFor(() => {
      expect(result.current.user?.id).toBe('user-1');
    });
  });

  it('should remove both access_token and user on logout', () => {
    const token = makeToken(3600);
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should auto-logout on hydrate when token is already expired', async () => {
    const expired = makeToken(-60);
    localStorage.setItem('access_token', expired);
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should keep user logged in when token is still valid on hydrate', async () => {
    const valid = makeToken(3600);
    localStorage.setItem('access_token', valid);
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.id).toBe('user-1');
    });
    expect(localStorage.getItem('access_token')).toBe(valid);
  });

  it('should auto-logout via periodic check when token expires during session', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const token = makeToken(90); // expires 90s from now
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.id).toBe('user-1');
    });

    // Advance past expiration (past 90s + one more periodic tick of 60s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(121_000);
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('should auto-logout when stored token is malformed', async () => {
    localStorage.setItem('access_token', 'not.a.jwt');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });
});
