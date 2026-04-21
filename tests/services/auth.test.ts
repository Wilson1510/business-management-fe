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

  it('throws Error with response statusText when response is not ok', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(null, { status: 401, statusText: 'Unauthorized' }),
    );

    await expect(login('u', 'p')).rejects.toThrow('Unauthorized');
  });
});
