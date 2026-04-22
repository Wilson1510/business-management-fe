import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteCategory } from '../../src/services/categories';
import { apiFetch } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  apiFetch: vi.fn(),
}));

describe('deleteCategory', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('throws custom error when category is used by products (409 status with category_has_products code)', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify({ code: 'category_has_products', detail: 'This category cannot be deleted...' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(deleteCategory(1)).rejects.toThrow('Kategori ini masih digunakan oleh produk');
  });

  it('handles regular API errors fallback through handleCommonErrors', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: 'You lack permission' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(deleteCategory(1)).rejects.toThrow('You lack permission');
  });
});
