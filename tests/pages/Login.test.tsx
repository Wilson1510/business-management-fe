/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import Login from '../../src/pages/Login';
import { login } from '../../src/services/auth';
import { useAuth } from '../../src/components/auth/AuthContext';
import type { CurrentUser } from '../../src/services/users';

vi.mock('../../src/services/auth', () => ({
  login: vi.fn(),
}));

vi.mock('../../src/components/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const baseProfile: Omit<CurrentUser, 'role'> = {
  id: 1,
  username: 'user1',
  email: 'u@example.com',
  name: 'User One',
  is_active: true,
};

/**
 * Integrasi navigasi nyata (tanpa mock useNavigate).
 * Memakai MemoryRouter + Routes, bukan createMemoryRouter: data router
 * (createMemoryRouter) memicu error AbortSignal/undici di Vitest sehingga
 * navigate() tidak menyelesaikan transisi rute.
 */
function setupRouter(profile: CurrentUser) {
  vi.mocked(login).mockResolvedValue({
    access: 'access-token',
    refresh: 'refresh-token',
  });
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isAuthReady: true,
    loadUser: vi.fn().mockResolvedValue(profile),
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div>Dashboard home</div>} />
        <Route path="/catalog" element={<div>Catalog home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Login redirect after success', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(login).mockReset();
    vi.mocked(useAuth).mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('navigates admin to /dashboard', async () => {
    const user = userEvent.setup();
    setupRouter({ ...baseProfile, role: 'admin' });

    expect(screen.getByText('Invensys ERP')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Enter username'), 'admin');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard home')).toBeInTheDocument();
    });
    expect(localStorage.getItem('access')).toBe('access-token');
  });

  it('navigates staff to /catalog', async () => {
    const user = userEvent.setup();
    setupRouter({ ...baseProfile, role: 'staff' });

    expect(screen.getByText('Invensys ERP')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Enter username'), 'staff');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Catalog home')).toBeInTheDocument();
    });
  });
});
