import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthLoading } from './AuthLoading';

/**
 * RequireAuth — protects dashboard routes.
 *
 * - While Firebase is resolving sign-in state (isLoading): show AuthLoading.
 * - Signed out: redirect to / (the landing page).
 * - Signed in: render the child route (<Outlet />).
 *
 * This prevents signed-out users from ever seeing /today, /sheet, /revision,
 * /progress, /history, or /settings.
 */
export const RequireAuth: React.FC = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
};
