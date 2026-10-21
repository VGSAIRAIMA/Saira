import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      __FIREBASE_CONFIG__: JSON.stringify({
        apiKey: env.VITE_FIREBASE_API_KEY || '',
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: env.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: env.VITE_FIREBASE_APP_ID || '',
      }),
    },
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'html-build-id',
        transformIndexHtml(html: string) {
          const buildId = Date.now().toString();
          return html.replace(
            '</head>',
            `    <meta name="build-id" content="${buildId}" />\n  </head>`
          );
        },
      },
      VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        name: 'SAIRA: DSA Study Tracker',
        short_name: 'SAIRA',
        description: 'Daily DSA sheet, streaks and reminders',
        start_url: '/today',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#131315',
        theme_color: '#131315',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Today', url: '/today' },
          { name: 'Sheet', url: '/sheet' },
          { name: 'Revision', url: '/revision' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json}'],
        // Never precache video files — they are large and must stream from the network.
        // Also never precache the README inside public/video/.
        globIgnores: ['**/video/**', '**/*.mp4', '**/*.webm', '**/*.mov'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
};
});
