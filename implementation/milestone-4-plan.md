# SAIRA: Milestone 4 (PWA & Offline) Implementation Plan

This document details the architectural plan, Workbox service worker caching policies, PWA manifest, and offline/install UX for Milestone 4 of SAIRA.

---

## 1. Objectives & Scope

Milestone 4 equips SAIRA with full Progressive Web App (PWA) capabilities and bulletproof offline reliability:
1. **Web App Manifest (`public/manifest.webmanifest` & `vite-plugin-pwa`)**:
   - App metadata (name: "SAIRA: DSA Study Tracker", short_name: "SAIRA", theme_color: "#131315", background_color: "#131315", display: "standalone").
   - Complete icon suite: `192x192`, `512x512`, and `maskable-512.png` with purpose `"maskable"` per `07-pwa-and-notifications.md §2`.
   - App shortcuts for `/today`, `/sheet`, and `/revision`.
2. **Custom Service Worker (`src/sw.ts` with `injectManifest`)**:
   - Precaches application shell, HTML, CSS, JS, and bundled curriculum seed JSON.
   - Stale-while-revalidate for local images and Google Fonts stylesheets.
   - Cache-first for Google Fonts webfonts (`.woff2`) with 1-year expiration.
   - Navigation fallback to `/index.html` for single-page routing, explicitly excluding Firebase internal paths (`/__/*`).
   - Listen for `'SKIP_WAITING'` message to activate updates smoothly on user confirmation.
3. **Caching Boundaries (Plain-Words Explanation)**:
   - **What the Service Worker Caches**:
     - *Precached at build/install*: `index.html`, all Vite JavaScript chunks, compiled CSS styles, and bundled JSON seed data.
     - *Runtime cached*: App icons (`/icons/*`), coach avatars (`/coach/*`), Google Fonts stylesheets (`fonts.googleapis.com`), and Google Fonts font binaries (`fonts.gstatic.com`).
   - **What the Service Worker NEVER Caches**:
     - *Firestore network calls (`firestore.googleapis.com`, `*.firebaseio.com`)*: Caching Firestore network requests in a service worker corrupts Firestore's built-in `persistentMultipleTabManager()` offline store, causes stale query responses, and interferes with real-time listeners.
     - *Firebase Auth calls (`identitytoolkit.googleapis.com`, `securetoken.googleapis.com`)*: Security and authentication token refreshes must never be cached.
     - *Firebase hosting internals (`/__/*`)*: Auth helper scripts and OAuth redirect handlers must talk directly to the network.
4. **Update Prompt UX (`src/components/pwa/UpdatePrompt.tsx`)**:
   - `registerType: 'prompt'` via `useRegisterSW`.
   - Non-intrusive floating toast notifying the learner when an updated version is ready.
   - "Update now" button calls `updateServiceWorker(true)` without disrupting unsaved edits.
5. **Install UX (`src/components/pwa/InstallButton.tsx` & hook `usePWAInstall.ts`)**:
   - Captures `beforeinstallprompt` event.
   - Detects `display-mode: standalone` and hides button when already installed.
   - Prominently placed "Install App" button in the sticky top bar and Settings page.
   - iOS helper drawer with "Share → Add to Home Screen" instructions.
6. **Offline Banner UX (`src/components/pwa/OfflineBanner.tsx`)**:
   - Monitors `navigator.onLine` and `online`/`offline` window events.
   - Reassuring banner notifying the user that SAIRA is fully operational offline with local IndexedDB persistence.

---

## 2. File Changes & Additions

```
Saira/
├── vite.config.ts                      # Configure VitePWA with injectManifest & manifest
├── index.html                          # Add Apple mobile web app tags and theme meta
├── src/
│   ├── sw.ts                           # Service worker source (precache, runtime cache, bypasses)
│   ├── components/
│   │   └── pwa/
│   │       ├── usePWAInstall.ts        # Hook capturing beforeinstallprompt & standalone status
│   │       ├── InstallButton.tsx       # Install CTA button (top bar & settings)
│   │       ├── UpdatePrompt.tsx        # "Update available" toast
│   │       └── OfflineBanner.tsx       # "You're offline" reassurance banner
│   └── app/
│       └── AppShell.tsx                # Mount OfflineBanner, UpdatePrompt, and top-bar InstallButton
├── docs/
│   └── PROGRESS.md                     # Update milestone progress
```

---

## 3. Implementation Steps

1. **Configure `vite.config.ts`**:
   - Add `VitePWA` with `strategies: 'injectManifest'`, `srcDir: 'src'`, `filename: 'sw.ts'`.
   - Set `manifest` with icons, `maskable-512.png`, theme colors, shortcuts.
2. **Build `src/sw.ts`**:
   - Import Workbox modules (`precacheAndRoute`, `registerRoute`, `NavigationRoute`, `StaleWhileRevalidate`, `CacheFirst`, `NetworkOnly`).
   - Define exact bypass rules for Firebase Auth & Firestore.
   - Add runtime caching for Google Fonts and local images.
   - Add SPA fallback handler.
3. **Build PWA Components**:
   - `usePWAInstall`: hook capturing `beforeinstallprompt`, detecting iOS and standalone mode.
   - `InstallButton`: Top bar & settings install trigger.
   - `UpdatePrompt`: Floating toast with reload trigger.
   - `OfflineBanner`: Floating offline badge/strip.
4. **Wire into `AppShell.tsx` & `SettingsPage.tsx`**:
   - Mount banner and prompt in `AppShell`.
   - Add Install CTA to top bar and Settings.
5. **Validation**:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build` (verify `dist/sw.js` and `dist/manifest.webmanifest` are generated).
