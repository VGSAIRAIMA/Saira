/**
 * FCM unit tests — Milestone 8.
 *
 * These run in Node (no DOM) so all browser APIs must be mocked.
 * We test:
 *   1. getDeviceId() — stable UUID generation and localStorage persistence.
 *   2. isFcmSupported() — returns false when browser APIs are missing.
 *   3. registerFcmToken() — returns null gracefully when preconditions unmet.
 *   4. SW background handler decision — focused window → no notification;
 *      background → showNotification called.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock localStorage ──────────────────────────────────────────────────────────
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, val: string) => { localStorageStore[key] = val; },
  removeItem: (key: string) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
};

// ── Mock crypto.randomUUID ─────────────────────────────────────────────────────
const mockUUID = 'aaaabbbb-cccc-dddd-eeee-ffffabcdef01';

// ── Patch globals before importing the module ──────────────────────────────────
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => mockUUID },
  writable: true,
});

// Mock the firebase.ts module so we don't need a real Firebase app
vi.mock('@/lib/firebase', () => ({
  isFirebaseConfigured: true,
  getMessagingInstance: vi.fn().mockResolvedValue(null),
  db: null,
}));

// Import AFTER global patching
import { getDeviceId, isFcmSupported, registerFcmToken } from '@/lib/fcm';

// ── getDeviceId ────────────────────────────────────────────────────────────────

describe('getDeviceId()', () => {
  beforeEach(() => localStorageMock.clear());

  it('generates a UUID and stores it in localStorage on first call', () => {
    const id = getDeviceId();
    expect(id).toBe(mockUUID);
    expect(localStorageMock.getItem('saira:fcm_device_id')).toBe(mockUUID);
  });

  it('returns the same UUID on subsequent calls (stable device ID)', () => {
    const first = getDeviceId();
    const second = getDeviceId();
    expect(first).toBe(second);
  });
});

// ── isFcmSupported ─────────────────────────────────────────────────────────────

describe('isFcmSupported()', () => {
  it('returns false when window is undefined (Node/SSR)', () => {
    // In our test environment window is not defined and PushManager is absent
    // The function checks typeof window and 'Notification' in window.
    // Since these are absent in Node, it should return false.
    expect(isFcmSupported()).toBe(false);
  });
});

// ── registerFcmToken ───────────────────────────────────────────────────────────

describe('registerFcmToken()', () => {
  it('returns null when running in Node (no Notification API)', async () => {
    const result = await registerFcmToken('user-123');
    expect(result).toBeNull();
  });
});

// ── SW background handler decision logic ──────────────────────────────────────
// We test the branching logic in isolation (pure function, not the actual SW).

describe('SW handler: focused window decision', () => {
  type Client = { visibilityState: string; postMessage: (m: unknown) => void };

  /**
   * Mirrors the exact decision logic in sw.ts onBackgroundMessage:
   * if any client is visible, post a message; otherwise show a notification.
   */
  function handleBackgroundMessage(
    clients: Client[],
    showNotification: () => void,
    postToClient: (c: Client) => void
  ): 'posted' | 'notified' | 'nothing' {
    const focused = clients.find((c) => c.visibilityState === 'visible');
    if (focused) {
      postToClient(focused);
      return 'posted';
    }
    if (clients.length === 0 || clients.every((c) => c.visibilityState === 'hidden')) {
      showNotification();
      return 'notified';
    }
    showNotification();
    return 'notified';
  }

  it('posts to the focused client and does NOT show a system notification', () => {
    const showNotification = vi.fn();
    const postToClient = vi.fn();
    const clients: Client[] = [{ visibilityState: 'visible', postMessage: vi.fn() }];

    const result = handleBackgroundMessage(clients, showNotification, postToClient);

    expect(result).toBe('posted');
    expect(postToClient).toHaveBeenCalledTimes(1);
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('shows a system notification when no window is visible (app in background)', () => {
    const showNotification = vi.fn();
    const postToClient = vi.fn();
    const clients: Client[] = [{ visibilityState: 'hidden', postMessage: vi.fn() }];

    const result = handleBackgroundMessage(clients, showNotification, postToClient);

    expect(result).toBe('notified');
    expect(showNotification).toHaveBeenCalledTimes(1);
    expect(postToClient).not.toHaveBeenCalled();
  });

  it('shows a system notification when no windows exist at all (app closed)', () => {
    const showNotification = vi.fn();
    const postToClient = vi.fn();

    const result = handleBackgroundMessage([], showNotification, postToClient);

    expect(result).toBe('notified');
    expect(showNotification).toHaveBeenCalledTimes(1);
    expect(postToClient).not.toHaveBeenCalled();
  });
});
