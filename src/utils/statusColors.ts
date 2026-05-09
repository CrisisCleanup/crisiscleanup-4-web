/**
 * Single source of truth for the Civic Bulletin status palette used by
 * `/pew-pew`. Maps semantic case states to the OKLCH ink-aware tokens
 * declared in `src/style.css` under `.pewpew`.
 *
 * Status families are kept at near-equal OKLCH lightness so they read at
 * the same visual weight on a kiosk wall. Use `cssVar()` for inline styles
 * that need a CSS custom property; use `tailwindClass()` for utility-class
 * contexts.
 */

export type CaseStatusKey =
  | 'all'
  | 'unclaimed'
  | 'claimed'
  | 'in_progress'
  | 'partly_done'
  | 'closed'
  | 'overdue'
  | 'unknown';

export interface StatusColor {
  /** CSS variable name (without the `var()` wrapper) */
  variable: `--cc-stat-${'pos' | 'mid' | 'neg' | 'neu' | 'ink-3'}`;
  /** Tailwind class for borders/text where a util is preferred */
  tailwindBorderClass: string;
  /** Status family — used for grouping (ribbon underline, leaderboard tag, etc.) */
  family: 'positive' | 'mid' | 'negative' | 'neutral' | 'rule';
}

const TABLE: Record<CaseStatusKey, StatusColor> = {
  all: {
    variable: '--cc-stat-ink-3',
    tailwindBorderClass: 'border-cc-ink-3',
    family: 'rule',
  },
  unclaimed: {
    variable: '--cc-stat-neg',
    tailwindBorderClass: 'border-cc-stat-neg',
    family: 'negative',
  },
  claimed: {
    variable: '--cc-stat-mid',
    tailwindBorderClass: 'border-cc-stat-mid',
    family: 'mid',
  },
  in_progress: {
    variable: '--cc-stat-mid',
    tailwindBorderClass: 'border-cc-stat-mid',
    family: 'mid',
  },
  partly_done: {
    variable: '--cc-stat-neu',
    tailwindBorderClass: 'border-cc-stat-neu',
    family: 'neutral',
  },
  closed: {
    variable: '--cc-stat-pos',
    tailwindBorderClass: 'border-cc-stat-pos',
    family: 'positive',
  },
  overdue: {
    variable: '--cc-stat-neg',
    tailwindBorderClass: 'border-cc-stat-neg',
    family: 'negative',
  },
  unknown: {
    variable: '--cc-stat-ink-3',
    tailwindBorderClass: 'border-cc-ink-3',
    family: 'rule',
  },
};

export function statusColor(key: CaseStatusKey): StatusColor {
  return TABLE[key] ?? TABLE.unknown;
}

export function cssVar(key: CaseStatusKey): string {
  const v = statusColor(key).variable;
  return v === '--cc-stat-ink-3' ? 'var(--cc-ink-3)' : `var(${v})`;
}

export function tailwindBorderClass(key: CaseStatusKey): string {
  return statusColor(key).tailwindBorderClass;
}
