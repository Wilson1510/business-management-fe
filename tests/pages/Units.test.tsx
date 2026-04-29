/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import Units from '../../src/pages/Units';
import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  type UnitList,
  type UnitDetail,
} from '../../src/services/units';

vi.mock('../../src/services/units', () => ({
  getUnits: vi.fn(),
  createUnit: vi.fn(),
  updateUnit: vi.fn(),
  deleteUnit: vi.fn(),
}));

const MOCK_UNITS = [
  {
    id: 1,
    name: 'Pcs',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  },
  {
    id: 2,
    name: 'Box',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  },
];

function setupRouter() {
  return render(
    <MemoryRouter initialEntries={['/units']}>
      <Routes>
        <Route path="/units" element={<Units />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Units Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initial State & Data Fetching', () => {
    it('displays loading state initially', async () => {
      vi.mocked(getUnits).mockReturnValue(new Promise(() => {}));
      setupRouter();

      expect(screen.getByText('Memuat satuan...')).toBeInTheDocument();
    });

    it('displays error message if fetching fails', async () => {
      vi.mocked(getUnits).mockRejectedValue(new Error('Failed to load units error'));
      setupRouter();

      await waitFor(() => {
        expect(screen.getByText('Failed to load units error')).toBeInTheDocument();
      });
      expect(screen.queryByText('Memuat satuan...')).not.toBeInTheDocument();
    });

    it('displays empty state message when no data', async () => {
      vi.mocked(getUnits).mockResolvedValue([]);
      setupRouter();

      await waitFor(() => {
        expect(screen.getByText('Belum ada satuan')).toBeInTheDocument();
      });
    });

    it('displays populated units and action buttons', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      setupRouter();

      await waitFor(() => {
        expect(screen.getByText('Pcs')).toBeInTheDocument();
      });

      expect(screen.getByText('Box')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /tambah satuan/i })).toBeInTheDocument();

      const rows = screen.getAllByRole('row');
      const firstRow = rows[1];

      const buttonsInFirstRow = within(firstRow).getAllByRole('button');
      expect(buttonsInFirstRow).toHaveLength(1);
    });
  });

  describe('Add Unit Flow', () => {
    it('validates empty form and HTML required input', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /tambah satuan/i });
      await user.click(addBtn);

      expect(screen.getByRole('heading', { name: /tambah satuan/i })).toBeInTheDocument();

      const input = screen.getByLabelText('Nama Satuan');
      expect(input).toBeRequired();

      const saveBtn = screen.getByRole('button', { name: /simpan/i });
      await user.click(saveBtn);

      expect(input).toBeInvalid();

      expect(createUnit).not.toHaveBeenCalled();
    });

    it('prevents input of whitespace only', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /tambah satuan/i });
      await user.click(addBtn);

      const input = screen.getByLabelText('Nama Satuan');
      await user.type(input, '   ');

      const saveBtn = screen.getByRole('button', { name: /simpan/i });
      await user.click(saveBtn);

      expect(input).toBeValid();
      expect(screen.getByText('Nama wajib diisi')).toBeInTheDocument();
      expect(createUnit).not.toHaveBeenCalled();
    });

    it('successfully adds a new unit', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      vi.mocked(createUnit).mockResolvedValue(
        { id: 3, name: 'Kg', created_at: '', updated_at: '' } as unknown as UnitDetail,
      );

      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /tambah satuan/i });
      await user.click(addBtn);

      const input = screen.getByLabelText('Nama Satuan');
      await user.type(input, 'Kg');

      const saveBtn = screen.getByRole('button', { name: /simpan/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(createUnit).toHaveBeenCalledWith({ name: 'Kg' });
      });

      expect(screen.queryByRole('heading', { name: /tambah satuan/i })).not.toBeInTheDocument();
      expect(screen.getByText('Kg')).toBeInTheDocument();
    });

    it('shows API error inside modal when adding fails', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      vi.mocked(createUnit).mockRejectedValue(new Error('Name must be unique'));

      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /tambah satuan/i });
      await user.click(addBtn);

      const input = screen.getByLabelText('Nama Satuan');
      await user.type(input, 'Duplicate Name');

      const saveBtn = screen.getByRole('button', { name: /simpan/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Name must be unique')).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { name: /tambah satuan/i })).toBeInTheDocument();
    });
  });

  describe('Edit Unit Flow', () => {
    it('opens modal with pre-filled value, updates correctly, and cancels edits', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      vi.mocked(updateUnit).mockResolvedValue(
        { id: 1, name: 'Pieces', created_at: '', updated_at: '' } as unknown as UnitDetail,
      );
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Pcs');
      await user.click(screen.getByText('Pcs'));

      expect(screen.getByText('Edit Satuan')).toBeInTheDocument();
      const input = screen.getByLabelText('Nama Satuan');
      expect(input).toHaveValue('Pcs');

      const cancelBtn = screen.getByRole('button', { name: /batal/i });
      await user.click(cancelBtn);
      expect(screen.queryByText('Edit Satuan')).not.toBeInTheDocument();

      await user.click(screen.getByText('Pcs'));
      const inputAgain = screen.getByLabelText('Nama Satuan');
      await user.clear(inputAgain);
      await user.type(inputAgain, 'Pieces');

      const saveBtn = screen.getByRole('button', { name: /simpan/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(updateUnit).toHaveBeenCalledWith(1, { name: 'Pieces' });
      });

      expect(screen.queryByText('Edit Satuan')).not.toBeInTheDocument();
      expect(screen.getByText('Pieces')).toBeInTheDocument();
      expect(screen.queryByText('Pcs')).not.toBeInTheDocument();
    });
  });

  describe('Delete Unit Flow', () => {
    it('opens delete confirmation and cancels', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Pcs');
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1];

      const deleteBtn = within(firstRow).getByRole('button');
      await user.click(deleteBtn);

      expect(screen.getByText('Hapus Satuan')).toBeInTheDocument();
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Pcs')).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /batal/i });
      await user.click(cancelBtn);

      expect(screen.queryByText('Hapus Satuan')).not.toBeInTheDocument();
      expect(deleteUnit).not.toHaveBeenCalled();
    });

    it('successfully deletes a unit', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      vi.mocked(deleteUnit).mockResolvedValue(undefined);
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Pcs');
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1];

      const deleteBtn = within(firstRow).getByRole('button');
      await user.click(deleteBtn);

      const dialog = screen.getByRole('dialog');
      const confirmDeleteBtn = within(dialog).getByRole('button', { name: /^hapus$/i });
      await user.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(deleteUnit).toHaveBeenCalledWith(1);
      });

      expect(screen.queryByText('Hapus Satuan')).not.toBeInTheDocument();
      expect(screen.queryByText('Pcs')).not.toBeInTheDocument();
      expect(screen.getByText('Box')).toBeInTheDocument();
    });

    it('handles deletion error (e.g., 409 Unit in use)', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      vi.mocked(deleteUnit).mockRejectedValue(
        new Error('Unit ini masih digunakan oleh sales order atau purchase order'),
      );
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Pcs');
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1];

      const deleteBtn = within(firstRow).getByRole('button');
      await user.click(deleteBtn);

      const dialog = screen.getByRole('dialog');
      const confirmDeleteBtn = within(dialog).getByRole('button', { name: /^hapus$/i });
      await user.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(
          screen.getByText('Unit ini masih digunakan oleh sales order atau purchase order'),
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Hapus Satuan')).toBeInTheDocument();
    });
  });
});
