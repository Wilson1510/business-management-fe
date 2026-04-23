import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export const ProtectedRoute: React.FC = () => {
  const { user, isAuthReady } = useAuth()
  const hasToken = localStorage.getItem('access') !== null

  if (!hasToken) {
    return <Navigate to="/login" replace />
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dim dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
