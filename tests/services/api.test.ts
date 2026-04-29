import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_ORIGIN = 'http://fixture.test';

function createLocalStorage() {
  const map = new Map<string, string>();
  return {
    getItem: function (key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem: function (key: string, value: string) {
      map.set(key, value);
    },
    removeItem: function (key: string) {
      map.delete(key);
    },
    clear: function () {
      map.clear();
    },
  };
}

let localStorageMock: ReturnType<typeof createLocalStorage>;

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_API_ORIGIN', TEST_ORIGIN);
  localStorageMock = createLocalStorage();
  vi.stubGlobal('localStorage', localStorageMock);
  vi.stubGlobal(
    'fetch',
    vi.fn(function () {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
    )
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function loadApi() {
  return import('../../src/services/api');
}

function lastFetchHeaders(): Headers {
  const call = vi.mocked(fetch).mock.calls.at(-1);
  expect(call).toBeDefined();
  const init = call![1] as RequestInit;
  expect(init).toHaveProperty('headers');
  return new Headers(init.headers as HeadersInit);
}

describe('apiFetch', () => {
  it('calls fetch with env origin and the given path', async () => {
    const { apiFetch } = await loadApi();
    await apiFetch('/v1/items', { skipAuth: true });
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_ORIGIN}/v1/items`,
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it('adds Authorization Bearer when a token exists in localStorage', async () => {
    localStorageMock.setItem('access', 'secret-token');
    const { apiFetch } = await loadApi();
    await apiFetch('/v1/me');
    expect(lastFetchHeaders().get('Authorization')).toBe('Bearer secret-token');
  });

  it('does not add Authorization when skipAuth is true even if a token exists', async () => {
    localStorageMock.setItem('access', 'secret-token');
    const { apiFetch } = await loadApi();
    await apiFetch('/v1/login', { skipAuth: true });
    expect(lastFetchHeaders().get('Authorization')).toBeNull();
  });

  it('does not add Authorization when there is no token', async () => {
    const { apiFetch } = await loadApi();
    await apiFetch('/v1/items');
    expect(lastFetchHeaders().get('Authorization')).toBeNull();
  });

  it('sets Content-Type to application/json for non-FormData body when missing', async () => {
    const { apiFetch } = await loadApi();
    await apiFetch('/v1/items', {
      skipAuth: true,
      method: 'POST',
      body: JSON.stringify({ name: 'x' }),
    });
    expect(lastFetchHeaders().get('Content-Type')).toBe('application/json');
  });

  it('does not set Content-Type for FormData body', async () => {
    const { apiFetch } = await loadApi();
    const fd = new FormData();
    fd.append('file', new Blob(['a'], { type: 'text/plain' }), 'a.txt');
    await apiFetch('/v1/upload', {
      skipAuth: true,
      method: 'POST',
      body: fd,
    });
    expect(lastFetchHeaders().has('Content-Type')).toBe(false);
  });

  it('preserves Content-Type when already set on init', async () => {
    const { apiFetch } = await loadApi();
    await apiFetch('/v1/items', {
      skipAuth: true,
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/vnd.api+json' },
    });
    expect(lastFetchHeaders().get('Content-Type')).toBe('application/vnd.api+json');
  });

  it('forwards method and other fetch options to fetch', async () => {
    const { apiFetch } = await loadApi();
    await apiFetch('/v1/items', {
      skipAuth: true,
      method: 'PUT',
      cache: 'no-store',
    });
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_ORIGIN}/v1/items`,
      expect.objectContaining({ method: 'PUT', cache: 'no-store' }),
    );
  });

  it('throws "Tidak dapat terhubung ke server..." when fetch fails with type error', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));
    const { apiFetch } = await loadApi();

    await expect(apiFetch('/v1/items')).rejects.toThrow('Tidak dapat terhubung ke server. Silahkan coba lagi nanti');
  });

  it('throws original error when fetch fails with other errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('DNS Error or Timeout'));
    const { apiFetch } = await loadApi();

    await expect(apiFetch('/v1/items')).rejects.toThrow('DNS Error or Timeout');
  });
});
