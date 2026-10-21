/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

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

// 8. Update activation listener: activate new SW immediately when user clicks "Update"
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

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
