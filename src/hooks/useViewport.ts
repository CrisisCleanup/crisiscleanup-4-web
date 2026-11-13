import {
  breakpointsTailwind,
  useBreakpoints,
  useMediaQuery,
} from '@vueuse/core';

// `breakpointsTailwind` holds Tailwind's default screens, which are the same
// values as `theme.screens` in tailwind.config.cjs. Templates chosen in script
// and `md:` / `lg:` classes must switch at the same widths, so change both
// together.
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller('md');
const isLargeScreen = breakpoints.greaterOrEqual('lg');
// The same height as the `short:` variant in tailwind.config.cjs.
const isShort = useMediaQuery('(max-height: 500px)');

/**
 * Viewport flags for logic that CSS cannot express, such as choosing between a
 * mobile and a desktop template. Prefer Tailwind's responsive classes when the
 * difference is only style.
 */
export function useViewport() {
  return { isMobile, isLargeScreen, isShort };
}
