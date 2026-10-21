import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroVideo } from '@/components/HeroVideo';
import { GlassNav } from '@/components/GlassNav';
import { SairaMark } from '@/components/SairaLogo';
import { useAuthStore } from '@/stores/useAuthStore';
import { AlertCircle, Loader2, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';

/**
 * Cinematic login page — Milestone 7.
 *
 * Reuses the same HeroVideo and GlassNav as the landing page.
 * min-h-dvh keeps the card centred on one screen at any viewport.
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, error, isConfigured, signInWithGoogle, signOutUser, clearError } =
    useAuthStore();

  const handleSignIn = async () => {
    clearError();
    const loggedInUser = await signInWithGoogle();
    if (loggedInUser) {
      navigate('/today');
    }
  };

  return (
    <div className="theme-cinematic relative min-h-dvh overflow-hidden bg-[hsl(201_100%_13%)] text-foreground">
      {/* ── Video layer ── */}
      <HeroVideo />

      {/* ── Scrim ── */}
      <div className="absolute inset-0 z-[1] bg-black/25 pointer-events-none" aria-hidden="true" />

      {/* ── Content layer ── */}
      <div className="relative z-10 flex flex-col min-h-dvh">
        <GlassNav onSignIn={handleSignIn} signingIn={isLoading} />

        {/* Centred glass card */}
        <main
          className="flex-1 flex items-center justify-center px-6 py-10"
          id="login-main"
        >
          <div
            className="liquid-glass rounded-3xl w-full max-w-md p-8 sm:p-10 flex flex-col items-center text-center animate-fade-rise"
            role="main"
            aria-label="Sign in to SAIRA"
          >
            {/* Brand mark */}
            <SairaMark size={64} className="mb-6 drop-shadow-lg" />

            <h1 className="font-display text-3xl sm:text-4xl font-normal tracking-tight mb-3">
              Welcome to SAIRA
            </h1>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs">
              Your DSA sheet, daily streak and coach — all in one quiet place.
            </p>

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="w-full mb-6 p-3.5 rounded-xl bg-black/40 border border-red-400/30 text-red-300 text-xs flex items-start gap-2.5 text-left animate-fade-rise"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-medium">Sign-in failed</p>
                  <p className="text-red-300/70 mt-0.5">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-red-300/50 hover:text-red-300 text-xs underline cursor-pointer"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Signed-in state */}
            {user ? (
              <div className="w-full flex flex-col items-center gap-4 animate-fade-rise">
                {/* User card */}
                <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-left">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName ?? 'User avatar'}
                      className="w-12 h-12 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-base text-foreground border border-white/20">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.displayName ?? 'Welcome back!'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Cloud Sync Active</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  id="login-continue-btn"
                  onClick={() => navigate('/today')}
                  className="w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#8B3DFF] to-[#FF2E7E] text-white hover:opacity-95 transition-opacity shadow-lg shadow-purple-900/30 cursor-pointer"
                >
                  <span>Continue to Today</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => signOutUser()}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            ) : (
              /* Sign-in state */
              <button
                type="button"
                id="login-google-btn"
                disabled={isLoading || !isConfigured}
                onClick={handleSignIn}
                className="w-full py-4 px-6 rounded-xl font-medium text-sm flex items-center justify-center gap-3 liquid-glass text-foreground hover:scale-[1.02] active:scale-[0.99] transition-transform disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Continue with Google"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            )}

            {/* Offline mode link */}
            {!user && (
              <p className="mt-5 text-xs text-muted-foreground">
                No account yet?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/today')}
                  className="underline text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Use offline mode
                </button>{' '}
                — your progress is saved locally and synced when you sign in later.
              </p>
            )}
          </div>
        </main>

        <footer className="text-center text-xs text-muted-foreground py-4 px-6">
          SAIRA · Since 2026 · Built for Raima
        </footer>
      </div>
    </div>
  );
};
