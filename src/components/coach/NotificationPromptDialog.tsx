import React from 'react';
import { Bell, Sparkles, X } from 'lucide-react';
import { loadLocalReminderSettings, saveReminderSettings } from '@/lib/reminderStorage';

interface NotificationPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPromptDialog: React.FC<NotificationPromptDialogProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleEnable = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const settings = loadLocalReminderSettings();
          await saveReminderSettings({ ...settings, notificationsEnabled: true });
        }
      }
    } catch {
      // ignore
    } finally {
      localStorage.setItem('saira:notification_prompt_dismissed', 'true');
      onClose();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('saira:notification_prompt_dismissed', 'true');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enable Study Reminders"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-rise"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-surface border border-primary/30 p-6 sm:p-7 shadow-2xl space-y-5">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-1 rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close notification prompt"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary">
          <Bell className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Milestone Reached
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Enable Daily Study Nudges?
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Congratulations on completing your first item! To help you protect your daily reps, SAIRA can send gentle reminder notifications at <strong>08:30 AM</strong> and <strong>07:00 PM</strong> IST.
          </p>
        </div>

        <div className="bg-surface-2/60 border border-border/60 rounded-2xl p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">No spam, warm tone</p>
          <p>
            You can change reminder times, snooze intervals, or turn them off completely anytime in Settings.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleEnable}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            Enable Reminders
          </button>
        </div>
      </div>
    </div>
  );
};
