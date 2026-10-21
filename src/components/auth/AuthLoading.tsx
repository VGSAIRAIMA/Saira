import React from 'react';
import { SairaMark } from '@/components/SairaLogo';

/**
 * AuthLoading — shown for the ~300 ms while Firebase resolves the sign-in state.
 *
 * Uses the dashboard background (not the cinematic navy) so there is no colour flash
 * if the user lands on a dashboard route and Firebase quickly confirms they are signed in.
 * The spinner is minimal — this screen is almost always invisible.
 */
export const AuthLoading: React.FC = () => {
  return (
    <div
      className="min-h-dvh bg-background flex flex-col items-center justify-center gap-4"
      aria-label="Checking sign-in status…"
      role="status"
    >
      <SairaMark size={48} className="opacity-80 animate-pulse" />
      <p className="text-xs text-muted-foreground tracking-widest uppercase">SAIRA</p>
    </div>
  );
};
