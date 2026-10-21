import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Milestone 4 PWA Verification', () => {
  it('verifies all required manifest icons exist in public/icons and are non-empty', () => {
    const iconsDir = path.resolve(__dirname, '../../../../public/icons');

    const expectedIcons = [
      'icon-192.png',
      'icon-512.png',
      'maskable-512.png',
      'apple-touch-icon.png',
      'favicon-32.png',
      'saira-mark.svg',
    ];

    for (const icon of expectedIcons) {
      const fullPath = path.join(iconsDir, icon);
      expect(fs.existsSync(fullPath), `Icon ${icon} must exist in public/icons/`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size, `Icon ${icon} must not be empty`).toBeGreaterThan(0);
    }
  });

  it('verifies index.html contains proper PWA and Apple touch meta tags', () => {
    const indexPath = path.resolve(__dirname, '../../../../index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf-8');

    expect(indexHtml).toContain('name="theme-color" content="#131315"');
    expect(indexHtml).toContain('name="mobile-web-app-capable" content="yes"');
    expect(indexHtml).toContain('name="apple-mobile-web-app-capable" content="yes"');
    expect(indexHtml).toContain('name="apple-mobile-web-app-status-bar-style" content="black-translucent"');
    expect(indexHtml).toContain('name="apple-mobile-web-app-title" content="SAIRA"');
    expect(indexHtml).toContain('rel="apple-touch-icon" href="/icons/apple-touch-icon.png"');
  });

  it('verifies service worker bypass rules exclude Firestore, Auth, and Firebase hosting internals', () => {
    const swPath = path.resolve(__dirname, '../../../sw.ts');
    const swContent = fs.readFileSync(swPath, 'utf-8');

    // Never cache Firestore or Auth
    expect(swContent).toContain('firestore.googleapis.com');
    expect(swContent).toContain('identitytoolkit.googleapis.com');
    expect(swContent).toContain('securetoken.googleapis.com');
    expect(swContent).toContain('firebaseio.com');
    expect(swContent).toContain('/__/');

    // Must use NetworkOnly for these
    expect(swContent).toContain('new NetworkOnly()');

    // Precache injected manifest
    expect(swContent).toContain('precacheAndRoute(self.__WB_MANIFEST)');

    // Skip waiting handler for safe updates
    expect(swContent).toContain('SKIP_WAITING');
  });
});
