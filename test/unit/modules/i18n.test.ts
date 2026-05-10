import { describe, expect, it } from 'vitest';
import { interpolateNamedFallback } from '@/modules/i18n';

describe('interpolateNamedFallback — fallback placeholder substitution', () => {
  it('substitutes {name} placeholders against the named args', () => {
    expect(interpolateNamedFallback('~~View all {n} →', { n: 142 })).toBe(
      '~~View all 142 →',
    );
  });

  it('handles multiple placeholders', () => {
    expect(
      interpolateNamedFallback('~~Top {shown} of {total}', {
        shown: 8,
        total: 142,
      }),
    ).toBe('~~Top 8 of 142');
  });

  it('passes through strings without placeholders untouched', () => {
    expect(interpolateNamedFallback('~~from', { x: 1 })).toBe('~~from');
  });

  it('preserves the {placeholder} when no value is supplied', () => {
    expect(
      interpolateNamedFallback('~~Top {shown} of {total}', { shown: 1 }),
    ).toBe('~~Top 1 of {total}');
  });

  it('returns non-string results unchanged', () => {
    expect(interpolateNamedFallback(42, { n: 1 })).toBe(42);
    expect(interpolateNamedFallback(undefined, { n: 1 })).toBeUndefined();
  });

  it('returns the input when no named args are supplied', () => {
    expect(interpolateNamedFallback('~~View all {n} →')).toBe(
      '~~View all {n} →',
    );
  });

  it('coerces numeric args to strings', () => {
    expect(interpolateNamedFallback('Count: {n}', { n: 0 })).toBe('Count: 0');
  });
});
