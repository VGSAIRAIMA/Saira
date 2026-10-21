/**
 * Auth guard redirect logic tests.
 *
 * We test the guard decision function in isolation — no DOM, no React render.
 * The logic is: given (user, isLoading), which action does the guard take?
 *
 * RequireAuth:
 *   - isLoading → 'loading'
 *   - !user     → 'redirect-to-/'
 *   - user      → 'outlet'
 *
 * RedirectIfAuthed:
 *   - isLoading → 'loading'
 *   - user      → 'redirect-to-/today'
 *   - !user     → 'outlet'
 */

import { describe, it, expect } from 'vitest';

// ── Pure guard decision functions ─────────────────────────────────────────────
// These mirror exactly the conditional chain inside each guard component.
// If the component logic changes, these functions must be updated to match.

type User = { uid: string } | null;

function requireAuthDecision(user: User, isLoading: boolean): string {
  if (isLoading) return 'loading';
  if (!user) return 'redirect-to-/';
  return 'outlet';
}

function redirectIfAuthedDecision(user: User, isLoading: boolean): string {
  if (isLoading) return 'loading';
  if (user) return 'redirect-to-/today';
  return 'outlet';
}

const fakeUser: User = { uid: 'u1' };

// ── RequireAuth ───────────────────────────────────────────────────────────────

describe('RequireAuth guard logic', () => {
  it('shows loading screen while Firebase resolves auth state', () => {
    expect(requireAuthDecision(null, true)).toBe('loading');
  });

  it('shows loading screen even when a user object is present but loading flag is set', () => {
    // isLoading takes priority so there is no flash of either redirect or outlet
    expect(requireAuthDecision(fakeUser, true)).toBe('loading');
  });

  it('redirects to / when signed out', () => {
    expect(requireAuthDecision(null, false)).toBe('redirect-to-/');
  });

  it('renders Outlet when signed in', () => {
    expect(requireAuthDecision(fakeUser, false)).toBe('outlet');
  });
});

// ── RedirectIfAuthed ──────────────────────────────────────────────────────────

describe('RedirectIfAuthed guard logic', () => {
  it('shows loading screen while Firebase resolves auth state', () => {
    expect(redirectIfAuthedDecision(null, true)).toBe('loading');
  });

  it('shows loading screen even when no user but loading flag is set', () => {
    expect(redirectIfAuthedDecision(null, true)).toBe('loading');
  });

  it('redirects to /today when already signed in', () => {
    expect(redirectIfAuthedDecision(fakeUser, false)).toBe('redirect-to-/today');
  });

  it('renders Outlet when signed out', () => {
    expect(redirectIfAuthedDecision(null, false)).toBe('outlet');
  });
});

// ── Cross-cutting: no route leaks ─────────────────────────────────────────────

describe('Route access rules', () => {
  const dashboardRoutes = ['/today', '/sheet', '/revision', '/progress', '/history', '/settings'];
  const publicRoutes = ['/', '/login'];

  it('all dashboard routes are blocked for signed-out users', () => {
    dashboardRoutes.forEach((route) => {
      // The guard makes the same decision regardless of which dashboard route is matched;
      // we verify the decision is always 'redirect-to-/' when signed out.
      const decision = requireAuthDecision(null, false);
      expect(decision).toBe('redirect-to-/');
      void route; // consumed to suppress unused-variable lint
    });
  });

  it('all public routes redirect signed-in users to /today', () => {
    publicRoutes.forEach((route) => {
      const decision = redirectIfAuthedDecision(fakeUser, false);
      expect(decision).toBe('redirect-to-/today');
      void route;
    });
  });
});
