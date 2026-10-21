import React from 'react';
import { Link } from 'react-router-dom';
import { SairaBrand } from '@/components/SairaLogo';

interface GlassNavProps {
  /** Called when the "Start today" CTA is clicked */
  onCta: () => void;
  /** Whether the sign-in is in progress (shows a spinner or disables the button) */
  ctaLoading?: boolean;
}

/**
 * Glass navigation bar used on the Landing and Login pages.
 * Desktop: logo + nav links + CTA button.
 * Mobile (< md): logo + CTA only (nav links hidden).
 */
export const GlassNav: React.FC<GlassNavProps> = ({ onCta, ctaLoading = false }) => {
  return (
    <nav
      className="relative z-10 flex justify-between items-center px-6 md:px-8 py-6 max-w-7xl mx-auto w-full"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <Link to="/" aria-label="SAIRA home">
        <SairaBrand size={32} />
      </Link>

      {/* Nav links — hidden on mobile */}
      <div className="hidden md:flex items-center gap-8" role="list">
        <Link
          to="/"
          className="text-sm text-foreground transition-colors"
          role="listitem"
          aria-current="page"
        >
          Home
        </Link>
        <Link
          to="/sheet"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          role="listitem"
        >
          Sheet
        </Link>
        <Link
          to="/progress"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          role="listitem"
        >
          Progress
        </Link>
        <Link
          to="/settings"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          role="listitem"
        >
          Reminders
        </Link>
      </div>

      {/* CTA */}
      <button
        type="button"
        id="glass-nav-cta"
        onClick={onCta}
        disabled={ctaLoading}
        className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground hover:scale-[1.03] transition-transform disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        aria-label="Start today — sign in with Google"
      >
        {ctaLoading ? 'Signing in…' : 'Start today'}
      </button>
    </nav>
  );
};
