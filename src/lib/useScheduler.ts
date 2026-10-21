import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  evaluateSchedule,
  ReminderSlot,
  applySnooze,
} from './schedule';
import {
  loadLocalReminderSettings,
  loadLocalReminderState,
  saveReminderState,
  subscribeToReminderBroadcast,
} from './reminderStorage';
import { showLocalNotification } from './notifications';
import { useSheetStore } from '@/stores/useSheetStore';
import { useAuthStore } from '@/stores/useAuthStore';
import avatarLinesData from '@/data/avatar-lines.seed.json';

export function useScheduler() {
  const location = useLocation();
  const dayLogs = useSheetStore((s) => s.dayLogs);
  const dailyTarget = useSheetStore((s) => s.dailyTarget);
  const progress = useSheetStore((s) => s.progress);
  const isLoaded = useSheetStore((s) => s.isLoaded);
  const user = useAuthStore((s) => s.user);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<ReminderSlot>('study');
  const [activeCategory, setActiveCategory] = useState<'morning' | 'study' | 'nudge_missed' | 'done_today'>('study');
  const [promptOpen, setPromptOpen] = useState(false);

  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check whether to show the post-first-item notification prompt
  useEffect(() => {
    if (!isLoaded) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'default') return;

    const dismissed = localStorage.getItem('saira:notification_prompt_dismissed');
    if (dismissed === 'true') return;

    let completedCount = 0;
    for (const p of Object.values(progress)) {
      if (p.status === 'done') completedCount++;
      if (completedCount >= 1) break;
    }

    if (completedCount >= 1) {
      const timer = setTimeout(() => {
        setPromptOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [progress, isLoaded]);

  // Handle URL query triggers (?coach=morning or ?coach=study or ?snooze=slot)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const coachParam = params.get('coach');
    const snoozeParam = params.get('snooze');

    if (coachParam === 'morning' || coachParam === 'study') {
      const timer = setTimeout(() => {
        setActiveSlot(coachParam);
        setActiveCategory(coachParam);
        setOverlayOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    } else if (snoozeParam === 'morning' || snoozeParam === 'study') {
      const settings = loadLocalReminderSettings();
      const state = loadLocalReminderState();
      const res = applySnooze(state, settings.snoozeMinutes, Date.now());
      if (res.success) {
        void saveReminderState(res.state);
      }
    }
  }, [location.search]);

  // Main evaluation logic
  const checkSchedule = useCallback(() => {
    if (!isLoaded) return;

    const settings = loadLocalReminderSettings();
    const reminderState = loadLocalReminderState();

    const result = evaluateSchedule({
      currentTime: new Date(),
      settings,
      dailyTarget,
      dayLogs,
      reminderState,
    });

    if (result.action === 'fire' && result.slot) {
      setActiveSlot(result.slot);
      const category = result.lineCategory || result.slot;
      setActiveCategory(category);
      setOverlayOpen(true);

      // Also fire local system notification if enabled
      if (settings.notificationsEnabled) {
        const learnerName = user?.displayName ? user.displayName.split(' ')[0] : 'Raima';
        const linesGroup = (avatarLinesData as unknown as Record<string, string[]>)[category] || avatarLinesData.study;
        const line = (linesGroup[0] || 'Ready for your reps?').replace(/\{name\}/g, learnerName);

        showLocalNotification(
          result.slot === 'morning' ? 'SAIRA Morning Nudge' : 'SAIRA Study Session',
          {
            body: line,
            slot: result.slot,
          }
        );
      }
    }
  }, [dayLogs, dailyTarget, isLoaded, user]);

  useEffect(() => {
    // 1. Subscribe to broadcast channel for multi-tab sync
    const unsubscribeBroadcast = subscribeToReminderBroadcast(() => {
      // Another tab fired or snoozed, re-check immediately
      checkSchedule();
    });

    // 2. Initial check
    const initialTimer = setTimeout(() => {
      checkSchedule();
    }, 0);

    // 3. Interval check every 30 seconds
    checkIntervalRef.current = setInterval(checkSchedule, 30000);

    // 4. Focus & visibility change handlers (recomputes immediately when user returns to tab)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSchedule();
      }
    };

    window.addEventListener('focus', checkSchedule);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(initialTimer);
      unsubscribeBroadcast();
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      window.removeEventListener('focus', checkSchedule);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkSchedule]);

  // Preview trigger for settings
  const triggerPreview = useCallback(() => {
    setActiveSlot('study');
    setActiveCategory('study');
    setOverlayOpen(true);

    const settings = loadLocalReminderSettings();
    if (settings.notificationsEnabled) {
      const learnerName = user?.displayName ? user.displayName.split(' ')[0] : 'Raima';
      const line = avatarLinesData.study[0].replace(/\{name\}/g, learnerName);
      showLocalNotification('SAIRA Coach Preview', {
        body: line,
        slot: 'study',
      });
    }
  }, [user]);

  return {
    overlayOpen,
    activeSlot,
    activeCategory,
    closeOverlay: () => setOverlayOpen(false),
    promptOpen,
    closePrompt: () => setPromptOpen(false),
    triggerPreview,
  };
}
