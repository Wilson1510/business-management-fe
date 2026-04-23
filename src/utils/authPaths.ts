/** Halaman utama setelah login / "/" — staff tidak punya akses data dashboard di API. */
export function getDefaultAuthenticatedPath(role: string): string {
  return role === 'admin' ? '/dashboard' : '/catalog'
}

/**
 * Path yang boleh untuk role `staff`: daftar produk di catalog,
 * deliveries, receipts, dan ganti password. Bukan categories/units (hanya admin di UI). Pathname
 * dari useLocation (tanpa query).
 */
export function isStaffAllowedPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/'

  const allowedStaticPaths = new Set([
    '/',
    '/catalog',
    '/sales/deliveries',
    '/purchases/receipts',
    '/profile/password',
  ])

  if (allowedStaticPaths.has(p)) return true;

  const allowedDynamicPatterns = [
    /^\/sales\/deliveries\/[^/]+$/,
    /^\/purchases\/receipts\/[^/]+$/
  ];

  return allowedDynamicPatterns.some(regex => regex.test(p));
}

