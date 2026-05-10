import { describe, expect, it } from 'vitest';
import { interpolateNamedFallback } from '@/modules/i18n';

describe('interpolateNamedFallback — fallback placeholder substitution', () => {
  it('substitutes {name} placeholders against the named args', () => {
    expect(interpolateNamedFallback('~~View all {n} →', { n: 142 })).toBe(
      'View all 142 →',
    );
  });

  it('handles multiple placeholders', () => {
    expect(
      interpolateNamedFallback('~~Top {shown} of {total}', {
        shown: 8,
        total: 142,
      }),
    ).toBe('Top 8 of 142');
  });

  it('strips the ~~ sentinel from missing-key fallbacks', () => {
    expect(interpolateNamedFallback('~~Vulnerability filter')).toBe(
      'Vulnerability filter',
    );
  });

  it('leaves bundle translations (no ~~ prefix) untouched', () => {
    expect(interpolateNamedFallback('Vulnerability filter')).toBe(
      'Vulnerability filter',
    );
  });

  it('preserves the {placeholder} when no value is supplied', () => {
    expect(
      interpolateNamedFallback('~~Top {shown} of {total}', { shown: 1 }),
    ).toBe('Top 1 of {total}');
  });

  it('returns non-string results unchanged', () => {
    expect(interpolateNamedFallback(42, { n: 1 })).toBe(42);
    expect(interpolateNamedFallback(undefined, { n: 1 })).toBeUndefined();
  });

  it('strips ~~ even when no named args are supplied', () => {
    expect(interpolateNamedFallback('~~View all the things')).toBe(
      'View all the things',
    );
  });

  it('coerces numeric args to strings', () => {
    expect(interpolateNamedFallback('Count: {n}', { n: 0 })).toBe('Count: 0');
  });
});
