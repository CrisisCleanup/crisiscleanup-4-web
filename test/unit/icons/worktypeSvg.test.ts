import { describe, expect, test } from 'vitest';
import { templates } from '@/icons/icons_templates';
import {
  getBasicWorktypeSVG,
  getWorktypeSVG,
  injectElevationFilter,
} from '@/hooks/worksite/useWorktypeImages';

describe('icons >> worktype SVG pipeline', () => {
  test('template source has no baked feGaussianBlur shadows', () => {
    for (const [key, raw] of Object.entries(templates)) {
      expect(
        raw,
        `template ${key} should not carry a baked shadow filter`,
      ).not.toMatch(/feGaussianBlur/);
      expect(
        raw,
        `template ${key} should not carry a shadow <use> consumer`,
      ).not.toMatch(/<use fill="#000" filter="url\(/);
    }
  });

  test('flat variant does not inject cc-shadow filter', () => {
    const svg = getWorktypeSVG(
      { work_type: 'animal_services', status: 'open_unassigned' },
      32,
    );
    expect(svg).not.toContain('id="cc-shadow"');
    expect(svg).not.toContain('feDropShadow');
  });

  test('elevated variant injects cc-shadow filter and wraps content', () => {
    const svg = getWorktypeSVG(
      { work_type: 'animal_services', status: 'open_unassigned' },
      32,
      'elevated',
    );
    expect(svg).toContain('id="cc-shadow"');
    expect(svg).toContain('feDropShadow');
    expect(svg).toMatch(/<g filter="url\(#cc-shadow\)">/);
  });

  test('elevated variant applies to every template without throwing', () => {
    for (const key of Object.keys(templates)) {
      const svg = getBasicWorktypeSVG(key, 32, 'elevated');
      expect(svg, `template ${key} elevated output`).toContain(
        'id="cc-shadow"',
      );
      expect(svg).toMatch(/<svg[^>]*>/);
      expect(svg).toMatch(/<\/svg>\s*$/);
    }
  });

  test('injectElevationFilter is idempotent-safe (no double-wrap)', () => {
    const base = '<svg width="10" height="10"><rect /></svg>';
    const once = injectElevationFilter(base);
    expect((once.match(/id="cc-shadow"/g) ?? []).length).toBe(1);
  });

  test('rx="2" has been swapped on badge rects', () => {
    const rawPlus = templates.plus;
    expect(rawPlus).not.toMatch(/rx="2"/);
    expect(rawPlus).toMatch(/rx="4"/);
  });
});
