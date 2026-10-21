import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthLoading } from './AuthLoading';

/**
 * RedirectIfAuthed — wraps public pages (/ and /login).
 *
 * - While Firebase is resolving sign-in state (isLoading): show AuthLoading.
 * - Signed in: redirect to /today (the user is already authenticated).
 * - Signed out: render the child route (<Outlet />).
 *
 * This prevents signed-in users from seeing the landing page or login page.
 */
export const RedirectIfAuthed: React.FC = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <AuthLoading />;
  if (user) return <Navigate to="/today" replace />;
  return <Outlet />;
};
