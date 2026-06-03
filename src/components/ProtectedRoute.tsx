import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * Simple guard that renders the child route only if a user is authenticated.
 * Otherwise redirects to the login page (which for this MVP is just '/' –
 * the dashboard will show a "Login" button when no user is present).
 */
const ProtectedRoute: React.FC = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
