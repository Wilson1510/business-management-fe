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
  type CategoryDetail
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
      
      expect(screen.getByText('Loading categories...')).toBeInTheDocument();
    });

    it('displays error message if fetching fails', async () => {
      vi.mocked(getCategories).mockRejectedValue(new Error('Failed to load categories error'));
      setupRouter();

      await waitFor(() => {
        expect(screen.getByText('Failed to load categories error')).toBeInTheDocument();
      });
      expect(screen.queryByText('Loading categories...')).not.toBeInTheDocument();
    });

    it('displays empty state message when no data', async () => {
      vi.mocked(getCategories).mockResolvedValue([]);
      setupRouter();

      await waitFor(() => {
        expect(screen.getByText('No categories found.')).toBeInTheDocument();
      });
    });

    it('displays populated categories and action buttons', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      setupRouter();

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Furniture')).toBeInTheDocument();

      // Check actions: Add Category button on top
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument();
      
      // Each row should have edit and delete buttons (2 rows x 2 buttons = 4, + 1 for Add Category = 5 total buttons)
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1]; // Index 0 is table header
      
      const buttonsInFirstRow = within(firstRow).getAllByRole('button');
      expect(buttonsInFirstRow).toHaveLength(2); // Pencil and Trash icons
    });
  });

  describe('Add Category Flow', () => {
    it('validates empty form and HTML required input', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /add category/i });
      await user.click(addBtn);

      // Verify modal is opened
      expect(screen.getByText('New Category')).toBeInTheDocument();

      // Ensure input is required
      const input = screen.getByLabelText('Category Name');
      expect(input).toBeRequired();

      // Test frontend manual JS validation guard if form submission triggers natively
      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);
      
      // Because required validation blocks submit in real browsers AND JSDOM + userEvent,
      // our React onSubmit handler won't even fire. Thus 'createCategory' is not called.
      expect(input).toBeInvalid();
      
      expect(createCategory).not.toHaveBeenCalled();
    });

    it('prevents input of whitespace only', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /add category/i });
      await user.click(addBtn);

      const input = screen.getByLabelText('Category Name');
      await user.type(input, '   ');

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);

      // Whitespace is valid at html level but it is prevented by our React onSubmit handler
      expect(input).toBeValid();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(createCategory).not.toHaveBeenCalled();
    });

    it('successfully adds a new category', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(createCategory).mockResolvedValue(
        { id: 3, name: 'Toys', created_at: '', updated_at: '' } as CategoryDetail
    );
      
      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /add category/i });
      await user.click(addBtn);

      const input = screen.getByLabelText('Category Name');
      await user.type(input, 'Toys');

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(createCategory).toHaveBeenCalledWith({ name: 'Toys' });
      });

      // Modal should be closed and list updated
      expect(screen.queryByText('New Category')).not.toBeInTheDocument();
      expect(screen.getByText('Toys')).toBeInTheDocument();
    });

    it('shows API error inside modal when adding fails', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(createCategory).mockRejectedValue(new Error('Name must be unique'));
      
      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /add category/i });
      await user.click(addBtn);

      const input = screen.getByLabelText('Category Name');
      await user.type(input, 'Duplicate Name');

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Name must be unique')).toBeInTheDocument();
      });

      // Modal remains open
      expect(screen.getByText('New Category')).toBeInTheDocument();
    });
  });

  describe('Edit Category Flow', () => {
    it('opens modal with pre-filled value, updates correctly, and cancels edits', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(updateCategory).mockResolvedValue(
        { id: 1, name: 'Smart Electronics', created_at: '', updated_at: '' } as CategoryDetail
      );
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Electronics');
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1]; 
      
      // Pencil button is the first button inside the row
      const editBtn = within(firstRow).getAllByRole('button')[0];
      await user.click(editBtn);

      // Verify Modal configuration
      expect(screen.getByText('Edit Category')).toBeInTheDocument();
      const input = screen.getByLabelText('Category Name');
      expect(input).toHaveValue('Electronics');

      // Test Cancel function
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);
      expect(screen.queryByText('Edit Category')).not.toBeInTheDocument();
      
      // Re-open and process to save
      await user.click(editBtn);
      const inputAgain = screen.getByLabelText('Category Name');
      await user.clear(inputAgain);
      await user.type(inputAgain, 'Smart Electronics');

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(updateCategory).toHaveBeenCalledWith(1, { name: 'Smart Electronics' });
      });

      expect(screen.queryByText('Edit Category')).not.toBeInTheDocument();
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
      
      // Trash button is the second button inside the row
      const deleteBtn = within(firstRow).getAllByRole('button')[1];
      await user.click(deleteBtn);

      expect(screen.getByText('Delete Category')).toBeInTheDocument();
      // Test dynamic deletion prompt text
      expect(screen.getByText(/"Electronics"/)).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);

      expect(screen.queryByText('Delete Category')).not.toBeInTheDocument();
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
      
      const deleteBtn = within(firstRow).getAllByRole('button')[1];
      await user.click(deleteBtn);

      const confirmDeleteBtn = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(deleteCategory).toHaveBeenCalledWith(1);
      });

      expect(screen.queryByText('Delete Category')).not.toBeInTheDocument();
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
      
      const deleteBtn = within(firstRow).getAllByRole('button')[1];
      await user.click(deleteBtn);

      const confirmDeleteBtn = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(screen.getByText('Kategori ini masih digunakan oleh produk')).toBeInTheDocument();
      });

      // Modal should remain open
      expect(screen.getByText('Delete Category')).toBeInTheDocument();
    });
  });
});
