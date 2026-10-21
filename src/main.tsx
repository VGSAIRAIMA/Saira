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

// After the service worker activates, send it the PUBLIC Firebase config so it
// can initialise firebase/messaging/sw for FCM background messages.
// This is NOT a secret — the config is already in the JS bundle.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
      appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
    };
    reg.active?.postMessage({ type: 'SAIRA_FCM_INIT', config });
  }).catch(() => {/* SW not available — ignore */});
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
