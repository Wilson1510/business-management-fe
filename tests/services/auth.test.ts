import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/api', () => ({
  apiFetch: vi.fn(),
}));

import { login } from '../../src/services/auth';
import { apiFetch } from '../../src/services/api';

describe('login', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('calls apiFetch with login path, POST, skipAuth, and JSON credentials', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify({ access: 'a', refresh: 'r' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await login('alice', 'secret');

    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith('/api/auth/login/', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ username: 'alice', password: 'secret' }),
    });
  });

  it('returns access and refresh tokens from JSON body when response is ok', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify({ access: 'tok-a', refresh: 'tok-r' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(login('u', 'p')).resolves.toEqual({
      access: 'tok-a',
      refresh: 'tok-r',
    });
  });

  it('throws "Username atau password salah" on 401 status code', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(null, { status: 401, statusText: 'Unauthorized' }),
    );

    await expect(login('u', 'p')).rejects.toThrow('Username atau password salah');
  });

  it('uses error detail from JSON response if available', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Banned account' }), { status: 403, headers: { 'Content-Type': 'application/json' } }),
    );

    await expect(login('u', 'p')).rejects.toThrow('Banned account');
  });

  it('uses error detail string directly from JSON response if string format', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify('Custom string error'), { status: 400, headers: { 'Content-Type': 'application/json' } }),
    );

    await expect(login('u', 'p')).rejects.toThrow('Custom string error');
  });

  it('falls back to statusText if response is not JSON', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response('<html><body>500 Internal Server Error</body></html>', { status: 500, statusText: 'Internal Server Error' }),
    );

    await expect(login('u', 'p')).rejects.toThrow('Internal Server Error');
  });

  it('falls back to "Terjadi kesalahan pada server" if no statusText', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response('html error data', { status: 500, statusText: '' }),
    );

    await expect(login('u', 'p')).rejects.toThrow('Terjadi kesalahan pada server');
  });

  it('throws "Tidak dapat terhubung ke server..." when fetch fails with network error', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error('Failed to fetch'));

    await expect(login('u', 'p')).rejects.toThrow('Tidak dapat terhubung ke server. Silahkan coba lagi nanti');
  });

  it('throws original error if fetch fails with a different error', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error('DNS lookup failed'));

    await expect(login('u', 'p')).rejects.toThrow('DNS lookup failed');
  });
});
