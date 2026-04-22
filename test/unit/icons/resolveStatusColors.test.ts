import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { colors, resolveStatusColors } from '@/icons/icons_templates';

const here = path.dirname(fileURLToPath(import.meta.url));
const styleCss = readFileSync(
  path.resolve(here, '../../../src/style.css'),
  'utf8',
);

describe('icons >> resolveStatusColors', () => {
  test('every status_claim key resolves to non-empty hex pair', () => {
    for (const key of Object.keys(colors)) {
      const [status, claim] = splitKey(key);
      const { fill, stroke } = resolveStatusColors(status, claim === 'claimed');
      expect(fill).toMatch(/^#[\da-f]{6}$/i);
      expect(stroke).toMatch(/^#[\da-f]{6}$/i);
    }
  });

  test('unknown status falls back to open_unassigned_unclaimed', () => {
    const fallback = resolveStatusColors('open_unassigned', false);
    const bogus = resolveStatusColors('not_a_real_status_abc', false);
    expect(bogus).toEqual(fallback);
  });

  test('claimed flag selects the claimed entry', () => {
    const unclaimed = resolveStatusColors('open_unassigned', false);
    const claimed = resolveStatusColors('open_unassigned', true);
    expect(unclaimed.fill).toBe(colors.open_unassigned_unclaimed.fillColor);
    expect(claimed.fill).toBe(colors.open_unassigned_claimed.fillColor);
  });

  test('every hex in colors appears as a CSS var value in src/style.css', () => {
    const normalized = styleCss.toLowerCase();
    for (const [key, entry] of Object.entries(colors)) {
      const fill = String(entry.fillColor).toLowerCase();
      const stroke = String(entry.strokeColor).toLowerCase();
      const varKey = key.replaceAll('_', '-');
      expect(
        normalized,
        `--cc-status-${varKey}-fill should equal ${fill}`,
      ).toContain(`--cc-status-${varKey}-fill: ${fill}`);
      expect(
        normalized,
        `--cc-status-${varKey}-stroke should equal ${stroke}`,
      ).toContain(`--cc-status-${varKey}-stroke: ${stroke}`);
    }
  });
});

function splitKey(key: string): [string, 'claimed' | 'unclaimed'] {
  if (key.endsWith('_claimed'))
    return [key.slice(0, -'_claimed'.length), 'claimed'];
  if (key.endsWith('_unclaimed'))
    return [key.slice(0, -'_unclaimed'.length), 'unclaimed'];
  throw new Error(`unexpected palette key: ${key}`);
}
