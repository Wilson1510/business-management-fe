import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute: React.FC = () => {
  const isAuthenticated = localStorage.getItem('access') !== null;

  // Jika tidak memiliki token, arahkan ke login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Jika sudah login, render child routes (Outlet)
  return <Outlet />;
};