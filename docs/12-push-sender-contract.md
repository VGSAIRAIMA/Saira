# SAIRA: Push Sender Contract

**Audience:** the `saira-push-sender` repo. It must NOT import any files from this repo.
This document contains everything the sender needs. Do not guess field names.

---

## 1. Firebase project

- **Project ID:** `saira-dsa`
- **Region:** `asia-south1`
- **Authentication:** Service account key JSON (Admin SDK). Never commit it.
- The sender uses `firebase-admin`; Firestore security rules do **not** apply to Admin SDK reads/writes.

---

## 2. Firestore paths the sender reads

### 2a. User settings
```
users/{uid}/meta/settings
```
Fields:
| Field | Type | Default | Meaning |
|---|---|---|---|
| `morningTime` | `string` | `"08:30"` | HH:MM, 24-h, in the user's timezone |
| `studyTime` | `string` | `"19:00"` | HH:MM, 24-h, in the user's timezone |
| `daysOfWeek` | `number[]` | `[0,1,2,3,4,5,6]` | JS weekday numbers (0=Sunday, 6=Saturday) |
| `quietHoursStart` | `string \| null` | `null` | HH:MM, null = no quiet hours |
| `quietHoursEnd` | `string \| null` | `null` | HH:MM |
| `snoozeMinutes` | `number` | `15` | minutes per snooze |
| `maxSnoozeCount` | `number` | `3` | max snoozes per slot per day |
| `notificationsEnabled` | `boolean` | `false` | must be `true` to send |
| `coachTheme` | `"classic" \| "hero" \| "realm" \| "mahabharata" \| "mix"` | `"classic"` | which theme to pick lines from |

### 2b. Reminder state (last fired)
```
users/{uid}/meta/reminderState
```
Fields:
| Field | Type | Meaning |
|---|---|---|
| `lastFiredSlot` | `{ [dayKey: string]: string[] }` | e.g. `{ "2026-10-21": ["morning"] }` — slots fired today |
| `snoozeUntil` | `number \| null` | Unix ms timestamp; if `Date.now() < snoozeUntil` skip the slot |
| `dismissedToday` | `string \| null` | dayKey of the last "not today" dismissal; if matches today skip all slots |

The sender must read this doc to avoid sending duplicate notifications for the same slot on the same day.

### 2c. Today's progress (daily target check)
```
users/{uid}/days/{dayKey}
```
`dayKey` format: `YYYY-MM-DD` in `Asia/Kolkata` (IST).

Fields:
| Field | Type | Meaning |
|---|---|---|
| `completed` | `number` | items completed today |

Also read from:
```
users/{uid}/meta/settings
```
Field `dailyTarget` (`number`, default `3`): if `completed >= dailyTarget`, skip the slot — goal already met.

---

## 3. Computing dayKey and current slot time in Asia/Kolkata (IST)

```js
const { DateTime } = require('luxon'); // or use Intl.DateTimeFormat

function getDayKeyIST() {
  return DateTime.now().setZone('Asia/Kolkata').toFormat('yyyy-MM-dd');
}

function getCurrentHHMM_IST() {
  const now = DateTime.now().setZone('Asia/Kolkata');
  return `${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}`;
}
```

A slot fires if the current IST time is within a **15-minute window** of `morningTime` or `studyTime`:
```
slotTime = "08:30"           // from settings
windowStart = "08:30"
windowEnd   = "08:44"        // slotTime + 14 minutes inclusive
```
Fire if `windowStart <= currentTime <= windowEnd` (string comparison works for HH:MM).

Quiet hours: if `quietHoursStart` and `quietHoursEnd` are set, and current IST time falls between them, skip all slots.

Current day of week: `DateTime.now().setZone('Asia/Kolkata').weekday % 7` → JS weekday (0=Sunday). Skip if not in `daysOfWeek`.

---

## 4. Device documents the sender reads

```
users/{uid}/devices/{deviceId}
```
Fields:
| Field | Type | Meaning |
|---|---|---|
| `token` | `string` | FCM registration token — use as the send target |
| `platform` | `string` | `"desktop"` / `"android-chrome"` / `"ios-safari"` |
| `tz` | `string` | IANA timezone from the client (informational; trust `Asia/Kolkata` from settings for scheduling) |
| `lastSeenAt` | `Timestamp` | Firestore server timestamp; skip devices with `lastSeenAt < now - 30d` |

