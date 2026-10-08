import { describe, expect, it } from 'vitest';
import { formatDate, formatRelativeTime, normalizeTitle } from '@/lib/utils';

describe('normalizeTitle', () => {
  it('collapses whitespace and lowercases', () => {
    expect(normalizeTitle('  Add   Login\n flow ')).toBe('add login flow');
  });

  it('treats differently-cased/collapsed titles as equal', () => {
    expect(normalizeTitle('Fix Bug')).toBe(normalizeTitle('fix   bug'));
  });
});

describe('formatDate', () => {
  it('formats a Date as an en-US date', () => {
    expect(formatDate(new Date(2026, 0, 15))).toBe('Jan 15, 2026');
  });

  it('accepts ISO strings', () => {
    expect(formatDate('2026-11-30T00:00:00.000Z')).toMatch(/Nov 30, 2026/);
  });
});

describe('formatRelativeTime', () => {
  it('returns just now within 45 seconds', () => {
    expect(formatRelativeTime(new Date())).toBe('just now');
  });

  it('returns past minutes', () => {
    expect(formatRelativeTime(new Date(Date.now() - 120_000))).toBe('2 minutes ago');
  });

  it('returns future hours', () => {
    expect(formatRelativeTime(new Date(Date.now() + 3 * 3_600_000))).toBe('in 3 hours');
  });

  it('falls back to a formatted date beyond 30 days', () => {
    expect(formatRelativeTime(new Date(2020, 5, 1))).toBe('Jun 1, 2020');
  });
});
