import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { api, onUnauthorized } from './api';

describe('api client', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let onUnauthorizedHandler: (() => void) & { mock: { calls: unknown[][] } };

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    onUnauthorizedHandler = vi.fn() as unknown as (() => void) & {
      mock: { calls: unknown[][] };
    };
    onUnauthorized(onUnauthorizedHandler);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    onUnauthorized(null);
  });

  it('should attach Authorization: Bearer <token> when access_token is present', async () => {
    localStorage.setItem('access_token', 'fake-jwt-token');
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await api.get('/users');

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer fake-jwt-token',
    );
  });

  it('should not attach Authorization header when no token stored', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await api.get('/auth/login');

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('should call onUnauthorized handler when API returns 401', async () => {
    localStorage.setItem('access_token', 'expired-token');
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(api.get('/users')).rejects.toThrow();
    expect(onUnauthorizedHandler.mock.calls).toHaveLength(1);
  });

  it('should not call onUnauthorized handler on non-401 errors', async () => {
    localStorage.setItem('access_token', 'token');
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(api.get('/users')).rejects.toThrow();
    expect(onUnauthorizedHandler.mock.calls).toHaveLength(0);
  });
});
