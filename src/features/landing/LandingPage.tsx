import React from 'react';
import { Link } from 'react-router-dom';
import { SairaBrand } from '@/components/SairaLogo';

export const LandingPage: React.FC = () => {
  return (
    <div className="theme-cinematic min-h-screen bg-background text-foreground flex flex-col justify-between p-6 md:p-12">
      <header className="flex justify-between items-center max-w-6xl mx-auto w-full">
        <SairaBrand size={36} />
        <Link
          to="/today"
          className="liquid-glass text-sm px-6 py-2.5 rounded-full text-foreground hover:scale-[1.03] transition-transform"
        >
          Open App
        </Link>
      </header>

      <main className="max-w-4xl mx-auto w-full text-center py-20 flex flex-col items-center">
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2px] text-balance">
          Where <em className="not-italic text-muted-foreground">dreams rise</em> through the{' '}
          <em className="not-italic text-muted-foreground">daily reps.</em>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mt-8 leading-relaxed">
          A quiet place to learn data structures and algorithms in Java. One sheet, one streak, one
          gentle nudge a day.
        </p>
        <div className="mt-10 flex gap-4 items-center">
          <Link
            to="/today"
            className="liquid-glass px-10 py-4 rounded-full text-base font-medium hover:scale-[1.03] transition-transform"
          >
            Start Today
          </Link>
          <Link
            to="/sheet"
            className="px-8 py-4 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Explore Roadmap →
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-4">
        SAIRA · Since 2026 · Built for Raima
      </footer>
    </div>
  );
};
