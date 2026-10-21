import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroVideo } from '@/components/HeroVideo';
import { GlassNav } from '@/components/GlassNav';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Cinematic landing page — Milestone 7.
 *
 * Layout: fullscreen video → glass nav → centred hero → footer.
 * The hero is vertically centred so it fills the viewport at any size
 * (1366×768, 1920×1080, and 360 px wide) without needing to scroll.
 *
 * "Continue with Google" / nav "Sign in" → real Firebase Google sign-in.
 * On success the user is sent to /today.
 * No video is rendered on any dashboard route.
 */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, isLoading, error, clearError } = useAuthStore();
  const [localLoading, setLocalLoading] = useState(false);

  const handleSignIn = async () => {
    clearError();
    setLocalLoading(true);
    const loggedInUser = await signInWithGoogle();
    setLocalLoading(false);
    if (loggedInUser) {
      navigate('/today');
    }
  };

  const busy = isLoading || localLoading;

  return (
    <div className="theme-cinematic relative min-h-dvh overflow-hidden bg-[hsl(201_100%_13%)] text-foreground">
      {/* ── Video layer ── */}
      <HeroVideo />

      {/* ── Scrim: subtle dark veil so text stays readable over bright footage ── */}
      <div className="absolute inset-0 z-[1] bg-black/20 pointer-events-none" aria-hidden="true" />

      {/* ── Content layer: fills dvh, hero vertically centred ── */}
      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* Glass navigation — logo + Sign in only */}
        <GlassNav onSignIn={handleSignIn} signingIn={busy} />

        {/* Hero — flex-1 so it takes remaining height; items/justify-center centres content */}
        <main
          className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-16"
          id="hero"
        >
          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="mb-8 px-5 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-red-300 max-w-md animate-fade-rise"
            >
              {error}
              <button
                type="button"
                onClick={clearError}
                className="ml-3 underline text-xs text-red-300/70 hover:text-red-300 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* H1 — Instrument Serif, cinematic scale, spec-exact tracking */}
          <h1
            className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-7xl font-normal text-balance animate-fade-rise"
          >
            Where{' '}
            <em className="not-italic text-muted-foreground">dreams</em>{' '}
            rise{' '}
            <em className="not-italic text-muted-foreground">through the daily reps.</em>
          </h1>

          {/* Subtext */}
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-6 leading-relaxed animate-fade-rise-delay">
            A quiet place to learn data structures and algorithms.
            One sheet, one streak, one gentle nudge a day.
          </p>

          {/* Primary CTA */}
          <button
            type="button"
            id="hero-cta"
            onClick={handleSignIn}
            disabled={busy}
            className="liquid-glass rounded-full px-14 py-5 text-base text-foreground mt-10 hover:scale-[1.03] transition-transform cursor-pointer animate-fade-rise-delay-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
            aria-label="Continue with Google — sign in"
          >
            {busy ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </main>

        {/* Footer — pinned to bottom by flex layout */}
        <footer className="relative z-10 text-center text-xs text-muted-foreground py-4 px-6">
          SAIRA · Since 2026 · Built for Raima
        </footer>
      </div>
    </div>
  );
};
