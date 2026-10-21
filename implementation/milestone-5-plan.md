# SAIRA: Milestone 5 (Reminders & The Coach) Implementation Plan

This document details the architecture, scheduler logic, voice engine, coach avatar, and multi-tab sync for Milestone 5 (Stage A).

---

## 1. Concepts & Tools Explained for Beginners

- **Web Speech API (`window.speechSynthesis`)**:
  A built-in browser tool that reads text out loud using synthesized computer voices without needing any external audio files. We use it to voice the coach's gentle reminders at a steady 0.95x pace, preferring an Indian English (`en-IN`) voice.
- **Service Worker Local Notifications (`registration.showNotification`)**:
  A browser feature that allows a web app to pop up system notification banners with action buttons (like "Start" and "Snooze") just like native desktop or mobile apps.
- **`notificationclick` in Service Worker**:
  A background event listener inside `src/sw.ts` that detects when a user clicks on the notification or one of its action buttons, allowing the app to open or bring the tab into focus.
- **BroadcastChannel API**:
  A lightweight browser communication channel that lets different open tabs of the same website talk directly to each other in real-time. We use it so that if Tab 1 shows a reminder, Tab 2 is immediately told and will never show a duplicate reminder.
- **Fake Clock Testing**:
  A software testing technique where we replace real system time with a simulated controllable clock. This lets tests verify what happens at 08:30 AM, 07:00 PM, or after 15 minutes of snoozing without waiting hours in real life.

---

## 2. Architecture & File Plan

```
src/
├── types/
│   └── sheet.ts                        # Add ReminderSettings & ReminderState
├── lib/
│   ├── schedule.ts                     # Slot calculation, 30m window, missed-day nudge, fake clock support
│   ├── voice.ts                        # SpeechSynthesis manager (en-IN voice, autoplay fallback, frame cycling)
│   ├── reminderStorage.ts              # Syncs reminderState to localStorage, BroadcastChannel, and users/{uid}/meta/reminderState
│   └── __tests__/
│       └── schedule.test.ts            # Fake-clock tests (08:30, 19:00, snooze x3, not today, goal met, missed nudge, multi-tab)
├── components/
│   └── coach/
│       ├── Coach.tsx                   # Clean flat SVG avatar (states: idle, talking, cheer)
│       ├── CoachOverlay.tsx            # Slide-in card / bottom sheet with Start, Snooze, Not today, auto-dismiss
│       └── NotificationPromptDialog.tsx# Polite pre-prompt after 1st item completion
├── features/
│   └── settings/
│       └── SettingsPage.tsx            # Times, days of week, voice, snooze, quiet hours, preview, honesty notice
├── app/
│   └── AppShell.tsx                    # Mount CoachOverlay and notification scheduler hook
└── sw.ts                               # Add notificationclick handler for /today?coach=<slot>
```

---

## 3. Scheduling & Domain Rules

1. **Slots**:
   - `morning`: Default `08:30` (Asia/Kolkata).
   - `study`: Default `19:00` (Asia/Kolkata).
   - Configurable in Settings.
2. **Eligibility & Firing Window**:
   - Slot fires if `currentTime >= slotTime` and `currentTime - slotTime <= 30 minutes` (max 30 min late).
   - If user opens app past 30 minutes late, the slot is considered expired and will not fire.
   - Day of week check: slot only fires if today's day of week (0–6) is selected in settings.
3. **Goal Already Met**:
   - If today's completed items $\ge$ daily target (`completedToday >= dailyTarget`), skip firing.
4. **Missed Day Nudge**:
   - If yesterday was not active and not a rest day, the *next evening* (`study`) slot uses a line from `nudge_missed` instead of standard study lines, firing once.
5. **Snooze Rule**:
   - User clicking "Snooze" re-arms reminder in `snoozeMinutes` (default 15m).
   - Maximum 3 snoozes allowed per slot. On the 4th, snooze is disabled.
6. **"Not Today" / Dismissal**:
   - Marks slot as dismissed for today in `reminderState`.
   - Auto-dismisses after 60 seconds if untouched (treated as dismissed).
7. **Two-Tab Deduplication**:
   - Slot execution writes `lastFiredSlot` and `lastFiredDate` to `reminderState` in local storage and Firestore `users/{uid}/meta/reminderState`.
   - Fires a `BroadcastChannel('saira_reminders')` message so any other open tab immediately marks the slot fired.
8. **Permission Flow**:
   - Only requested *after* completing the first item.
   - Includes a polite explanation before the browser modal.
   - If denied, never prompts repeatedly; provides clear re-enable steps in Settings.
