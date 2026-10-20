import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { initCloudSync } from './lib/sync';
import { useSheetStore } from './stores/useSheetStore';
import { useAuthStore } from './stores/useAuthStore';
import './index.css';

// Initialize offline-first cloud sync listener
initCloudSync(useSheetStore, useAuthStore);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

