/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import CatalogLayout from '../../../src/components/layout/CatalogLayout';
import { useAuth } from '../../../src/components/auth/AuthContext';
import type { CurrentUser } from '../../../src/services/users';

// Mock the useAuth hook
vi.mock('../../../src/components/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockAdmin: CurrentUser = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  is_active: true,
  last_login: new Date().toISOString(),
};

const mockStaff: CurrentUser = {
  id: 2,
  username: 'staff',
  email: 'staff@example.com',
  name: 'Staff User',
  role: 'staff',
  is_active: true,
  last_login: new Date().toISOString(),
};

function renderLayout(user: CurrentUser) {
  vi.mocked(useAuth).mockReturnValue({
    user,
    isAuthReady: true,
    loadUser: vi.fn(),
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={['/catalog']}>
      <Routes>
        <Route path="/catalog" element={<CatalogLayout />}>
          <Route index element={<div data-testid="outlet-content">Outlet Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('CatalogLayout', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  describe('when user is admin', () => {
    it('renders "Catalog Hub" title', () => {
      renderLayout(mockAdmin);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Katalog');
    });

    it('renders 3 navigation tabs', () => {
      renderLayout(mockAdmin);
      // We expect the text within the links
      expect(screen.getByRole('link', { name: /produk/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /kategori/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /satuan/i })).toBeInTheDocument();
    });
    
    it('renders the Outlet content', () => {
      renderLayout(mockAdmin);
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
    });
  });

  describe('when user is non-admin (staff)', () => {
    it('renders "Products" title', () => {
      renderLayout(mockStaff);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Produk');
    });

    it('does not render navigation tabs', () => {
      renderLayout(mockStaff);
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('renders the Outlet content', () => {
      renderLayout(mockStaff);
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
    });
  });
});
