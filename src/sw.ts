/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

declare const self: ServiceWorkerGlobalScope;

/**
 * HOW THE SW GETS THE FIREBASE CONFIG (no secrets):
 *
 * The Firebase client config (apiKey, projectId, etc.) is a PUBLIC configuration.
 * It's already shipped inside the main JS bundle that the browser downloads.
 * The page posts it to the SW via postMessage after the SW activates.
 * The SW stores it here and uses it to initialise firebase/messaging/sw.
 * This avoids hard-coding the config in sw.ts itself (which would make it harder
 * to change), and never involves any private keys or service accounts.
 */
let fcmInitialised = false;

function ensureFcmInitialised(config: Record<string, string>) {
  if (fcmInitialised) return;
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(config);
    const messaging = getMessaging(app);

    onBackgroundMessage(messaging, async (payload) => {
      // Only handle DATA-ONLY messages (no notification block from the server).
      const data = payload.data ?? {};
      const slot = data.slot || 'study';
      const line = data.line || 'Time for your DSA session!';
      const dayKey = data.dayKey || new Date().toISOString().slice(0, 10);

      // If a window of the app is already visible and focused, post a message
      // to the page so it shows the in-app coach overlay — no system notification.
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: false });
      const focusedClient = allClients.find(
        (c) => c.visibilityState === 'visible'
      );

      if (focusedClient) {
        focusedClient.postMessage({
          type: 'SAIRA_COACH_SHOW',
          slot,
          line,
        });
        return; // ← skip system notification when app is in front
      }

      // App is in the background or closed — show a system notification.
      await self.registration.showNotification('SAIRA Coach', {
        body: line,
        icon: '/icons/icon-192.png',
        // image: coach art — sender can include a URL in data.imageUrl
        ...(data.imageUrl ? { image: data.imageUrl } : {}),
        badge: '/icons/favicon-32.png',
        tag: `saira-${slot}-${dayKey}`,
        renotify: false,
        data: { slot, url: data.url || `/today?coach=${slot}` },
        actions: [
          { action: 'start', title: 'Start' },
          { action: 'snooze', title: 'Snooze 15m' },
        ],
      } as NotificationOptions & { renotify?: boolean; image?: string; actions?: { action: string; title: string }[] });
    });

    fcmInitialised = true;
  } catch {
    // FCM init is best-effort in the SW — never crash the whole SW
  }
}

// Accept the Firebase config posted by the page after SW activation.
// The page also uses this to pass the SAIRA_FCM_INIT type.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SAIRA_FCM_INIT' && event.data.config) {
    ensureFcmInitialised(event.data.config as Record<string, string>);
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 1. Clean up old precaches from previous app versions
cleanupOutdatedCaches();

// 2. Precache app shell, HTML, JS, CSS, and bundled seed data injected at build time
precacheAndRoute(self.__WB_MANIFEST);

// 3a. NEVER CACHE: Video files — too large to cache; must stream from network.
// This covers /video/hero.mp4 and any CDN video override via VITE_LANDING_VIDEO_URL.
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/video/') ||
    request.destination === 'video' ||
    /\.mp4$/i.test(url.pathname),
  new NetworkOnly()
);

// 3b. NEVER CACHE: Firebase Auth, Firestore, and Firebase Hosting internals
// Firestore manages its own offline cache (persistentMultipleTabManager).
// Service worker caching of Firestore or Auth network calls causes stale reads and security token desync.
registerRoute(
  ({ url }) =>
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.hostname.includes('apis.google.com') ||
    url.pathname.startsWith('/__/'),
  new NetworkOnly()
);

// 4. Runtime Cache: Google Fonts stylesheets (StaleWhileRevalidate)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// 5. Runtime Cache: Google Fonts font binaries (CacheFirst with 1-year expiration)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// 6. Runtime Cache: Images (icons, avatars, svg, webp) (StaleWhileRevalidate)
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/coach/') ||
    /\.(?:png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'saira-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// 7. SPA Single Page Navigation Fallback
// Return index.html for all page navigations, excluding /__/ Firebase hosting paths and static files.
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/__/, /\/[^/?]+\.[^/]+$/],
});
registerRoute(navigationRoute);


// 9. Notification click listener: opens /today?coach=<slot>
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const slot = event.notification.data?.slot || 'study';
  const action = event.action;
  const targetUrl = action === 'snooze' ? `/today?snooze=${slot}` : `/today?coach=${slot}`;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