The sender lists all docs in `users/{uid}/devices` and sends to each valid token.

### Invalid token cleanup
If FCM returns `messaging/registration-token-not-registered`, the sender must delete that device doc:
```
users/{uid}/devices/{deviceId}  →  delete
```

---

## 5. Coach line selection

The sender must pick a line from the avatar-lines file. Copy the exact JSON from:
```
src/data/avatar-lines.seed.json
```
(in this repo — copy it into the sender repo or read it from Firestore if you store it there).

**Schema (schemaVersion: 2):**
```json
{
  "schemaVersion": 2,
  "themes": {
    "classic": {
      "morning":       ["...", "..."],
      "study":         ["...", "..."],
      "nudge_missed":  ["...", "..."],
      "snooze_ack":    ["...", "..."],
      "start_ack":     ["...", "..."],
      "done_today":    ["...", "..."],
      "weekly_review": ["...", "..."]
    },
    "hero": { /* same groups */ },
    "realm": { /* same groups */ },
    "mahabharata": { /* same groups */ }
  }
}
```

**How to pick a theme:**
- `classic`, `hero`, `realm`, `mahabharata` → use directly.
- `mix` → deterministic daily rotation:
  ```js
  const themes = ['classic', 'hero', 'realm', 'mahabharata'];
  const dayKey = getDayKeyIST(); // e.g. "2026-10-21"
  let hash = 0;
  for (const ch of dayKey) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const theme = themes[hash % themes.length];
  ```

**How to pick a line:**
1. Look up `themes[theme][group]` where `group` = `"morning"` or `"study"` (match the slot name).
2. If `nudge_missed` applies (yesterday's `days/{dayKey}.completed === 0` or doc missing), use group `"nudge_missed"`.
3. Pick a random line. Replace `{name}` with the learner's first name:
   ```js
   const firstName = (profile.displayName || 'Raima').split(' ')[0];
   line = line.replace(/\{name\}/g, firstName);
   ```
   The learner's `displayName` is in `users/{uid}/profile` or from Firebase Auth admin.

---

## 6. FCM data-only payload the sender must send

Use `sendEachForMulticast` (firebase-admin v12+) with a **data-only** message. Do NOT include a `notification` block — the service worker builds the notification itself.

```js
const message = {
  tokens: [token1, token2, ...],   // from devices collection
  data: {
    slot:     'morning',            // or 'study'
    line:     'Good morning, Raima! Your sheet is ready.',
    url:      '/today?coach=morning',
    dayKey:   '2026-10-21',         // IST day key YYYY-MM-DD
    imageUrl: '/icons/icon-192.png' // optional; coach art URL
  },
  // webpush config for better delivery on Chrome
  webpush: {
    headers: { TTL: '3600' },       // 1-hour time-to-live
    fcmOptions: { link: 'https://saira-dsa.web.app/today' }
  }
};
const response = await admin.messaging().sendEachForMulticast(message);
```

---

## 7. After sending — update reminderState

After a successful send (or skip) the sender writes:
```
users/{uid}/meta/reminderState
```
Merge write (do NOT overwrite the whole doc):
```js
admin.firestore().doc(`users/${uid}/meta/reminderState`).set(
  {
    lastFiredSlot: {
      [dayKey]: admin.firestore.FieldValue.arrayUnion(slot)
    }
  },
  { merge: true }
);
```

---

## 8. Scheduling cadence

Run the sender every **15 minutes** (e.g. GitHub Actions cron `*/15 * * * *` UTC, or Cloud Scheduler).

Reference times in UTC for the default IST schedule:
- 08:30 IST = 03:00 UTC
- 19:00 IST = 13:30 UTC

GitHub Actions cron can be up to 15 minutes late. Cloud Scheduler is more reliable. Either is acceptable — treat delivery as best-effort.

---

## 9. What the client does when it receives the push

The service worker (`src/sw.ts`) handles the background message via `onBackgroundMessage`:
- Reads `data.slot`, `data.line`, `data.dayKey`, `data.imageUrl` from the FCM payload.
- If a focused browser window is open: posts `{ type: 'SAIRA_COACH_SHOW', slot, line }` to the page — **no system notification**.
- If no focused window: calls `showNotification('SAIRA Coach', { ... })` with tag `saira-{slot}-{dayKey}`, `renotify: false`, actions Start and Snooze.
- Clicking "Start" opens `/today?coach={slot}`; clicking "Snooze" opens `/today?snooze={slot}`.
