import React from 'react';
import { Link } from 'react-router-dom';
import { SairaBrand } from '@/components/SairaLogo';

interface GlassNavProps {
  /** Called when the "Sign in" button is clicked */
  onSignIn: () => void;
  /** True while the sign-in popup is open */
  signingIn?: boolean;
}

/**
 * Glass navigation bar for the public Landing and Login pages.
 *
 * Shows only:
 *   - SAIRA logo (links to /)
 *   - A single "Sign in" liquid-glass button
 *
 * No Home / Sheet / Progress / Reminders links — those are private and
 * only visible after sign-in inside the AppShell.
 */
export const GlassNav: React.FC<GlassNavProps> = ({ onSignIn, signingIn = false }) => {
  return (
    <nav
      className="relative z-10 flex justify-between items-center px-6 md:px-8 py-6 max-w-7xl mx-auto w-full"
      aria-label="Public navigation"
    >
      {/* Logo */}
      <Link to="/" aria-label="SAIRA home">
        <SairaBrand size={32} />
      </Link>

      {/* Single CTA — no nav links for signed-out visitors */}
      <button
        type="button"
        id="glass-nav-sign-in"
        onClick={onSignIn}
        disabled={signingIn}
        className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground hover:scale-[1.03] transition-transform disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        aria-label="Sign in with Google"
      >
        {signingIn ? 'Signing in…' : 'Sign in'}
      </button>
    </nav>
  );
};
