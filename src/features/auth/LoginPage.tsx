import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SairaBrand } from '@/components/SairaLogo';
import { useAuthStore } from '@/stores/useAuthStore';
import { CheckCircle2, Shield, ArrowRight, Loader2, AlertCircle, LogOut } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, error, isConfigured, signInWithGoogle, signOutUser, clearError } =
    useAuthStore();

  const handleGoogleSignIn = async () => {
    clearError();
    const loggedInUser = await signInWithGoogle();
    if (loggedInUser) {
      navigate('/sheet');
    }
  };

  return (
    <div className="theme-cinematic min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#FF2E7E]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-surface/60 border border-border p-8 rounded-3xl flex flex-col items-center text-center shadow-2xl backdrop-blur-xl relative z-10">
        <SairaBrand size={48} className="mb-6 hover:scale-105 transition-transform" />

        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
          Master DSA with SAIRA
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Six-phase curriculum, daily streaks, spaced repetition, and cloud sync.
        </p>

        {error && (
          <div className="w-full mb-6 p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-start gap-2.5 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Authentication Failed</p>
              <p className="text-muted-foreground mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {user ? (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full p-4 rounded-2xl bg-surface-2/60 border border-border flex items-center gap-3 text-left">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-12 h-12 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center font-bold text-base text-foreground border border-border">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.displayName || 'Welcome back!'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cloud Sync Active</span>
                </div>
              </div>
            </div>

            <Link
              to="/sheet"
              className="w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-[#FF2E7E] text-white hover:opacity-95 transition-opacity shadow-lg shadow-primary/20"
            >
              <span>Continue to DSA Sheet</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => signOutUser()}
              className="w-full py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 border border-border hover:bg-surface-2/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <button
              type="button"
              disabled={isLoading || !isConfigured}
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-3 bg-surface-2 hover:bg-surface-2/80 border border-border text-foreground transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  {/* Google SVG */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <Link
              to="/sheet"
              className="w-full py-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-surface-2/40 transition-colors"
            >
              <span>Continue in Local Mode (Offline)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Offline-First & Merge Reassurance */}
        <div className="mt-8 pt-6 border-t border-border/60 text-left w-full space-y-2.5">
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 shrink-0 text-primary mt-0.5" />
            <span>
              <strong>Local-First Guarantee:</strong> SAIRA works completely offline with IndexedDB.
              When you sign in, local and cloud progress are seamlessly merged.
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>
              <strong>Non-Destructive:</strong> Notes, confidence levels, and day logs are never
              overwritten. The newest timestamp always wins on conflicts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
