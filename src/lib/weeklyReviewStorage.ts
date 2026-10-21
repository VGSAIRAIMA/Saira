import { WeeklyReview, WeeklyReviewStats, DayLog, ItemProgress } from '@/types/sheet';
import { getIsoWeekKey } from '@/lib/time';
import { isActiveDay } from '@/lib/stats/activeDay';
import { auth, db } from '@/lib/firebase';

const WEEKLY_REVIEWS_STORAGE_KEY = 'saira:weekly_reviews';

/**
 * Computes weekly stats for a given ISO week from recorded dayLogs and progress.
 */
export function computeWeeklyStats(
  isoWeek: string,
  dayLogs: Record<string, DayLog>,
  progress: Record<string, ItemProgress>
): WeeklyReviewStats {
  let completedCount = 0;
  let revisedCount = 0;
  let totalMinutes = 0;
  let activeDays = 0;
  let bestDay: string | null = null;
  let maxDayActivity = 0;

  // Filter dayLogs belonging to this ISO week
  for (const [dayKey, log] of Object.entries(dayLogs)) {
    if (getIsoWeekKey(dayKey) === isoWeek) {
      completedCount += log.completed || 0;
      revisedCount += log.revised || 0;
      totalMinutes += log.minutes || 0;

      if (isActiveDay(log)) {
        activeDays++;
      }

      const totalDayReps = (log.completed || 0) + (log.revised || 0);
      if (totalDayReps > maxDayActivity) {
        maxDayActivity = totalDayReps;
        bestDay = dayKey;
      }
    }
  }

  // Calculate confidence trend for items touched/completed
  let totalConfidence = 0;
  let confidenceCount = 0;
  for (const item of Object.values(progress)) {
    if (item.confidence && item.confidence >= 1 && item.confidence <= 5) {
      totalConfidence += item.confidence;
      confidenceCount++;
    }
  }

  const confidenceTrend =
    confidenceCount > 0 ? parseFloat((totalConfidence / confidenceCount).toFixed(1)) : null;

  return {
    completedCount,
    revisedCount,
    totalMinutes,
    activeDays,
    bestDay,
    confidenceTrend,
  };
}

/**
 * Loads all saved weekly reviews from local storage.
 */
export function loadLocalWeeklyReviews(): Record<string, WeeklyReview> {
  try {
    const raw = localStorage.getItem(WEEKLY_REVIEWS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage parse error
  }
  return {};
}

/**
 * Saves a weekly review locally and syncs to Firestore at users/{uid}/weeks/{isoWeek}.
 */
export async function saveWeeklyReview(review: WeeklyReview): Promise<void> {
  const current = loadLocalWeeklyReviews();
  const next = { ...current, [review.isoWeek]: review };

  try {
    localStorage.setItem(WEEKLY_REVIEWS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage write error
  }

  // Cloud sync if signed in
  const user = auth?.currentUser;
  if (user && db) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', user.uid, 'weeks', review.isoWeek), review, {
        merge: true,
      });
    } catch (err) {
      console.warn('Could not sync weekly review to Firestore:', err);
    }
  }
}

/**
 * Syncs weekly reviews from Firestore when signed in.
 */
export async function fetchRemoteWeeklyReviews(uid: string): Promise<Record<string, WeeklyReview>> {
  if (!db) return {};

  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'users', uid, 'weeks'));
    const remoteReviews: Record<string, WeeklyReview> = {};

    snap.forEach((d) => {
      remoteReviews[d.id] = d.data() as WeeklyReview;
    });

    // Merge into local storage
    const local = loadLocalWeeklyReviews();
    const merged = { ...local, ...remoteReviews };
    try {
      localStorage.setItem(WEEKLY_REVIEWS_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore
    }

    return merged;
  } catch (err) {
    console.warn('Could not fetch remote weekly reviews:', err);
    return loadLocalWeeklyReviews();
  }
}
