/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '../../../src/components/auth/ProtectedRoute';
import { useAuth } from '../../../src/components/auth/AuthContext';
import type { CurrentUser } from '../../../src/services/users';

vi.mock('../../../src/components/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUser: CurrentUser = {
  id: 1,
  username: 'alice',
  email: 'alice@example.com',
  name: 'Alice',
  role: 'admin',
  is_active: true,
  last_login: new Date().toISOString(),
};

function renderProtectedRoutes(initialPath = '/app') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/app" element={<ProtectedRoute />}>
          <Route index element={<div>Protected content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useAuth).mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects to /login when there is no access token', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthReady: true,
      loadUser: vi.fn(),
      logout: vi.fn(),
    });

    renderProtectedRoutes();

    await waitFor(() => {
      expect(screen.getByText('Login page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('shows loading when a token exists but auth is not ready', () => {
    localStorage.setItem('access', 'token');
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthReady: false,
      loadUser: vi.fn(),
      logout: vi.fn(),
    });

    renderProtectedRoutes();

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects to /login when auth is ready but user is null', async () => {
    localStorage.setItem('access', 'token');
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthReady: true,
      loadUser: vi.fn(),
      logout: vi.fn(),
    });

    renderProtectedRoutes();

    await waitFor(() => {
      expect(screen.getByText('Login page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders the nested route outlet when token exists and user is loaded', () => {
    localStorage.setItem('access', 'token');
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthReady: true,
      loadUser: vi.fn(),
      logout: vi.fn(),
    });

    renderProtectedRoutes();

    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
