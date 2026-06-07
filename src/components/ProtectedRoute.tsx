import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * Guard that enforces both authentication and role-based access.
 * - Unauthenticated users are redirected to login
 * - Users without Settings access are blocked from /settings route
 */
const ProtectedRoute: React.FC = () => {
  const { user, capabilities } = useAuth();
  const location = useLocation();

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Settings route requires canAccessSettings capability
  if (location.pathname === '/settings' && !capabilities.canAccessSettings) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;