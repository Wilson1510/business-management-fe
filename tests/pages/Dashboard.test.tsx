/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import Dashboard from '../../src/pages/Dashboard';
import { getDashboardMetrics, getDashboardTopData } from '../../src/services/dashboard';

// Mock the API services
vi.mock('../../src/services/dashboard', () => ({
  getDashboardMetrics: vi.fn(),
  getDashboardTopData: vi.fn(),
}));

const mockMetrics = {
  total_revenue: 15000.5,
  gross_margin: 2500.25,
  active_sales_orders: 12,
  active_purchase_orders: 5,
};

const mockTopData = {
  top_selling_products: [
    { id: 1, name: 'Product A', sku_number: 'SKU-A', sold_qty: 150, unit: 'pc' },
  ],
  slow_moving_products: [
    { id: 2, name: 'Product B', sku_number: 'SKU-B', sold_qty: 2, unit: 'box' },
  ],
  top_customers: [
    { id: 1, name: 'Customer X', total_purchased: 5000 },
  ],
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state initially', () => {
    // Return unresolved promises to freeze the UI in loading state
    vi.mocked(getDashboardMetrics).mockReturnValue(new Promise(() => {}));
    vi.mocked(getDashboardTopData).mockReturnValue(new Promise(() => {}));

    render(<Dashboard />);
    
    // Check loading indicator '…' for the 4 metric cards
    expect(screen.getAllByText('…')).toHaveLength(4);
    
    // Check 'Loading…' text for the 3 lists (Top Selling, Slow Moving, Top Customers)
    expect(screen.getAllByText('Loading…')).toHaveLength(3);
  });

  it('renders metrics and lists successfully when APIs resolve', async () => {
    vi.mocked(getDashboardMetrics).mockResolvedValue(mockMetrics);
    vi.mocked(getDashboardTopData).mockResolvedValue(mockTopData);

    render(<Dashboard />);

    // Wait until loading finishes and active_sales_orders shows ('12')
    await waitFor(() => {
      expect(screen.queryByText('12')).toBeInTheDocument();
    });

    // Verify Active Purchases
    expect(screen.getByText('5')).toBeInTheDocument();

    // Verify list items text is rendered
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('SKU-A')).toBeInTheDocument();
    
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText('SKU-B')).toBeInTheDocument();

    expect(screen.getByText('Customer X')).toBeInTheDocument();
  });

  it('renders empty state messages when lists are empty', async () => {
    vi.mocked(getDashboardMetrics).mockResolvedValue(mockMetrics);
    vi.mocked(getDashboardTopData).mockResolvedValue({
      top_selling_products: [],
      slow_moving_products: [],
      top_customers: [],
    });

    render(<Dashboard />);

    // Wait until 'No data yet.' appears 3 times (for 3 lists)
    await waitFor(() => {
      expect(screen.getAllByText('No data yet.')).toHaveLength(3);
    });
  });

  it('renders error message when API fails', async () => {
    // Force metrics to throw an error
    vi.mocked(getDashboardMetrics).mockRejectedValue(new Error('Network Error!'));
    vi.mocked(getDashboardTopData).mockResolvedValue(mockTopData);

    render(<Dashboard />);

    // The error component should appear with the correct message
    await waitFor(() => {
      expect(screen.getByText('Network Error!')).toBeInTheDocument();
    });
    
    // Ensure the loading state is removed from the lists
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  });
});
