import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProduct, updateProduct, deleteProduct } from '../../src/services/products';
import { apiFetch } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  apiFetch: vi.fn(),
}));

const PAYLOAD = {
  name: 'Beras',
  category_id: 1,
  units: [{ unit_id: 1, multiplier: 1, is_base_unit: true }],
  prices: [{ unit_id: 1, minimum_quantity: 1, price: 10000 }],
};

function mockErrorResponse(code: string, status = 400) {
  return new Response(JSON.stringify({ code, detail: 'error detail' }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('handleProductErrors', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  describe('createProduct', () => {
    it('throws when duplicate unit detected in payload', async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockErrorResponse('duplicate_unit_in_payload'));

      await expect(createProduct(PAYLOAD)).rejects.toThrow(
        'Tidak boleh ada produk yang memiliki unit yang sama lebih dari satu',
      );
    });

    it('throws when duplicate price detected in payload', async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockErrorResponse('duplicate_price_in_payload'));

      await expect(createProduct(PAYLOAD)).rejects.toThrow(
        'Tidak boleh ada produk yang memiliki unit dan kuantitas minimal yang sama lebih dari satu',
      );
    });

    it('falls back to handleCommonErrors for unknown error codes', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify({ code: 'some_other_code', detail: 'Some server error' }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await expect(createProduct(PAYLOAD)).rejects.toThrow('Some server error');
    });

    it('falls back to handleCommonErrors when response body is not JSON', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        }),
      );

      // handleCommonErrors falls back to response.statusText when body is not JSON
      await expect(createProduct(PAYLOAD)).rejects.toThrow('Internal Server Error');
    });

    it('returns product detail on success', async () => {
      const product = { id: 1, name: 'Beras' };
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(product), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await expect(createProduct(PAYLOAD)).resolves.toEqual(product);
    });
  });

  describe('updateProduct', () => {
    it('throws when duplicate unit detected in payload', async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockErrorResponse('duplicate_unit_in_payload'));

      await expect(updateProduct(1, PAYLOAD)).rejects.toThrow(
        'Tidak boleh ada produk yang memiliki unit yang sama lebih dari satu',
      );
    });

    it('throws when duplicate price detected in payload', async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockErrorResponse('duplicate_price_in_payload'));

      await expect(updateProduct(1, PAYLOAD)).rejects.toThrow(
        'Tidak boleh ada produk yang memiliki unit dan kuantitas minimal yang sama lebih dari satu',
      );
    });

    it('falls back to handleCommonErrors for unknown error codes', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify({ code: 'some_other_code', detail: 'Some server error' }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await expect(updateProduct(1, PAYLOAD)).rejects.toThrow('Some server error');
    });

    it('falls back to handleCommonErrors when response body is not JSON', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        }),
      );

      // handleCommonErrors falls back to response.statusText when body is not JSON
      await expect(updateProduct(1, PAYLOAD)).rejects.toThrow('Internal Server Error');
    });

    it('returns updated product detail on success', async () => {
      const product = { id: 1, name: 'Beras Updated' };
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify(product), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await expect(updateProduct(1, PAYLOAD)).resolves.toEqual(product);
    });
  });

  describe('deleteProduct', () => {
    it('throws when product has references', async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockErrorResponse('product_has_references', 409));

      await expect(deleteProduct(1)).rejects.toThrow('Produk ini masih digunakan oleh sales order atau purchase order');
    });

    it('falls back to handleCommonErrors for unknown error codes', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(JSON.stringify({ code: 'some_other_code', detail: 'Some server error' }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await expect(deleteProduct(1)).rejects.toThrow('Some server error');
    });

    it('falls back to handleCommonErrors when response body is not JSON', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        }),
      );

      await expect(deleteProduct(1)).rejects.toThrow('Internal Server Error');
    });

    it('returns void on success', async () => {
      vi.mocked(apiFetch).mockResolvedValue(
        new Response(null, { status: 204 }),
      );

      await expect(deleteProduct(1)).resolves.toBeUndefined();
    });
  });
});
