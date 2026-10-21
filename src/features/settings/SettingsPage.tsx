import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Clock,
  Globe,
  Shield,
  Volume2,
  VolumeX,
  Sparkles,
  Info,
  CheckCircle,
  AlertCircle,
  Play,
  Smartphone,
} from 'lucide-react';
import { InstallButton } from '@/components/pwa/InstallButton';
import { CoachOverlay } from '@/components/coach/CoachOverlay';
import { ReminderSettings, CoachTheme } from '@/types/sheet';
import {
  loadLocalReminderSettings,
  saveReminderSettings,
  deriveFirstName,
} from '@/lib/reminderStorage';
import { showLocalNotification } from '@/lib/notifications';
import { pickLine } from '@/lib/coachLines';
import { isFcmSupported } from '@/lib/fcm';
import { useSheetStore } from '@/stores/useSheetStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { DeleteAccountSection } from '@/components/settings/DeleteAccountSection';

const DAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

export const SettingsPage: React.FC = () => {
  const dailyTarget = useSheetStore((s) => s.dailyTarget);
  const setDailyTarget = useSheetStore((s) => s.setDailyTarget);
  const user = useAuthStore((s) => s.user);

  const [settings, setSettings] = useState<ReminderSettings>(() => loadLocalReminderSettings());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';
  });

  const updateSetting = useCallback(
    async <K extends keyof ReminderSettings>(key: K, val: ReminderSettings[K]) => {
      setSettings((prev) => {
        const updated = { ...prev, [key]: val };
        void saveReminderSettings(updated);
        return updated;
      });
    },
    []
  );

  const toggleDay = (dayId: number) => {
    const current = settings.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
    let next: number[];
    if (current.includes(dayId)) {
      if (current.length === 1) return; // keep at least 1 day
      next = current.filter((d: number) => d !== dayId);
    } else {
      next = [...current, dayId];
    }
    updateSetting('daysOfWeek', next);
  };

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'notifications' as PermissionName })
        .then((status) => {
          const handleChange = () => {
            const perm = Notification.permission;
            setNotificationPermission(perm);
            if (perm === 'denied') {
              void updateSetting('notificationsEnabled', false);
            }
          };
          status.addEventListener('change', handleChange);
        })
        .catch(() => {});
    }
  }, [updateSetting]);

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        await updateSetting('notificationsEnabled', true);
        if (user?.uid) {
          const { registerFcmToken } = await import('@/lib/fcm');
          void registerFcmToken(user.uid);
        }
      } else {
        await updateSetting('notificationsEnabled', false);
      }
    }
  };

  const handlePreviewCoach = () => {
    setPreviewOpen(true);
    if (notificationPermission === 'granted') {
      const learnerName = deriveFirstName(user?.displayName);
      const previewLine = pickLine('study', settings.coachTheme || 'classic', learnerName);
      showLocalNotification('SAIRA Coach Preview', {
        body: previewLine,
        slot: 'study',
      });
    }
  };

  return (
    <div className="space-y-8 max-w-2xl animate-fade-rise pb-16">
      <div className="space-y-1">
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Preferences, study reminders, coach voice, and data controls.
        </p>
      </div>

      {/* 1. General Preferences Card */}
      <div className="bg-surface border border-border rounded-3xl divide-y divide-border/60 shadow-sm overflow-hidden">
        {/* Timezone */}
        <div className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Timezone</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Streaks, day keys, and reminder schedules align with this zone.
            </p>
          </div>
          <span className="text-xs font-mono bg-surface-2 px-3 py-1.5 rounded-xl border border-border text-foreground">
            Asia/Kolkata (IST)
          </span>
        </div>

        {/* Daily Target */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Daily Target</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Number of checklist items or practice problems targeted daily.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              min={1}
              max={20}
              value={dailyTarget}
              onChange={(e) => setDailyTarget(parseInt(e.target.value, 10) || 1)}
              className="w-16 px-2.5 py-1.5 bg-surface-2 border border-border rounded-xl font-mono text-xs text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground font-mono">items</span>
          </div>
        </div>

        {/* Local-first status */}
        <div className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Local Data Mode</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Full offline storage active via IndexedDB with automatic cloud sync.
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            Active
          </span>
        </div>
      </div>

      {/* 2. Coach & Study Reminders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Study Reminders & Coach</h2>
          </div>
          <button
            type="button"
            onClick={handlePreviewCoach}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Preview Coach</span>
          </button>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-6 space-y-6 shadow-sm">
          {/* Reminder Times Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-4 rounded-2xl bg-surface-2/40 border border-border/60">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Morning Check-In</span>
                <span className="text-[10px] text-muted-foreground font-mono">08:30 default</span>
              </label>
              <input
                type="time"
                value={settings.morningTime}
                onChange={(e) => updateSetting('morningTime', e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                Gentle morning prompt to open the editor before the day gets loud.
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-surface-2/40 border border-border/60">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Evening Study Session</span>
                <span className="text-[10px] text-muted-foreground font-mono">19:00 default</span>
              </label>
              <input
                type="time"
                value={settings.studyTime}
                onChange={(e) => updateSetting('studyTime', e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                Main study nudge to tackle new problems or review revision cards.
              </p>
            </div>
          </div>

          {/* Days of Week */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Active Reminder Days
            </label>
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {DAYS.map((d) => {
                const isSelected = (settings.daysOfWeek || []).includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-surface-2/40 text-muted-foreground border-border/60 hover:text-foreground'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice & Snooze Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
            {/* Voice Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-2/40 border border-border/60">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  {settings.voiceEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  Coach Voice
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Speaks lines aloud with Indian English voice.
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateSetting('voiceEnabled', !settings.voiceEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.voiceEnabled ? 'bg-primary' : 'bg-surface-2 border border-border'
                }`}
                role="switch"
                aria-checked={settings.voiceEnabled}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.voiceEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Snooze Duration */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-2/40 border border-border/60">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground block">
                  Snooze Duration
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Re-arms timer (max 3 per slot).
                </p>
              </div>
              <select
                value={settings.snoozeMinutes}
                onChange={(e) => updateSetting('snoozeMinutes', parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 bg-surface border border-border rounded-xl text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
              </select>
            </div>
          </div>

          {/* Coach Theme Selection */}
          <div className="p-4 rounded-2xl bg-surface-2/40 border border-border/60 space-y-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Coach Theme
              </span>
              <p className="text-[11px] text-muted-foreground">
                Tone and style of avatar messages (Mix picks a different theme each day).
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'classic', label: 'Classic', desc: 'Gentle & encouraging' },
                { id: 'hero', label: 'Hero', desc: 'Brave & mission-ready' },
                { id: 'realm', label: 'Realm', desc: 'Fantasy & exploration' },
                { id: 'mahabharata', label: 'Mahabharata', desc: 'Discipline & focus' },
                { id: 'mix', label: 'Mix', desc: 'Daily rotating theme' },
              ].map((themeOpt) => {
                const isSelected = (settings.coachTheme || 'classic') === themeOpt.id;
                return (
                  <button
                    key={themeOpt.id}
                    type="button"
                    onClick={() => updateSetting('coachTheme', themeOpt.id as CoachTheme)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-foreground shadow-xs ring-1 ring-primary/40'
                        : 'bg-surface border-border/60 text-muted-foreground hover:text-foreground hover:bg-surface-2'
                    }`}
                  >
                    <div className="text-xs font-semibold flex items-center justify-between">
                      <span>{themeOpt.label}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                      {themeOpt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="p-4 rounded-2xl bg-surface-2/40 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground block">
                  Quiet Hours
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Mutes all reminders during your scheduled sleep hours.
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateSetting('quietHoursEnabled', !settings.quietHoursEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.quietHoursEnabled ? 'bg-primary' : 'bg-surface-2 border border-border'
                }`}
                role="switch"
                aria-checked={settings.quietHoursEnabled}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.quietHoursEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {settings.quietHoursEnabled && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] text-muted-foreground font-mono">From</span>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-xl text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] text-muted-foreground font-mono">Until</span>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-xl text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* System Notifications Permission Status */}
          <div className="p-4 rounded-2xl bg-surface-2/30 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                {notificationPermission === 'granted' ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
                System Notifications
              </span>
              <p className="text-[11px] text-muted-foreground">
                {notificationPermission === 'granted'
                  ? 'Local notifications enabled via Service Worker.'
                  : notificationPermission === 'denied'
                  ? 'Notifications are blocked in your browser site permissions.'
                  : 'Allows pop-up notifications with Start and Snooze actions.'}
              </p>
            </div>

            {notificationPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3.5 py-1.5 rounded-xl bg-surface-2 text-foreground border border-border hover:bg-surface-2/80 text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
              >
                {notificationPermission === 'denied' ? 'Re-enable in Browser' : 'Enable'}
              </button>
            )}
          </div>

          {/* Honest Technical Limits Disclaimer */}
          <div className="p-4 rounded-2xl bg-surface-2/20 border border-dashed border-border/80 text-xs text-muted-foreground flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>
              <strong>Honest note on browser limits:</strong> Browsers cannot draw animated character avatars outside of an active browser window. In Milestone 5, the coach overlay and voice speech appear whenever SAIRA is open in a tab or running as an installed PWA. Full background push notifications when the app is completely closed will arrive in Milestone 8 via FCM.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Push Notifications (FCM) Status Card */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Background Push Notifications</h2>
        </div>
        <div className="bg-surface border border-border rounded-3xl p-5 shadow-sm">
          {!isFcmSupported() ? (
            // Not supported — browser lacks Push API or VAPID key not set
            <div className="flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Not supported in this browser</p>
                <p className="text-xs text-muted-foreground">
                  Background push requires a browser that supports the Web Push API (Chrome,
                  Edge, Firefox, or Safari 16.4+ on iOS). Make sure the app is installed as a
                  PWA and that <code className="font-mono text-[11px]">VITE_FIREBASE_VAPID_KEY</code> is set.
                </p>
              </div>
            </div>
          ) : notificationPermission === 'denied' ? (
            // Blocked — user denied permission
            <div className="flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Notifications blocked</p>
                <p className="text-xs text-muted-foreground">
                  Your browser has blocked notifications for this site.
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  To re-enable: open browser Settings → Privacy / Site settings →
                  Notifications → find <span className="font-mono">saira-dsa.web.app</span> → change to Allow.
                  Then reload the app.
                </p>
              </div>
            </div>
          ) : notificationPermission === 'granted' ? (
            // Enabled — token is (or will be) registered
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Push notifications enabled</p>
                <p className="text-xs text-muted-foreground">
                  This device is registered to receive background push reminders at your
                  scheduled morning and study times — even when the app is closed.
                  The token renews automatically on each app start.
                </p>
              </div>
            </div>
          ) : (
            // Default — not yet asked
            <div className="flex items-start gap-3 text-sm">
              <Bell className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Background push not yet enabled</p>
                <p className="text-xs text-muted-foreground">
                  Grant notification permission (above) to register this device for
                  background push reminders. You will be prompted automatically after
                  completing your first item.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. PWA App Installation Section */}
      <InstallButton variant="settings" />

      {/* 5. Delete Account Section */}
      <DeleteAccountSection />

      {/* Preview Coach Overlay */}
      <CoachOverlay
        isOpen={previewOpen}
        slot="study"
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
};
