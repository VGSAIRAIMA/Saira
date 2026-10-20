import React from 'react';
import { Link } from 'react-router-dom';
import { SairaBrand } from '@/components/SairaLogo';

export const LoginPage: React.FC = () => {
  return (
    <div className="theme-cinematic min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-surface/50 border border-border p-8 rounded-2xl flex flex-col items-center text-center shadow-xl backdrop-blur-md">
        <SairaBrand size={44} className="mb-6" />
        <h1 className="font-display text-3xl mb-2">Welcome to SAIRA</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Sign in to sync your DSA progress across laptop and phone.
        </p>

        <Link
          to="/today"
          className="liquid-glass w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform mb-4"
        >
          <span>Continue to App (Local Mode)</span>
        </Link>

        <p className="text-xs text-muted-foreground mt-4">
          Google Cloud Sync will be enabled in Milestone 2. Your offline data will automatically
          merge.
        </p>
      </div>
    </div>
  );
};
