/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import Catalog from '../../src/pages/Catalog';
import { getProducts, deleteProduct, type ProductList } from '../../src/services/products';
import { useAuth } from '../../src/components/auth/AuthContext';

vi.mock('../../src/services/products', () => ({
  getProducts: vi.fn(),
  deleteProduct: vi.fn(),
}));

vi.mock('../../src/components/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Mineral Water',
    sku_number: 'A001',
    category: { id: 1, name: 'Beverage' },
    quantity: 100,
    unit: 'Bottle',
    base_price: 3000,
    price: 5000,
    created_at: '2023-01-01',
    updated_at: '2023-01-01'
  },
  {
    id: 2,
    name: 'Snack Bar',
    sku_number: 'B002',
    category: { id: 2, name: 'Snack' },
    quantity: 50,
    unit: 'Pcs',
    base_price: 1500,
    price: 3000,
    created_at: '2023-01-01',
    updated_at: '2023-01-01'
  }
];

function setupRouter(role: string = 'admin') {
  vi.mocked(useAuth).mockReturnValue({
    user: { role },
  } as ReturnType<typeof useAuth>);

  return render(
    <MemoryRouter initialEntries={['/catalog']}>
      <Routes>
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/product/new" element={<div data-testid="new-product-page" />} />
        <Route path="/catalog/product/:id" element={<div data-testid="product-detail-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Catalog Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('displays loading state initially', async () => {
    // Return a promise that doesn't resolve immediately to test loading state
    vi.mocked(getProducts).mockReturnValue(new Promise(() => {}));
    setupRouter('admin');

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('displays error message if fetching fails', async () => {
    vi.mocked(getProducts).mockRejectedValue(new Error('Network error'));
    setupRouter('admin');

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
  });

  it('displays empty state message', async () => {
    vi.mocked(getProducts).mockResolvedValue([]);
    setupRouter('admin');

    await waitFor(() => {
      expect(screen.getByText('No products found. Start by creating one.')).toBeInTheDocument();
    });
  });

  it('displays products and formats correctly for admin', async () => {
    vi.mocked(getProducts).mockResolvedValue(MOCK_PRODUCTS as ProductList);
    setupRouter('admin');

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    // Check header
    expect(screen.getByText('Product List')).toBeInTheDocument();
    
    // Check elements specific to admin
    expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument();
    expect(screen.getByText('Aksi')).toBeInTheDocument(); // Column header

    // Check formatter Output
    expect(screen.getByText('Mineral Water')).toBeInTheDocument();
    expect(screen.getByText('A001')).toBeInTheDocument();
    expect(screen.getByText('Beverage')).toBeInTheDocument();
    expect(screen.getByText('100 Bottle')).toBeInTheDocument();
    
    // Check multiple occurrences for price (Rp 3.000 for Mineral Water base_price and Snack Bar price)
    const elements3000 = screen.getAllByText(/Rp.*3\.000/);
    expect(elements3000).toHaveLength(2);
    
    expect(screen.getByText(/Rp.*5\.000/)).toBeInTheDocument(); // Mineral Water price
    expect(screen.getByText(/Rp.*1\.500/)).toBeInTheDocument(); // Snack Bar base price
  });

  it('hides admin elements for non-admin user', async () => {
    vi.mocked(getProducts).mockResolvedValue(MOCK_PRODUCTS as ProductList);
    setupRouter('staff');

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /create product/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Aksi')).not.toBeInTheDocument();
    expect(screen.queryByText('Harga Dasar')).not.toBeInTheDocument();
    expect(screen.queryByText('Harga Jual')).not.toBeInTheDocument();
    
    // No trash icon in the document since non-admin
    const rows = screen.getAllByRole('row');
    // First row is the header
    const firstProductRow = rows[1];
    expect(within(firstProductRow).queryByRole('button')).not.toBeInTheDocument();
    expect(within(firstProductRow).queryByText(/Rp.*3\.000/)).not.toBeInTheDocument();
    expect(within(firstProductRow).queryByText(/Rp.*5\.000/)).not.toBeInTheDocument();
  });

  it('navigates to create product page when clicking Create Product button', async () => {
    vi.mocked(getProducts).mockResolvedValue(MOCK_PRODUCTS as ProductList);
    const user = userEvent.setup();
    setupRouter('admin');

    const createBtn = await screen.findByRole('button', { name: /create product/i });
    await user.click(createBtn);

    expect(screen.getByTestId('new-product-page')).toBeInTheDocument();
  });

  it('navigates to product detail when clicking a row as admin', async () => {
    vi.mocked(getProducts).mockResolvedValue(MOCK_PRODUCTS as ProductList);
    const user = userEvent.setup();
    setupRouter('admin');

    // Wait for the table to populate
    await screen.findByText('Mineral Water');
    
    // Click the row
    await user.click(screen.getByText('Mineral Water'));

    expect(screen.getByTestId('product-detail-page')).toBeInTheDocument();
  });

  it('does not navigate when clicking a row as non-admin', async () => {
    vi.mocked(getProducts).mockResolvedValue(MOCK_PRODUCTS as ProductList);
    const user = userEvent.setup();
    setupRouter('staff');

    await screen.findByText('Mineral Water');
    
    await user.click(screen.getByText('Mineral Water'));

    expect(screen.queryByTestId('product-detail-page')).not.toBeInTheDocument();
  });

  it('opens delete confirmation and cancels', async () => {
    vi.mocked(getProducts).mockResolvedValue(MOCK_PRODUCTS as ProductList);
    const user = userEvent.setup();
    setupRouter('admin');

    await screen.findByText('Mineral Water');
    
    const rows = screen.getAllByRole('row');
    const firstProductRow = rows[1];
    const deleteBtn = within(firstProductRow).getByRole('button');
    
    await user.click(deleteBtn);

    // Assert modal is open
    expect(screen.getByText('Delete Product')).toBeInTheDocument();
    
    // Click cancel
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    // Assert modal is closed
    expect(screen.queryByText('Delete Product')).not.toBeInTheDocument();
    expect(deleteProduct).not.toHaveBeenCalled();
  });

  it('deletes a product successfully', async () => {
    vi.mocked(getProducts).mockResolvedValue(MOCK_PRODUCTS as ProductList);
    vi.mocked(deleteProduct).mockResolvedValue(undefined);
    
    const user = userEvent.setup();
    setupRouter('admin');

    await screen.findByText('Mineral Water');
    
    const rows = screen.getAllByRole('row');
    const firstProductRow = rows[1];
    const deleteBtn = within(firstProductRow).getByRole('button');
    
    await user.click(deleteBtn);

    const confirmBtn = screen.getByRole('button', { name: /delete item/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(deleteProduct).toHaveBeenCalledWith(1);
    });

    // Modal should close
    expect(screen.queryByText('Delete Product')).not.toBeInTheDocument();
    
    // The "Mineral Water" item should be removed from view
    expect(screen.queryByText('Mineral Water')).not.toBeInTheDocument();
    // But the other item remains
    expect(screen.getByText('Snack Bar')).toBeInTheDocument();
  });

  it('handles delete error', async () => {
    vi.mocked(getProducts).mockResolvedValue(MOCK_PRODUCTS as ProductList);
    vi.mocked(deleteProduct).mockRejectedValue(new Error('Cannot delete item in use'));
    
    const user = userEvent.setup();
    setupRouter('admin');

    await screen.findByText('Mineral Water');
    
    const rows = screen.getAllByRole('row');
    const firstProductRow = rows[1];
    const deleteBtn = within(firstProductRow).getByRole('button');
    
    await user.click(deleteBtn);

    const confirmBtn = screen.getByRole('button', { name: /delete item/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Cannot delete item in use')).toBeInTheDocument();
    });

    // Modal should still remain open
    expect(screen.getByText('Delete Product')).toBeInTheDocument();
  });

  it('filters products based on search input', async () => {
    vi.mocked(getProducts).mockResolvedValue(MOCK_PRODUCTS as ProductList);
    const user = userEvent.setup();
    setupRouter('admin');

    await screen.findByText('Mineral Water');
    
    const searchInput = screen.getByPlaceholderText('Search by SKU or Name...');
    await user.type(searchInput, 'Snack');

    // Mineral Water should disappear, Snack Bar should remain
    expect(screen.queryByText('Mineral Water')).not.toBeInTheDocument();
    expect(screen.getByText('Snack Bar')).toBeInTheDocument();
    
    // Test empty results
    await user.clear(searchInput);
    await user.type(searchInput, 'NonExistentProduct');
    
    expect(screen.queryByText('Mineral Water')).not.toBeInTheDocument();
    expect(screen.queryByText('Snack Bar')).not.toBeInTheDocument();
    expect(screen.getByText('No products match your search.')).toBeInTheDocument();
  });
});
