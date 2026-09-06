<template>
  <!--
    Clearing `failed` swaps the v-if branch, which unmounts the fallback and
    mounts the slot content fresh — so a retry genuinely re-runs the failed
    component's setup and lifecycle hooks rather than reviving a dead instance.
  -->
  <component :is="chrome" v-if="failed" v-bind="chromeProps">
    <div
      class="flex justify-center items-center h-full p-6 bg-crisiscleanup-light-smoke"
    >
      <div class="max-w-md w-full">
        <PaneError :title="title" :description="description">
          <template #action>
            <base-button
              variant="solid"
              size="small"
              data-testid="testErrorBoundaryRetryButton"
              :action="retry"
              :alt="$t('actions.retry')"
              :text="$t('actions.retry')"
            />
          </template>
        </PaneError>
      </div>
    </div>
  </component>

  <template v-else>
    <slot />
  </template>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import PaneError from '@/components/phone/foundation/PaneError.vue';
import Home from '@/layouts/Home.vue';
import { CONNECTIVITY_ERROR_KEY, isCancelledRequest } from '@/utils/errors';

/**
 * Vue's answer to a React error boundary, with a wider net: `onErrorCaptured`
 * also catches async rejections from lifecycle hooks, which React boundaries
 * do not see at all. That is exactly the failure this exists for — a page
 * whose `onMounted` awaits a request that never lands, leaving it stuck on a
 * spinner forever with only a `[Vue warn]` in the console.
 */

/**
 * Errors raised while a view is being brought up. Only these replace the
 * subtree: if a *rendered* page's save button fails, blowing the whole page
 * away and losing the user's context is far worse than the failure itself.
 * Event-handler and watcher errors are left to the toast layer.
 *
 * Two spellings because Vue swaps the `info` argument in production builds —
 * dev gives 'mounted hook', prod gives
 * 'https://vuejs.org/error-reference/#runtime-m'
 * (runtime-core.esm-bundler.js:232). Matching only the readable form would
 * silently stop working in the deployed app.
 */
const BRING_UP_PHASES = new Set([
  'setup function',
  'render function',
  'beforeCreate hook',
  'created hook',
  'beforeMount hook',
  'mounted hook',
  'serverPrefetch hook',
]);
const BRING_UP_CODES = new Set(['0', '1', 'bc', 'c', 'bm', 'm', 'sp']);

/** Mirrors the chunk-load handling in src/router.ts and src/main.ts. */
const CHUNK_LOAD_ERROR_PATTERN =
  /preloaderror|failed to fetch dynamically imported module|importing a module script failed|is not a valid javascript mime type|unable to preload css/i;

function isBringUpPhase(info: string): boolean {
  if (BRING_UP_PHASES.has(info)) return true;
  const code = info.split('#runtime-')[1];
  return code !== undefined && BRING_UP_CODES.has(code);
}

function isChunkLoadError(error: unknown): boolean {
  return CHUNK_LOAD_ERROR_PATTERN.test(String((error as Error)?.message ?? ''));
}

const { t } = useI18n();
const route = useRoute();

const failed = ref(false);

const title = computed(() => t('~~This page could not be loaded'));
const description = computed(() => t(CONNECTIVITY_ERROR_KEY));

/**
 * On public routes the page renders its own chrome (`<Home>`), so replacing
 * the page would otherwise strip the nav, the register CTA and the footer —
 * leaving a survivor with an error card and no way out. Authenticated routes
 * keep their sidebar and header from the layout itself, so plain markup is
 * enough there.
 */
const isUnauthenticatedRoute = computed(
  () => route.meta?.layout === 'unauthenticated',
);
const chrome = computed(() => (isUnauthenticatedRoute.value ? Home : 'div'));
const chromeProps = computed(() =>
  isUnauthenticatedRoute.value ? { noHotline: true } : {},
);

onErrorCaptured((error: unknown, _instance, info: string) => {
  // Returning `undefined` (never `false`) keeps the error flowing to
  // app.config.errorHandler, which is how Sentry sees it. Swallowing here
  // would trade a UX bug for an observability blind spot.
  if (isCancelledRequest(error)) return;

  // The router already reloads once on a stale-chunk failure; showing a
  // fallback first would just flash before that reload lands.
  if (isChunkLoadError(error)) return;

  if (!isBringUpPhase(info)) return;

  failed.value = true;
});

/**
 * One boundary instance spans every route sharing a layout, so without this a
 * user who hits a single broken page stays in the fallback for the rest of the
 * session. Guarded on `failed` so healthy navigation never bumps the key —
 * bumping unconditionally would force a remount (and refetch) on transitions
 * that currently reuse the component instance.
 */
watch(
  () => route.fullPath,
  () => {
    if (!failed.value) return;
    failed.value = false;
  },
);

function retry() {
  failed.value = false;
}
</script>
