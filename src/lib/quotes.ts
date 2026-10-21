import quotesData from '@/data/quotes.seed.json';

export interface Quote {
  id: string;
  cat: 'start' | 'consistency' | 'struggle' | 'comeback' | 'milestone' | 'revision' | string;
  text: string;
}

export const allQuotes: Quote[] = quotesData.quotes as Quote[];

/**
 * Deterministically derives the daily quote for a given calendar dayKey (YYYY-MM-DD).
 * Guarantees the same quote on every reload and device for that date.
 * An optional shift parameter allows in-session cycling ("Another quote").
 */
export function getDailyQuote(dayKey: string, shift: number = 0): Quote {
  if (!allQuotes.length) {
    return {
      id: 'default',
      cat: 'consistency',
      text: 'Small, steady, unstoppable.',
    };
  }

  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) % 100000;
  }

  const normalizedShift = ((shift % allQuotes.length) + allQuotes.length) % allQuotes.length;
  const index = (hash + normalizedShift) % allQuotes.length;
  return allQuotes[index];
}

/**
 * Returns a quote for milestone celebrations.
 */
export function getMilestoneQuote(seedIndex: number = 0): Quote {
  const milestoneQuotes = allQuotes.filter((q) => q.cat === 'milestone');
  if (!milestoneQuotes.length) return allQuotes[0];
  const idx = Math.abs(seedIndex) % milestoneQuotes.length;
  return milestoneQuotes[idx];
}
