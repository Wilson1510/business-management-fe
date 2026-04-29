/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import Categories from '../../src/pages/Categories';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryList,
  type CategoryDetail,
} from '../../src/services/categories';

vi.mock('../../src/services/categories', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const MOCK_CATEGORIES = [
  {
    id: 1,
    name: 'Electronics',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  },
  {
    id: 2,
    name: 'Furniture',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  },
];

function setupRouter() {
  return render(
    <MemoryRouter initialEntries={['/categories']}>
      <Routes>
        <Route path="/categories" element={<Categories />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Categories Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initial State & Data Fetching', () => {
    it('displays loading state initially', async () => {
      vi.mocked(getCategories).mockReturnValue(new Promise(() => {}));
      setupRouter();

      expect(screen.getByText('Memuat kategori...')).toBeInTheDocument();
    });

    it('displays error message if fetching fails', async () => {
      vi.mocked(getCategories).mockRejectedValue(new Error('Failed to load categories error'));
      setupRouter();

      await waitFor(() => {
        expect(screen.getByText('Failed to load categories error')).toBeInTheDocument();
      });
      expect(screen.queryByText('Memuat kategori...')).not.toBeInTheDocument();
    });

    it('displays empty state message when no data', async () => {
      vi.mocked(getCategories).mockResolvedValue([]);
      setupRouter();

      await waitFor(() => {
        expect(screen.getByText('Belum ada kategori')).toBeInTheDocument();
      });
    });

    it('displays populated categories and action buttons', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      setupRouter();

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });

      expect(screen.getByText('Furniture')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /tambah kategori/i })).toBeInTheDocument();

      const rows = screen.getAllByRole('row');
      const firstRow = rows[1];

      const buttonsInFirstRow = within(firstRow).getAllByRole('button');
      expect(buttonsInFirstRow).toHaveLength(1);
    });
  });

  describe('Add Category Flow', () => {
    it('validates empty form and HTML required input', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /tambah kategori/i });
      await user.click(addBtn);

      expect(screen.getByRole('heading', { name: /tambah kategori/i })).toBeInTheDocument();

      const input = screen.getByLabelText('Nama Kategori');
      expect(input).toBeRequired();

      const saveBtn = screen.getByRole('button', { name: /simpan/i });
      await user.click(saveBtn);

      expect(input).toBeInvalid();

      expect(createCategory).not.toHaveBeenCalled();
    });

    it('prevents input of whitespace only', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /tambah kategori/i });
      await user.click(addBtn);

      const input = screen.getByLabelText('Nama Kategori');
      await user.type(input, '   ');

      const saveBtn = screen.getByRole('button', { name: /simpan/i });
      await user.click(saveBtn);

      expect(input).toBeValid();
      expect(screen.getByText('Nama wajib diisi')).toBeInTheDocument();
      expect(createCategory).not.toHaveBeenCalled();
    });

    it('successfully adds a new category', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(createCategory).mockResolvedValue(
        { id: 3, name: 'Toys', created_at: '', updated_at: '' } as CategoryDetail,
      );

      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /tambah kategori/i });
      await user.click(addBtn);

      const input = screen.getByLabelText('Nama Kategori');
      await user.type(input, 'Toys');

      const saveBtn = screen.getByRole('button', { name: /simpan/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(createCategory).toHaveBeenCalledWith({ name: 'Toys' });
      });

      expect(screen.queryByRole('heading', { name: /tambah kategori/i })).not.toBeInTheDocument();
      expect(screen.getByText('Toys')).toBeInTheDocument();
    });

    it('shows API error inside modal when adding fails', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(createCategory).mockRejectedValue(new Error('Name must be unique'));

      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /tambah kategori/i });
      await user.click(addBtn);

      const input = screen.getByLabelText('Nama Kategori');
      await user.type(input, 'Duplicate Name');

      const saveBtn = screen.getByRole('button', { name: /simpan/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Name must be unique')).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { name: /tambah kategori/i })).toBeInTheDocument();
    });
  });

  describe('Edit Category Flow', () => {
    it('opens modal with pre-filled value, updates correctly, and cancels edits', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(updateCategory).mockResolvedValue(
        { id: 1, name: 'Smart Electronics', created_at: '', updated_at: '' } as CategoryDetail,
      );
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Electronics');
      await user.click(screen.getByText('Electronics'));

      expect(screen.getByText('Edit Kategori')).toBeInTheDocument();
      const input = screen.getByLabelText('Nama Kategori');
      expect(input).toHaveValue('Electronics');

      const cancelBtn = screen.getByRole('button', { name: /batal/i });
      await user.click(cancelBtn);
      expect(screen.queryByText('Edit Kategori')).not.toBeInTheDocument();

      await user.click(screen.getByText('Electronics'));
      const inputAgain = screen.getByLabelText('Nama Kategori');
      await user.clear(inputAgain);
      await user.type(inputAgain, 'Smart Electronics');

      const saveBtn = screen.getByRole('button', { name: /simpan/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(updateCategory).toHaveBeenCalledWith(1, { name: 'Smart Electronics' });
      });

      expect(screen.queryByText('Edit Kategori')).not.toBeInTheDocument();
      expect(screen.getByText('Smart Electronics')).toBeInTheDocument();
      expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
    });
  });

  describe('Delete Category Flow', () => {
    it('opens delete confirmation and cancels', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Electronics');
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1];

      const deleteBtn = within(firstRow).getByRole('button');
      await user.click(deleteBtn);

      expect(screen.getByText('Hapus Kategori')).toBeInTheDocument();
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Electronics')).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /batal/i });
      await user.click(cancelBtn);

      expect(screen.queryByText('Hapus Kategori')).not.toBeInTheDocument();
      expect(deleteCategory).not.toHaveBeenCalled();
    });

    it('successfully deletes a category', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(deleteCategory).mockResolvedValue(undefined);
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Electronics');
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1];

      const deleteBtn = within(firstRow).getByRole('button');
      await user.click(deleteBtn);

      const dialog = screen.getByRole('dialog');
      const confirmDeleteBtn = within(dialog).getByRole('button', { name: /^hapus$/i });
      await user.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(deleteCategory).toHaveBeenCalledWith(1);
      });

      expect(screen.queryByText('Hapus Kategori')).not.toBeInTheDocument();
      expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
      expect(screen.getByText('Furniture')).toBeInTheDocument();
    });

    it('handles deletion error (e.g., 409 Category in use)', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(deleteCategory).mockRejectedValue(new Error('Kategori ini masih digunakan oleh produk'));
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Electronics');
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1];

      const deleteBtn = within(firstRow).getByRole('button');
      await user.click(deleteBtn);

      const dialog = screen.getByRole('dialog');
      const confirmDeleteBtn = within(dialog).getByRole('button', { name: /^hapus$/i });
      await user.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(screen.getByText('Kategori ini masih digunakan oleh produk')).toBeInTheDocument();
      });

      expect(screen.getByText('Hapus Kategori')).toBeInTheDocument();
    });
  });
});
