import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { isStaffAllowedPath } from '../../utils/authPaths'

/** Membatasi staff ke modul catalog, deliveries, dan receipts saja. */
export function StaffRouteGuard() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  if (user?.role === 'staff' && !isStaffAllowedPath(pathname)) {
    return <Navigate to="/catalog" replace />
  }

  return <Outlet />
}
