import { describe, expect, it } from 'vitest';
import {
  getDefaultAuthenticatedPath,
  isStaffAllowedPath,
} from '../../src/utils/authPaths';

describe('getDefaultAuthenticatedPath', () => {
  it('returns /dashboard for admin', () => {
    expect(getDefaultAuthenticatedPath('admin')).toBe('/dashboard');
  });

  it('returns /catalog for staff', () => {
    expect(getDefaultAuthenticatedPath('staff')).toBe('/catalog');
  });

  it('returns /catalog for any non-admin role', () => {
    expect(getDefaultAuthenticatedPath('manager')).toBe('/catalog');
  });
});

describe('isStaffAllowedPath', () => {
  it('allows root for redirect flow', () => {
    expect(isStaffAllowedPath('/')).toBe(true);
  });

  it('allows catalog index only, not product forms', () => {
    expect(isStaffAllowedPath('/catalog')).toBe(true);
    expect(isStaffAllowedPath('/catalog/product/new')).toBe(false);
    expect(isStaffAllowedPath('/catalog/product/3')).toBe(false);
  });

  it('rejects catalog categories and units (admin-only)', () => {
    expect(isStaffAllowedPath('/catalog/categories')).toBe(false);
    expect(isStaffAllowedPath('/catalog/units')).toBe(false);
  });

  it('allows change password route', () => {
    expect(isStaffAllowedPath('/profile/password')).toBe(true);
  });

  it('allows deliveries list and detail only under sales', () => {
    expect(isStaffAllowedPath('/sales/deliveries')).toBe(true);
    expect(isStaffAllowedPath('/sales/deliveries/42')).toBe(true);
  });

  it('allows receipts list and detail only under purchases', () => {
    expect(isStaffAllowedPath('/purchases/receipts')).toBe(true);
    expect(isStaffAllowedPath('/purchases/receipts/7')).toBe(true);
  });

  it('rejects other sales and purchases routes', () => {
    expect(isStaffAllowedPath('/sales')).toBe(false);
    expect(isStaffAllowedPath('/sales/new')).toBe(false);
    expect(isStaffAllowedPath('/sales/12')).toBe(false);
    expect(isStaffAllowedPath('/purchases')).toBe(false);
    expect(isStaffAllowedPath('/purchases/new')).toBe(false);
  });

  it('rejects dashboard, contacts, settings', () => {
    expect(isStaffAllowedPath('/dashboard')).toBe(false);
    expect(isStaffAllowedPath('/contacts/customers')).toBe(false);
    expect(isStaffAllowedPath('/settings/users')).toBe(false);
  });

  it('normalizes trailing slash', () => {
    expect(isStaffAllowedPath('/catalog/')).toBe(true);
  });
});
