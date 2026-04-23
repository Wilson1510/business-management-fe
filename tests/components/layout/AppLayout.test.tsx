/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import AppLayout, { getNavItems } from '../../../src/components/layout/AppLayout';
import { useAuth } from '../../../src/components/auth/AuthContext';
import type { CurrentUser } from '../../../src/services/users';

vi.mock('../../../src/components/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function labelsAndPaths(role: string) {
  return getNavItems(role).map((item) => ({ name: item.name, path: item.path }));
}

describe('getAppNavItems', () => {
  it('returns staff sidebar: products, deliveries, receipts only', () => {
    expect(labelsAndPaths('staff')).toEqual([
      { name: 'Products', path: '/catalog' },
      { name: 'Deliveries', path: '/sales/deliveries' },
      { name: 'Receipts', path: '/purchases/receipts' },
    ]);
  });

  it('returns full admin menu for admin', () => {
    expect(labelsAndPaths('admin')).toEqual([
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Catalog', path: '/catalog' },
      { name: 'Sales', path: '/sales' },
      { name: 'Purchases', path: '/purchases' },
      { name: 'Contacts', path: '/contacts' },
      { name: 'System Users', path: '/settings/users' },
    ]);
  });

  it('uses staff menu for non-admin roles (e.g. future roles)', () => {
    expect(labelsAndPaths('manager')).toEqual(labelsAndPaths('staff'));
  });
});

const layoutUser: CurrentUser = {
  id: 1,
  username: 'alice',
  email: 'alice@example.com',
  name: 'Alice',
  role: 'admin',
  is_active: true,
};

function renderAppLayoutWithAuth(user: CurrentUser) {
  const logout = vi.fn();
  vi.mocked(useAuth).mockReturnValue({
    user,
    isAuthReady: true,
    loadUser: vi.fn(),
    logout,
  });

  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/dashboard" element={<AppLayout />}>
          <Route index element={<div>Dashboard content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  return { logout };
}

describe('AppLayout handleLogout', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useAuth).mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('calls logout and navigates to /login', async () => {
    const { logout } = renderAppLayoutWithAuth(layoutUser);

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Sign Out' }));

    expect(logout).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('Login page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });
});
