import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { LandingPage } from '@/features/landing/LandingPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { TodayPage } from '@/features/today/TodayPage';
import { SheetPage } from '@/features/sheet/SheetPage';
import { RevisionPage } from '@/features/revision/RevisionPage';
import { ProgressPage } from '@/features/progress/ProgressPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RedirectIfAuthed } from '@/components/auth/RedirectIfAuthed';

export const router = createBrowserRouter([
  // ── Public pages (redirect to /today if already signed in) ──────────────
  {
    element: <RedirectIfAuthed />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },

  // ── Protected pages (redirect to / if signed out) ────────────────────────
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: '/today',
            element: <TodayPage />,
          },
          {
            path: '/sheet',
            element: <SheetPage />,
          },
          {
            path: '/sheet/:phaseId',
            element: <SheetPage />,
          },
          {
            path: '/sheet/:phaseId/:topicId',
            element: <SheetPage />,
          },
          {
            path: '/revision',
            element: <RevisionPage />,
          },
          {
            path: '/progress',
            element: <ProgressPage />,
          },
          {
            path: '/history',
            element: <Navigate to="/progress?tab=history" replace />,
          },
          {
            path: '/settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },

  // ── Unknown routes: go to landing ───────────────────────────────────────
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
