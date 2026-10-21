import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, X, Play, Clock, Sparkles } from 'lucide-react';
import { Coach, CoachState } from './Coach';
import { coachVoice, VoiceState } from '@/lib/voice';
import {
  ReminderSlot,
  applySnooze,
  applyDismiss,
  recordSlotFired,
} from '@/lib/schedule';
import {
  loadLocalReminderState,
  saveReminderState,
  loadLocalReminderSettings,
} from '@/lib/reminderStorage';
import { useAuthStore } from '@/stores/useAuthStore';
import { getDayKey, DEFAULT_TIMEZONE } from '@/lib/time';
import avatarLinesData from '@/data/avatar-lines.seed.json';

interface CoachOverlayProps {
  isOpen: boolean;
  slot: ReminderSlot;
  lineCategory?: 'morning' | 'study' | 'nudge_missed' | 'done_today';
  customLine?: string;
  onClose: () => void;
}

export const CoachOverlay: React.FC<CoachOverlayProps> = ({
  isOpen,
  slot,
  lineCategory = 'study',
  customLine,
  onClose,
}) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const learnerName = user?.displayName ? user.displayName.split(' ')[0] : 'Raima';

  const [coachState, setCoachState] = useState<CoachState>('idle');
  const [displayText, setDisplayText] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>(() => coachVoice.getState());
  const [snoozeCount, setSnoozeCount] = useState(0);

  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pick appropriate line from avatarLinesData
  const getLine = useCallback(() => {
    if (customLine) return customLine;

    const linesGroup = (avatarLinesData as unknown as Record<string, string[]>)[lineCategory] || avatarLinesData.study;
    const randomIndex = Math.floor(Math.random() * linesGroup.length);
    const rawLine = linesGroup[randomIndex] || linesGroup[0];
    return rawLine.replace(/\{name\}/g, learnerName);
  }, [customLine, lineCategory, learnerName]);

  const handleNotToday = useCallback(async () => {
    coachVoice.cancel();
    const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);
    const currentState = loadLocalReminderState();
    const nextState = applyDismiss(currentState, todayKey, slot);
    await saveReminderState(nextState);
    onClose();
  }, [slot, onClose]);

  const handleStart = async () => {
    coachVoice.cancel();
    setCoachState('cheer');

    const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);
    const currentState = loadLocalReminderState();
    const nextState = recordSlotFired(currentState, todayKey, slot, lineCategory === 'nudge_missed');
    await saveReminderState(nextState);

    // Short cheer acknowledgment before navigating
    setTimeout(() => {
      onClose();
      navigate('/sheet');
    }, 450);
  };

  const handleSnooze = async () => {
    coachVoice.cancel();
    const settings = loadLocalReminderSettings();
    const currentState = loadLocalReminderState();
    const res = applySnooze(currentState, settings.snoozeMinutes, Date.now());

    if (res.success) {
      await saveReminderState(res.state);
      setSnoozeCount(res.state.snoozeCount || 0);
    }
    onClose();
  };

  const handlePlayVoice = () => {
    coachVoice.speak(displayText, (isTalking) => {
      setCoachState(isTalking ? 'talking' : 'idle');
    });
  };

  // Handle overlay open
  useEffect(() => {
    if (!isOpen) return;

    const initTimer = setTimeout(() => {
      const state = loadLocalReminderState();
      setSnoozeCount(state.snoozeCount || 0);

      const line = getLine();
      setDisplayText(line);

      // Speak line if voice enabled
      const settings = loadLocalReminderSettings();
      if (settings.voiceEnabled) {
        coachVoice.speak(line, (isTalking) => {
          setCoachState(isTalking ? 'talking' : 'idle');
        });
      }
    }, 0);

    // 60-second auto-dismiss per spec (counts as dismissed/not today)
    autoDismissTimerRef.current = setTimeout(() => {
      void handleNotToday();
    }, 60000);

    return () => {
      clearTimeout(initTimer);
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
      coachVoice.cancel();
    };
  }, [isOpen, getLine, handleNotToday]);

  // Voice state subscription
  useEffect(() => {
    return coachVoice.subscribe(setVoiceState);
  }, []);

  if (!isOpen) {
    return null;
  }

  const settings = loadLocalReminderSettings();
  const maxSnoozesReached = snoozeCount >= 3;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Study Coach Reminder"
      className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 max-w-lg p-4 sm:p-0 animate-fade-rise"
    >
      <div className="relative overflow-hidden rounded-3xl bg-surface/95 border border-primary/30 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
        {/* Subtle Brand Glow Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent-pink/10 pointer-events-none" />

        {/* Dismiss X button */}
        <button
          type="button"
          onClick={handleNotToday}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
          aria-label="Dismiss reminder"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Coach Avatar */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <Coach state={coachState} size={110} showGlow={coachState === 'talking' || coachState === 'cheer'} />
            <span className="text-[11px] font-semibold text-primary/90 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> SAIRA Coach
            </span>
          </div>

          {/* Coach Line & Controls */}
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                {slot === 'morning' ? 'Morning Check-In · 08:30' : 'Evening Session · 19:00'}
              </span>
              <p
                aria-live="polite"
                className="font-display text-lg sm:text-xl text-foreground leading-snug mt-1"
              >
                &ldquo;{displayText}&rdquo;
              </p>
            </div>

            {/* Play Voice fallback button if audio was blocked by browser */}
            {voiceState.isBlocked && (
              <button
                type="button"
                onClick={handlePlayVoice}
                className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Play voice</span>
              </button>
            )}

            {/* Action Buttons: Start, Snooze, Not today */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start</span>
              </button>

              <button
                type="button"
                onClick={handleSnooze}
                disabled={maxSnoozesReached}
                title={maxSnoozesReached ? 'Maximum 3 snoozes reached for this slot' : `Snooze for ${settings.snoozeMinutes} minutes`}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border text-xs font-medium transition-colors cursor-pointer ${
                  maxSnoozesReached
                    ? 'opacity-40 cursor-not-allowed bg-surface-2/40 text-muted-foreground'
                    : 'bg-surface-2 hover:bg-surface-2/80 text-foreground'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {maxSnoozesReached ? 'Max Snoozes (3)' : `Snooze (${settings.snoozeMinutes}m)`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleNotToday}
                className="px-3.5 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Not today
              </button>
            </div>
          </div>
        </div>

        {/* Honest browser capability disclaimer */}
        <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground/75 flex items-center justify-between">
          <span>In-app reminder · Auto-dismisses in 60s</span>
          <span className="hidden sm:inline">Keep app tab open for nudges</span>
        </div>
      </div>
    </div>
  );
};
