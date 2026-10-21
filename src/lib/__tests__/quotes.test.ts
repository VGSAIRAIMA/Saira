import { describe, it, expect } from 'vitest';
import { getDailyQuote, allQuotes, getMilestoneQuote } from '../quotes';

describe('Deterministic Quote Engine', () => {
  it('loads all seed quotes from quotes.seed.json', () => {
    expect(allQuotes.length).toBe(50);
  });

  it('deterministically returns the same quote for the same dayKey', () => {
    const q1 = getDailyQuote('2026-10-20');
    const q2 = getDailyQuote('2026-10-20');
    expect(q1.id).toBe(q2.id);
    expect(q1.text).toBe(q2.text);
  });

  it('cycles quotes with shift parameter without affecting base quote', () => {
    const base = getDailyQuote('2026-10-20', 0);
    const next1 = getDailyQuote('2026-10-20', 1);
    const next2 = getDailyQuote('2026-10-20', 2);

    expect(next1.id).not.toBe(base.id);
    expect(next2.id).not.toBe(next1.id);

    // Calling again with shift 0 returns the base quote
    expect(getDailyQuote('2026-10-20', 0).id).toBe(base.id);
  });

  it('provides quotes with expected categories', () => {
    const quote = getDailyQuote('2026-10-20');
    expect(['start', 'consistency', 'struggle', 'comeback', 'milestone', 'revision']).toContain(
      quote.cat
    );
  });

  it('provides milestone quotes from the milestone category', () => {
    const m1 = getMilestoneQuote(0);
    expect(m1.cat).toBe('milestone');
  });
});
