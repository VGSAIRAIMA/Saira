import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { LandingPage } from '@/features/landing/LandingPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { TodayPage } from '@/features/today/TodayPage';
import { SheetPage } from '@/features/sheet/SheetPage';
import { RevisionPage } from '@/features/revision/RevisionPage';
import { ProgressPage } from '@/features/progress/ProgressPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
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
  {
    path: '*',
    element: <Navigate to="/today" replace />,
  },
]);
