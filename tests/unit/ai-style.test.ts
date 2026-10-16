import { describe, expect, it } from 'vitest';
import { AI_TONES, resolveTone, withTone } from '@/lib/ai/style';

describe('ai response style', () => {
  it('exposes the three supported tones', () => {
    expect([...AI_TONES]).toEqual(['CONCISE', 'BALANCED', 'DETAILED']);
  });

  it('resolves known tones and falls back to balanced', () => {
    expect(resolveTone('CONCISE')).toBe('CONCISE');
    expect(resolveTone('DETAILED')).toBe('DETAILED');
    expect(resolveTone('BALANCED')).toBe('BALANCED');
    expect(resolveTone(null)).toBe('BALANCED');
    expect(resolveTone(undefined)).toBe('BALANCED');
    expect(resolveTone('VERBOSE')).toBe('BALANCED');
    expect(resolveTone('concise')).toBe('BALANCED');
  });

  it('appends a distinct style directive per tone', () => {
    const base = 'Be helpful.';
    const concise = withTone(base, 'CONCISE');
    const balanced = withTone(base, 'BALANCED');
    const detailed = withTone(base, 'DETAILED');
    expect(concise.startsWith(base)).toBe(true);
    expect(new Set([concise, balanced, detailed]).size).toBe(3);
  });
});
