import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteUnit } from '../../src/services/units';
import { apiFetch } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  apiFetch: vi.fn(),
}));

describe('deleteUnit', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('throws custom error when unit has references (409 status with unit_has_references code)', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify({ code: 'unit_has_references', detail: 'This unit cannot be deleted...' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(deleteUnit(1)).rejects.toThrow('Unit ini masih digunakan oleh sales order atau purchase order');
  });

  it('handles regular API errors fallback through handleCommonErrors', async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(deleteUnit(1)).rejects.toThrow('Server error');
  });
});
