import { createI18n } from 'vue-i18n';

const getI18n = (messages = {}) => {
  return createI18n({
    legacy: false,
    formatFallbackMessages: true,
    silentFallbackWarn: false,
    locale: 'en',
    messages,
  });
};

export const i18n = getI18n();

/**
 * Post-process a translated string by interpolating `{name}` placeholders
 * against the supplied named args.
 *
 * vue-i18n's `formatFallbackMessages: true` returns the raw key when a
 * translation is missing, *without* running the placeholder interpolation
 * (the compiler short-circuits on missing keys). Our `~~English with {n}`
 * sentinel keys (CLAUDE.md convention) therefore rendered literally — e.g.
 * "View all {n} →". We catch that case here.
 *
 * Used by the `$t` override installed in `src/main.ts` so every template
 * `$t(key, named)` call benefits without touching call sites.
 */
export const interpolateNamedFallback = (
  result: unknown,
  named?: Record<string, string | number | boolean>,
): unknown => {
  if (typeof result !== 'string' || !named) return result;
  if (!result.includes('{')) return result;
  return result.replaceAll(/{(\w+)}/g, (match, name: string) => {
    const v = named[name];
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return v.toString();
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    return match;
  });
};
