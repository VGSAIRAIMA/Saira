/**
 * deriveFirstName() unit tests.
 *
 * deriveFirstName is a pure function (no Firebase, no DOM) so these run
 * in the Node vitest environment without any mocking.
 *
 * Covers the same logic every component uses:
 *   displayName.trim().split(' ')[0]  ||  'friend'
 */

import { describe, it, expect } from 'vitest';
import { deriveFirstName } from '@/lib/reminderStorage';

describe('deriveFirstName()', () => {
  it('returns the first word of a full name ("Priya Sharma" → "Priya")', () => {
    expect(deriveFirstName('Priya Sharma')).toBe('Priya');
  });

  it('returns the whole string when there is no space ("Raima" → "Raima")', () => {
    expect(deriveFirstName('Raima')).toBe('Raima');
  });

  it('handles a three-word name, returning only the first word', () => {
    expect(deriveFirstName('Arjun Kumar Singh')).toBe('Arjun');
  });

  it('falls back to "friend" when displayName is null', () => {
    expect(deriveFirstName(null)).toBe('friend');
  });

  it('falls back to "friend" when displayName is undefined', () => {
    expect(deriveFirstName(undefined)).toBe('friend');
  });

  it('falls back to "friend" when displayName is an empty string', () => {
    expect(deriveFirstName('')).toBe('friend');
  });

  it('falls back to "friend" when displayName is only whitespace', () => {
    expect(deriveFirstName('   ')).toBe('friend');
  });

  it('trims leading/trailing spaces before splitting ("  Priya Sharma  " → "Priya")', () => {
    expect(deriveFirstName('  Priya Sharma  ')).toBe('Priya');
  });
});
