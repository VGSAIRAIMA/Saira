import React from 'react';
import { Bell, Clock, Globe, Shield } from 'lucide-react';
import { InstallButton } from '@/components/pwa/InstallButton';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <h1 className="font-display text-3xl sm:text-4xl text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Preferences, study reminders, and data backup controls.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl divide-y divide-border/60">
        <div className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Timezone</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Day keys and reminders align with this local timezone.
            </p>
          </div>
          <span className="text-xs font-mono bg-surface-2 px-3 py-1.5 rounded-lg border border-border text-foreground">
            Asia/Kolkata (IST)
          </span>
        </div>

        <div className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Daily Target</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Number of checklist items or problems targeted each day.
            </p>
          </div>
          <span className="text-xs font-mono bg-surface-2 px-3 py-1.5 rounded-lg border border-border text-foreground">
            3 items / day
          </span>
        </div>

        <div className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Study Reminders</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Coach avatar nudges at 08:30 AM and 07:00 PM IST.
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-surface-2/60 px-2.5 py-1 rounded-md border border-border">
            Configurable in M5
          </span>
        </div>

        <div className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Local Data Mode</span>
            </div>
            <p className="text-xs text-muted-foreground">
              All progress is safely kept on your machine.
            </p>
          </div>
          <span className="text-xs text-success font-medium">Local First Active</span>
        </div>
      </div>

      {/* PWA App Installation Section */}
      <InstallButton variant="settings" />
    </div>
  );
};
