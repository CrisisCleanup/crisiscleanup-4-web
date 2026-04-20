# Performance Improvement Specs

Spec-driven backlog for `crisiscleanup-4-web` performance work. Each spec below is self-contained: a problem statement, requirements, acceptance criteria, design sketch, and verification. Any spec can be picked up and shipped independently.

## How to use this doc

- Update the **Tracking** table when a spec moves (`todo` → `in-progress` → `in-review` → `done`).
- Link PRs in the **PR / Notes** column.
- Measure against the spec's **Acceptance Criteria** section before marking `done`.
- New perf work: add a spec (next free `PERF-XXX`), prepend a row to the tracking table.

## Context

Vue 3 + Vite SPA for disaster-response case management. Heavy surfaces: Leaflet + PixiJS map, large admin tables, phone system with WebSockets, and a stack of visualization libs (D3, ApexCharts, Schedule-X). Recent commits (`5a4e21f6`, `bd542f76`, `c8edcf76`, `91d204bd`) show active fights with map teardown races and Google Places quota — signs of real user-visible perf pain.

Priorities: P0 = ship first (correctness or highest user-visible impact); P1 = ship next; P2 = cleanup.

---

## Tracking

| ID | Title | Priority | Status | Owner | PR / Notes |
|----|-------|----------|--------|-------|------------|
| [PERF-018](#perf-018--initial-route-critical-path-slimming) | Initial route critical-path slimming | P0 | in-review | — | Post-fix (2026-04-20): `dist/index.html` references only `index` + `vendor-vue` (+ their CSS) ≈ **596 KB gzip** (was 2.14 MB). Removed Google Maps, Zendesk, Font Awesome CDN from `index.html` (moved to idle-callback loaders in `src/utils/{scriptLoader,googleMaps,zendesk}.ts`); fonts switched to `media="print" onload` non-blocking pattern. De-globalized `Datepicker`, `VueTagsInput`, `FormTree` via `defineAsyncComponent`; dropped unused `vSelect` registration; localized `VueApexCharts` + `JsonViewer` into their sole consumers. Extracted `IncidentAniAsset`/`GroupedAssets` types to `src/types/incident-assets.ts` so public disaster pages no longer pull the admin SFC. Deleted the dead `import downloads from '@/pages/Downloads.vue'` from `IncidentAssetBuilder.vue`. Moved `RRule` out of `src/filters/index.ts` (now `src/utils/rrule.ts`) so rrule isn't on every consumer's critical path. Deduped `setupLanguage()` to App.vue only (removed from Unauthenticated.vue layout). Split Authenticated preload into immediate (Incident/Organization/Language) + idle-callback (Report/Role/PhoneStatus/geolocation). Replaced over-aggressive `group-downloads` + per-domain vendor manualChunks with one `vendor-vue` core chunk — heavy libs (pdf/leaflet/d3/schedule-x/quill) now stay with their lazy route consumers and are no longer statically reachable from the entry chunk. AC1 ✓ (none of vendor-pdf/charts/calendar/group-downloads referenced in `dist/index.html`). AC2 ⚠ 596 KB vs 450 KB budget — remaining gap is ~310 KB entry chunk (src shell) + ~267 KB vendor-vue (vue/i18n/vuex/lodash/dayjs/axios/floating-vue/toastification). AC4 ✓ (Unauthenticated routes no longer double-fire `setupLanguage`). AC3/AC5 still pending manual smoke. |
| [PERF-001](#perf-001--websocket-reconnect-cleanup--exponential-backoff) | WebSocket reconnect cleanup + backoff | P0 | in-review | — | Rewrote hook with scope-dispose, backoff + jitter, explicit `close()`, non-recoverable close codes skipped. New tests: `test/unit/hooks/useWebSockets.test.ts`. |
| [PERF-002](#perf-002--usesitestatistics-interval-leak) | `useSiteStatistics` interval leak | P0 | in-review | — | Added `onScopeDispose` clearing `statsInterval`. |
| [PERF-003](#perf-003--workvue-query-watch--drop-jsonstringify) | `Work.vue` query watch — drop `JSON.stringify` | P0 | in-review | — | Replaced in-callback double-`JSON.stringify` with a cached `worksiteQuerySignature` computed; `watch` now fires on string `===` change, one stringify per dependency tick. |
| [PERF-004](#perf-004--fontawesome-tree-shaking) | FontAwesome tree-shaking | P0 | in-review | — | Option A: replaced `library.add(fas/far/fab)` in `src/main.ts` with 60 explicit per-icon imports + `faStarRegular`. Brands pack fully dropped. Verified: prod build succeeds, no `prefix:"fab"` entries in any emitted chunk. |
| [PERF-005](#perf-005--migrate-moment--dayjs-and-drop-moment-deps) | Migrate moment → dayjs and drop moment deps | P0 | in-review | — | New central `src/utils/dates.ts` re-exports a dayjs configured with 14 plugins (utc/timezone/duration/relativeTime/customParseFormat/localizedFormat/isBetween/isSameOrBefore/isSameOrAfter/advancedFormat/calendar/minMax/weekOfYear/objectSupport) plus a `timezoneNames()` helper backed by `Intl.supportedValuesOf('timeZone')`. Bulk-replaced `import moment from 'moment' \| 'moment-timezone' \| 'moment/moment'` across ~65 files; renamed 5 `moment.Moment` type refs to `moment.Dayjs`; swapped `moment.tz.names()` to the helper. Dropped `moment`, `moment-duration-format`, `moment-timezone` from `package.json`. Build + full test suite pass. |
| [PERF-006](#perf-006--vendor-chunk-splitting) | Vendor chunk splitting | P1 | in-review | — | Replaced `manualChunks` object in `vite.config.ts` with a function. Preserved `group-downloads`; added `vendor-map` (leaflet/pixi/geoman family), `vendor-charts` (d3/apexcharts), `vendor-calendar` (@schedule-x/rrule), `vendor-editor` (quill/markdown-it/highlight.js), `vendor-pdf` (jspdf/html2canvas/vue-pdf-embed/qrcode), `vendor-vue` (vue/router/i18n/vuex/@vueuse). AC1 ✓ (six named chunks emitted). AC2 ✓ (vendor hashes stable across trivial src change). AC3 ⚠ soft-budget violated: `vendor-pdf` 3.0 MB, `vendor-editor` 1.5 MB, `vendor-map` 1.0 MB raw — matches spec's proposed grouping; further subdivision would be a follow-up. |
| [PERF-007](#perf-007--virtualize-large-tables) | Virtualize large tables | P1 | todo | — | — |
| [PERF-008](#perf-008--http-response-caching--request-dedup) | HTTP response caching + request dedup | P1 | todo | — | — |
| [PERF-009](#perf-009--chunk-id__in-bulk-queries) | Chunk `id__in` bulk queries | P1 | todo | — | — |
| [PERF-010](#perf-010--auto-cancel-in-flight-requests-on-scope-dispose) | Auto-cancel in-flight requests on scope dispose | P1 | todo | — | — |
| [PERF-011](#perf-011--move-csv-generation-off-main-thread) | Move CSV generation off main thread | P1 | todo | — | — |
| [PERF-012](#perf-012--relocate-marketing-assets-lazy-load-images) | Relocate marketing assets; lazy-load images | P2 | todo | — | — |
| [PERF-013](#perf-013--lodash--lodash-es-named-imports) | `lodash` → `lodash-es` named imports | P2 | todo | — | — |
| [PERF-014](#perf-014--dedupe-tailwind-entrypoints) | Dedupe Tailwind entrypoints | P2 | todo | — | — |
| [PERF-015](#perf-015--conditional-sourcemaps--compression) | Conditional sourcemaps + compression | P2 | todo | — | — |
| [PERF-016](#perf-016--i18n-message-bundle-splitting) | i18n message bundle splitting | P2 | todo | — | — |
| [PERF-017](#perf-017--stable-map-listeners-across-filter-changes) | Stable map listeners across filter changes | P2 | todo | — | — |

Legend: `todo` / `in-progress` / `in-review` / `done` / `wont-do`.

---

## PERF-001 — WebSocket reconnect cleanup + exponential backoff

**Priority:** P0 (correctness: memory leak + server hammering)

**Problem.** `src/hooks/useWebSockets.ts` (57 lines) has three defects:
1. `setTimeout(..., 1000)` at line 39 schedules reconnects with no `clearTimeout` anywhere.
2. No `onScopeDispose` / `onUnmounted` — sockets and reconnect timers outlive their component.
3. Fixed 1 s reconnect with no backoff or jitter → thundering herd during outages.

**Goals.** Sockets and their reconnect timers die with the owning scope. Backend outages produce a jittered retry curve.

**Non-goals.** Replacing the protocol or the consumer APIs.

**Requirements.**
- R1. On scope dispose, close the socket and clear any pending reconnect timer.
- R2. Reconnect delay: `min(1_000 * 2 ** attempt, 30_000) + random(0..500)`; reset to 0 on successful `open`.
- R3. Expose an explicit `close()` method on the returned object.
- R4. On 4xx close codes (`1008`, `4401`, etc.), stop reconnecting and surface the failure.
- R5. Token is read fresh from `authStore.currentAccessToken.value` *inside* `connect()` (already correct — preserve).

**Acceptance criteria.**
- AC1. Mount a component using `useWebSockets`, navigate away 10 times; Chrome DevTools → Memory heap snapshot shows 0 lingering `WebSocket` instances.
- AC2. Kill the WS backend for 60 s; client retries follow backoff, not a tight 1 s loop. Verify via Network tab timing.
- AC3. After scope dispose, no `setTimeout` handles remain.

**Design.**
- Consider swapping to `@vueuse/core`'s `useWebSocket` which already implements R1–R4. If the existing call signature must be preserved, wrap `useWebSocket` and adapt.
- If staying custom: track `reconnectTimer: number | null` and `attempt: number` in closure; clear both on `close()` and via `onScopeDispose`.

**Files.** `src/hooks/useWebSockets.ts`; verify all consumers in `src/hooks/usePhoneSystem*` and `src/pages/phone/*`.

**Verification.** Chrome perf trace before/after (navigate 10×); memory stable. Simulated backend outage shows jittered reconnect curve.

---

## PERF-002 — `useSiteStatistics` interval leak

**Priority:** P0 (memory)

**Problem.** `src/hooks/live/useSiteStatistics.ts:76` starts `setInterval(countUpStats, 1000)` and only clears it on `fetchSiteStatistics` re-entry (line 56). When the consuming component unmounts, the interval keeps running forever.

**Requirements.**
- R1. Clear `statsInterval` on scope dispose.

**Acceptance criteria.**
- AC1. Navigate to the dashboard, then away, 10 times. `window.performance.now()` trace shows no recurring 1 Hz tasks after the last unmount.

**Design.** Add `onScopeDispose(() => { if (statsInterval.value) clearInterval(statsInterval.value); })` at the top level of the composable.

**Files.** `src/hooks/live/useSiteStatistics.ts`.

**Verification.** DevTools Performance tab: record 30 s after navigating away from dashboard. No `countUpStats` frames.

---

## PERF-003 — `Work.vue` query watch — drop `JSON.stringify`

**Priority:** P0 (main-page jank)

**Problem.** `src/pages/Work.vue:2027-2034`:
```ts
watch(() => worksiteQuery.value, (v, p) => {
  if (JSON.stringify(v) !== JSON.stringify(p)) reloadMap();
});
```
`JSON.stringify` runs on every reactive tick; `reloadMap` tears down and rebuilds Leaflet + Pixi overlays, which is expensive. `worksiteQuery` mutates on filter/sort/pagination — many of those deltas don't actually affect the map.

**Requirements.**
- R1. The map only reloads when *map-relevant* query keys change.
- R2. No per-tick serialization of the entire query object.

**Acceptance criteria.**
- AC1. Typing into a filter input on `/work/:incident` produces ≤ 1 `reloadMap` per settled state (debounced).
- AC2. Changing pagination (page number) does not trigger `reloadMap`.
- AC3. Performance tab: no stringify frames > 1 ms in the hot path.

**Design.**
- Define `mapQueryKey = computed(() => [q.swLat, q.swLng, q.neLat, q.neLng, q.work_type, q.status, …].join('|'))` listing only keys that affect markers.
- `watch(mapQueryKey, reloadMap)`.
- Keep the table list bound to the full query via its own watch.

**Files.** `src/pages/Work.vue` (search for `worksiteQuery` and `reloadMap`).

**Verification.** Performance trace while filtering a status facet: total main-thread blocking time after fix < 40 % of baseline.

---

## PERF-004 — FontAwesome tree-shaking

**Priority:** P0 (bundle size)

**Problem.** `src/main.ts:11-13, 78-80` eagerly registers `fas`, `far`, `fab` — the entire solid, regular, and brands icon catalogs. Only a small subset is actually used in the app.

**Requirements.**
- R1. Only icons used in templates land in the bundle.
- R2. No runtime regression in icon rendering across all pages.

**Acceptance criteria.**
- AC1. `dist/assets/*.js` analyzed via `rollup-plugin-visualizer` shows FontAwesome footprint reduced by ≥ 80 %.
- AC2. E2E `pnpm run test:e2e:primary` passes.
- AC3. Manual smoke on 10 key pages: no missing icons.

**Design.** Two options, pick one.

- **Option A — Per-icon imports (low risk):**
  - Grep the codebase for `icon="..."` usages and FontAwesome icon names to build the set used.
  - Replace the three `library.add(fa?)` calls with a single `library.add(faPencil, faBell, …)` listing only what's referenced.
- **Option B — Migrate to `unplugin-icons`** (already wired at `vite.config.ts:47-52`):
  - Replace `<FontAwesomeIcon icon="pencil" />` with iconify-style imports.
  - Higher-value longer-term but bigger diff; prefer A for a first ship.

**Files.** `src/main.ts:11-13, 78-80`; every template that uses `<FontAwesomeIcon>` / `font-awesome-icon`.

**Verification.** Bundle analyzer diff. Visual smoke on dashboard, work page, admin, phone, profile.

**Dependencies.** None.

---

## PERF-005 — Migrate moment → dayjs and drop moment deps

**Priority:** P0 (bundle size)

**Problem.** Both `moment` and `dayjs` are shipped. `package.json:105,132-134` declares `dayjs`, `moment`, `moment-duration-format`, `moment-timezone`. Moment is ~67 KB min + locales. Usages are concentrated:
- `src/filters/index.ts:2,4,39,47,128-130` — `formatDateString`, `momentFromNow`, `formatSeconds`.
- `src/hooks/live/useSiteStatistics.ts:80,207` — direct `moment()` calls in query params.
- `src/utils/data_filters/WorksiteDatesFilter.ts` — date filter building.

**Requirements.**
- R1. Every moment callsite replaced with a dayjs equivalent.
- R2. `moment`, `moment-duration-format`, `moment-timezone` removed from `package.json`.
- R3. dayjs plugins (`utc`, `duration`, `relativeTime`, `timezone`, `customParseFormat`) registered once centrally (e.g. `src/utils/dates.ts`).

**Acceptance criteria.**
- AC1. `grep -R "from 'moment'" src/` returns zero results.
- AC2. `pnpm run test` passes; existing date-filter tests still green.
- AC3. Bundle analyzer shows moment fully removed.
- AC4. Live smoke on Reports page, dashboard, Work page date filters — no date-format regressions.

**Design.**
- Create `src/utils/dates.ts` exporting `dayjs` with plugins attached.
- Mechanical substitutions (matching existing API shape):
  - `moment(x).format(f)` → `dayjs(x).format(f)`
  - `moment(x).fromNow()` → `dayjs(x).fromNow()` (with `relativeTime` plugin)
  - `moment.duration(s, 's')` → `dayjs.duration(s, 'seconds')` (with `duration` plugin)
  - `moment.utc(...)` → `dayjs.utc(...)` (with `utc` plugin)
  - `moment.tz(...)` → `dayjs.tz(...)` (with `timezone` plugin)
- Keep changes per-file so git bisect is useful if a format diverges.

**Files.** `src/filters/index.ts`, `src/hooks/live/useSiteStatistics.ts`, `src/utils/data_filters/WorksiteDatesFilter.ts`, plus a codebase grep for any other `moment` usages.

**Verification.** Test suite; visualizer diff; manual smoke on all date surfaces (Reports, Calendar, Work filters).

**Dependencies.** None (dayjs already installed).

---

## PERF-006 — Vendor chunk splitting

**Priority:** P1 (bundle + HTTP cache hit rate)

**Problem.** `vite.config.ts:80-92` defines only a `group-downloads` manual chunk. Heavy libs (Leaflet, PixiJS, D3, ApexCharts, Schedule-X, Quill, jspdf, html2canvas) end up in whichever route chunk first imports them, duplicating across routes and invalidating cache on every release even for unrelated code changes.

**Requirements.**
- R1. Each heavy vendor group lives in its own named chunk.
- R2. Small/frequently-changing code stays in route chunks.
- R3. Initial critical-path chunk doesn't regress.

**Acceptance criteria.**
- AC1. `dist/` contains distinct `vendor-map-*.js`, `vendor-charts-*.js`, `vendor-calendar-*.js`, `vendor-editor-*.js`, `vendor-pdf-*.js`, `vendor-vue-*.js` chunks.
- AC2. Re-running `pnpm build` after a small change to a page file produces a new page chunk but the vendor chunks retain their prior hashes.
- AC3. No chunk > 1 MB raw (soft budget).

**Design.** Replace the `manualChunks` object with a function:
```ts
manualChunks(id) {
  if (id.includes('node_modules')) {
    if (/[\\/](leaflet|@pixi|pixi|leaflet-draw|leaflet-loading|leaflet-pixi-overlay|leaflet\.heat|leaflet\.markercluster|@geoman-io)[\\/]/.test(id)) return 'vendor-map';
    if (/[\\/](d3|d3-.*|apexcharts|vue3-apexcharts)[\\/]/.test(id)) return 'vendor-charts';
    if (/[\\/](@schedule-x|rrule)[\\/]/.test(id)) return 'vendor-calendar';
    if (/[\\/](quill|markdown-it|markdown-it-.*|highlight\.js)[\\/]/.test(id)) return 'vendor-editor';
    if (/[\\/](jspdf|html2canvas|vue-pdf-embed|qrcode|qrcode-svg)[\\/]/.test(id)) return 'vendor-pdf';
    if (/[\\/](vue|vue-router|vue-i18n|vuex|@vueuse)[\\/]/.test(id)) return 'vendor-vue';
  }
}
```
Also: preserve the existing `group-downloads` rule.

**Files.** `vite.config.ts`.

**Verification.** `pnpm build` twice with a trivial src change between; diff hashes. Visualizer diff. Smoke-test key pages.

---

## PERF-007 — Virtualize large tables

**Priority:** P1 (admin-page jank)

**Problem.** `src/components/Table.vue:124-205` renders `v-for item in data` × `v-for column in columns` × slot. Admin tables (UsersTable, OrganizationsTable, WorksiteImport) can render 500+ rows × 8+ columns = thousands of nodes, with no virtualization.

**Requirements.**
- R1. Row list virtualized; only visible rows (+ buffer) are in the DOM.
- R2. Header remains sticky and static.
- R3. No behavioral regression for pagination, row selection, row details expansion, column click actions, or slot contents.

**Acceptance criteria.**
- AC1. Load an admin table with 500 rows. Scroll at 60 fps (measured in Performance tab).
- AC2. Row selection / row-details toggle still work.
- AC3. Existing tests / E2E pass.

**Design.**
- Add `vue-virtual-scroller`'s `RecycleScroller` around the `<div v-for="item of data">` block only.
- Set a fixed row height (measure current average; ~48–56 px). Use `itemSize` prop.
- Keep the header grid unchanged.
- If variable row height is needed (row details expanded), use `DynamicScroller` with `DynamicScrollerItem`.

**Files.** `src/components/Table.vue`, `src/components/AjaxTable.vue`.

**Verification.** FPS trace with 500 rows; existing unit + e2e pass; manual smoke on `organization/Users.vue`, `admin/Organizations.vue`, any other big tables.

**Dependencies.** New dep: `vue-virtual-scroller`.

---

## PERF-008 — HTTP response caching + request dedup

**Priority:** P1 (network)

**Problem.** `src/hooks/useApi.ts` is a thin axios wrapper; no cache or dedup. Same endpoints called repeatedly across components (e.g., `/worksites?fields=…` from `src/components/work/WorksiteSearchInput.vue:294-303` and `src/pages/Work.vue:1406, 1823`; enums fetched by multiple consumers). No TanStack Query.

**Requirements.**
- R1. Identical GET requests in flight dedupe to one network call.
- R2. Effectively-immutable endpoints (enums, org-list, incident-list) cached for the session.
- R3. Opt-in cache TTL for other reads.

**Acceptance criteria.**
- AC1. Navigate across three pages that all read enums — Network tab shows one `/enums` request, not three.
- AC2. Typing repeatedly into `WorksiteSearchInput` with the same query doesn't fire duplicate backend calls.

**Design.** Two tiers:
- **Tier A (cheap):** add a request-dedup + short-TTL cache interceptor on top of the existing axios instance. Key on `method + url + params-hash`. Store entries in an in-memory `Map`; evict on `TTL` or manual invalidate.
- **Tier B (long-term):** adopt `@tanstack/vue-query` for reads. Queries identified via existing hook boundaries. Out of scope for the first ship.

Ship Tier A first; Tier B is a follow-up spec.

**Files.** `src/hooks/useApi.ts`, new `src/utils/axiosCache.ts`.

**Verification.** Network tab diff. Unit test the cache utility directly.

---

## PERF-009 — Chunk `id__in` bulk queries

**Priority:** P1 (correctness + network)

**Problem.** `src/pages/Work.vue:1406, 1823` builds `?id__in=…` from arbitrary-length ID arrays. No chunking → risk of URI too long (414), giant responses, long wait before first byte.

**Requirements.**
- R1. `id__in` calls chunk into batches of ≤ 50 IDs.
- R2. Results from chunks merge deterministically.
- R3. If a batch endpoint exists server-side, prefer POST with a JSON body of IDs.

**Acceptance criteria.**
- AC1. Selecting 500 cases and batch-editing status produces a series of ≤ 50-ID requests, all succeed.
- AC2. No 414s under stress.

**Design.** Extract `fetchWorksitesByIds(ids: number[])` utility that chunks + `Promise.all`s. Replace inline `id__in` usages in `Work.vue` with the utility.

**Files.** `src/pages/Work.vue`, new/extended `src/utils/worksite.ts` helper.

**Verification.** Unit test the chunker. Manual test: batch-update 500 cases.

---

## PERF-010 — Auto-cancel in-flight requests on scope dispose

**Priority:** P1 (correctness)

**Problem.** `useApi()` exposes `abort()` but no consumer wires it to unmount / route change. Debounced searches (`WorksiteSearchInput.vue`) can resolve after the user has navigated, mutating stale state.

**Requirements.**
- R1. Any `useApi` call scoped to a component auto-aborts on `onScopeDispose`.
- R2. Opt-out for hooks that intentionally survive unmount (e.g., global initializers).

**Acceptance criteria.**
- AC1. Navigate during a search — Network tab shows the pending request cancelled.
- AC2. No "Setting state after unmount" warnings in console.

**Design.** Inside `useApi`, register `onScopeDispose(() => controller.abort())`. Add a `{ keepAlive: true }` escape hatch.

**Files.** `src/hooks/useApi.ts`.

**Verification.** Navigate-during-fetch smoke; check for console warnings.

---

## PERF-011 — Move CSV generation off main thread

**Priority:** P1 (export UX)

**Problem.** `src/utils/downloads.ts:28-44` concatenates CSV as a single string on the main thread; large exports stall the tab. `papaparse` is already a dep and used correctly in `src/pages/organization/Users.vue`.

**Requirements.**
- R1. All CSV generation uses `papaparse`.
- R2. Exports > 5 k rows run in a Web Worker.

**Acceptance criteria.**
- AC1. Export 10 k rows — UI remains interactive (frame time stays < 50 ms).
- AC2. Resulting CSV matches previous output byte-for-byte on an equivalent dataset.

**Design.** Replace string concat in `downloads.ts` with `Papa.unparse`. For large datasets, wrap generation in a small `Worker` (Vite supports `new Worker(new URL('./x.ts', import.meta.url), { type: 'module' })`).

**Files.** `src/utils/downloads.ts`, callers.

**Verification.** Compare CSV output on fixture data; Performance trace of 10 k-row export.

---

## PERF-012 — Relocate marketing assets; lazy-load images

**Priority:** P2 (bundle + TTFB)

**Problem.** `src/assets/` has ~22 MB (headshots 9.1 MB, email templates 5.7 MB, news 3.2 MB, partners 1.1 MB) — all go through Vite's hashing/copying pipeline even though they're rarely needed at first paint. No `loading="lazy"` on `<img>` tags site-wide.

**Requirements.**
- R1. Marketing/static content moves to `public/` or a CDN.
- R2. All user-facing `<img>` tags use `loading="lazy"` (except above-the-fold).
- R3. Worksite photos support responsive `srcset` (or CDN transforms) — follow-up if infra not present.

**Acceptance criteria.**
- AC1. `src/assets/` drops below 3 MB.
- AC2. `dist/assets/` image footprint drops proportionally.
- AC3. All marketing pages still render correctly.

**Design.** Move `headshots/`, `email/`, `news/`, `partners/` to `public/`. Update references (`src="/headshots/..."`). Add `loading="lazy"` via a codemod pass.

**Files.** `src/assets/**` (move); consumers (update paths); `<img>` templates site-wide (attr).

**Verification.** Build output diff; visual smoke of marketing/About pages.

---

## PERF-013 — `lodash` → `lodash-es` named imports

**Priority:** P2 (bundle)

**Problem.** `vite.config.ts:4` and `src/filters/index.ts:3` use default `lodash` import (`import _ from 'lodash'`), disabling tree-shaking.

**Requirements.**
- R1. Replace `_.fn(...)` with `import { fn } from 'lodash-es'`.
- R2. Prefer native JS where the replacement is trivial (e.g., `Array.prototype.filter`).

**Acceptance criteria.**
- AC1. `grep -R "from 'lodash'$" src/` returns zero.
- AC2. Bundle analyzer shows only referenced lodash methods present.

**Files.** `vite.config.ts`, `src/filters/index.ts`, any other `from 'lodash'` hit.

**Verification.** Unit tests; visualizer diff.

---

## PERF-014 — Dedupe Tailwind entrypoints

**Priority:** P2 (bundle)

**Problem.** `src/style.css:1-3` and `src/assets/css/tailwind.css:1-3` both declare `@tailwind base/components/utilities`. One is enough.

**Requirements.**
- R1. Exactly one Tailwind entrypoint.

**Acceptance criteria.**
- AC1. Production CSS size decreases.
- AC2. No visual regressions.

**Files.** Delete `src/assets/css/tailwind.css` (or consolidate into `src/style.css`); update any imports.

**Verification.** Visual smoke of 5 random pages.

---

## PERF-015 — Conditional sourcemaps + compression

**Priority:** P2 (build + deploy)

**Problem.** `vite.config.ts:107-109` sets `sourcemap: true` on every build. No compression plugin configured; CDN/server may or may not be doing it.

**Requirements.**
- R1. Sourcemaps gated behind an env flag (e.g., `ENABLE_SOURCEMAPS=1`) or the existing Sentry upload flow.
- R2. Gzip + Brotli precompressed assets emitted for build.

**Acceptance criteria.**
- AC1. Default `pnpm build` emits no `.map` files unless flag set.
- AC2. `dist/assets/*.gz` and `*.br` exist for each JS/CSS output.

**Design.** Gate sourcemap on `process.env.ENABLE_SOURCEMAPS`. Add `vite-plugin-compression` for gzip and brotli.

**Files.** `vite.config.ts`.

**Verification.** `ls dist/assets` pre/post.

---

## PERF-016 — i18n message bundle splitting

**Priority:** P2 (bundle)

**Problem.** `src/modules/i18n.ts` initializes `messages: {}` but locale loading appears to pull whole-language bundles. Verify and switch to per-locale dynamic imports with a small manifest.

**Requirements.**
- R1. Only the active locale's messages are fetched.
- R2. Switching locales dynamically imports the next bundle.

**Acceptance criteria.**
- AC1. Network tab on cold load shows exactly one locale messages chunk.
- AC2. Locale switch produces one additional fetch.

**Files.** `src/modules/i18n.ts`, `src/hooks/useSetupLanguage.ts`.

**Verification.** Network tab traces; E2E locale-switch test.

---

## PERF-017 — Stable map listeners across filter changes

**Priority:** P2 (depends on PERF-003)

**Problem.** `src/hooks/worksite/useMapMarkers.ts:38-92` `off()`s and re-`on()`s `click` + `mousemove` handlers inside every `setupMarkers()` call (triggered by every `reloadMap` — see PERF-003). Correctness is fine but the churn is pure waste.

**Requirements.**
- R1. `click` + `mousemove` handlers are registered once per map lifecycle.
- R2. Handlers read current marker state via a ref, not a closure.

**Acceptance criteria.**
- AC1. After `reloadMap()`, event handler count on the map stays constant (verify via internal `_events` or counting `addEventListener` calls).
- AC2. Map click/hover still hit the correct marker.

**Design.** Hoist handler registration into `useMapInstance` / the composable that owns the map's lifetime. Keep a `markersRef` shared with `useMapMarkers`; the handlers read `markersRef.value` on invocation.

**Files.** `src/hooks/worksite/useMapMarkers.ts`, `src/hooks/useMapInstance*`.

**Verification.** Unit or manual: trigger `reloadMap` 10×, confirm event listener count stable.

**Dependencies.** Easier after PERF-003 reduces `reloadMap` frequency.

---

## PERF-018 — Initial route critical-path slimming

**Priority:** P0 (first paint / route-entry latency)

**Problem.** On 2026-04-20, the production build's `dist/index.html` referenced these assets before route-specific interaction:

- `index-LvNav48C.js` — 247,692 B gzip
- `vendor-vue-5HYjTu1u.js` — 118,206 B gzip
- `index-egyvgTuk.css` — 22,703 B gzip
- `vendor-calendar-Df-SooPM.js` + CSS — 65,849 B gzip
- `vendor-pdf-CoXSYU0c.js` — 969,791 B gzip
- `group-downloads-CgksljQJ.js` + CSS — 536,696 B gzip
- `vendor-charts-BnwwLt25.js` — 183,384 B gzip

That is roughly **2.14 MB gzip** on the HTML critical path before the user has even hit a calendar, PDF, download, or chart surface. Separately, `index.html` hard-loads Google Maps, Zendesk, Google Fonts, New Relic's inline bootstrap, and Font Awesome CDN CSS on every route. `src/main.ts` globally imports and registers optional UI libraries (`@vuepic/vue-datepicker`, `vue-select`, `floating-vue`, `vue-json-viewer`, `vue3-apexcharts`, tags input), which keeps them in the base entry. Public disaster pages also import types from `IncidentAssetBuilder.vue`, and that SFC statically imports `Downloads.vue`, creating an accidental path from public pages into the downloads/PDF chunk family. Startup locale setup is duplicated across `App.vue`, `Authenticated.vue`, and `Unauthenticated.vue`.

**Goals.** Public and login routes should download only the app shell, the active route, and the smallest shared vendor set needed to render that route. Optional integrations and admin/download code should move behind on-demand boundaries.

**Non-goals.** Replacing Google Maps, Zendesk, Font Awesome, or the current i18n/auth architecture outright.

**Requirements.**
- R1. `dist/index.html` must not directly reference `vendor-pdf`, `group-downloads`, `vendor-charts`, or `vendor-calendar` unless the entry route truly requires them.
- R2. Google Maps and Zendesk are loaded on demand from the first consumer, not hard-coded in `index.html`.
- R3. Optional UI packages currently imported in `src/main.ts` are localized to the components/routes that actually use them, or wrapped in async components/plugins.
- R4. Shared incident-asset interfaces move out of `IncidentAssetBuilder.vue` into a plain `.ts` module so public routes no longer pull admin/download code through type imports.
- R5. Locale bootstrap runs once per cold start; unauthenticated entry routes do not trigger the authenticated startup fan-out.
- R6. Existing charts, tooltips, selects, datepickers, PDFs, Maps, and Zendesk behavior still work when the user reaches those surfaces.

**Acceptance criteria.**
- AC1. `pnpm build` output shows `dist/index.html` no longer referencing `vendor-pdf`, `group-downloads`, `vendor-charts`, or `vendor-calendar`.
- AC2. Total gzip size of assets directly referenced by `dist/index.html` is **≤ 450 KB**.
- AC3. On cold-load of `/login` or `/disasters`, the Network tab shows no requests for Google Maps, Zendesk, PDF libs, chart libs, or downloads chunks before user interaction.
- AC4. Cold-load bootstrap triggers at most one `/languages` request and one active-locale message fetch.
- AC5. Manual smoke on `/dashboard`, `/disasters`, `/admin`, `/incident/:id/calendar`, `/downloads`, and a map/search surface shows no missing widgets or broken lazy integrations.

**Design.** Ship in three passes under one PR or as tightly-scoped commits:

- **Pass A — HTML critical path**
  - Remove static Google Maps, Zendesk, and Font Awesome CDN includes from `index.html`.
  - Introduce small script-loader utilities or consumer-owned lazy loaders.
  - Keep Google Fonts/New Relic only if they can remain non-blocking; otherwise gate or defer them as a follow-up inside the same spec.

- **Pass B — Base entry de-globalization**
  - In `src/main.ts`, stop globally registering optional libraries that are not needed on the first route.
  - Prefer local component imports or async wrappers for `Datepicker`, `VSelect`, `JsonViewer`, `VueApexCharts`, tag input, and `floating-vue` consumers.
  - Verify that the base entry no longer retains chart/calendar/PDF/download code via those global imports.

- **Pass C — Import-graph and bootstrap cleanup**
  - Extract `GroupedAssets` / `IncidentAniAsset` into a lightweight shared module, e.g. `src/types/incident-assets.ts`.
  - Update `src/utils/incident_assets.ts`, public disaster pages, and admin incident asset code to import types from the new module.
  - Remove the static `Downloads.vue` dependency path from public pages.
  - Dedupe `setupLanguage()` so only one cold-start path performs locale negotiation/fetching.
  - Move authenticated-only preload fan-out (`reports`, `roles`, `phone_statuses`, geolocation, etc.) behind route need or post-render background work.

**Files.**
- `index.html`
- `src/main.ts`
- `src/App.vue`
- `src/layouts/Authenticated.vue`
- `src/layouts/Unauthenticated.vue`
- `src/hooks/useSetupLanguage.ts`
- `src/components/admin/incidents/IncidentAssetBuilder.vue`
- `src/utils/incident_assets.ts`
- `src/pages/unauthenticated/disasters/Disasters.vue`
- `src/pages/unauthenticated/disasters/DisasterDetail.vue`
- New lightweight shared type/module and any lazy-loader utilities needed

**Verification.**
- `pnpm build`
- Inspect `dist/index.html` and emitted asset sizes; compare against the 2026-04-20 baseline above
- Bundle analyzer / emitted chunk diff proving the heavy vendor chunks are no longer on the critical path
- Browser Network-tab traces for `/login` and `/disasters`
- Manual smoke on calendar, chart, PDF, download, map, and Zendesk surfaces

**Dependencies.** Builds on PERF-006: vendor chunk splitting already exposed the heavy libraries; this spec removes their accidental reachability from the initial route.

---

## Cross-cutting verification

After any spec ships:

- `pnpm run typecheck && pnpm run lint`
- `pnpm run test`
- `pnpm run test:e2e:primary`
- Manual smoke on `/dashboard`, `/incident/:id/work`, `/phone`, `/organization/users`.
- For bundle-affecting specs (004, 005, 006, 012, 013, 014, 015, 016, 018): attach `rollup-plugin-visualizer` output to the PR; compare initial chunk + total transfer with `master`.
- For leak/perf-affecting specs (001, 002, 003, 007, 010, 011, 017): capture a DevTools Performance or Memory trace showing the improvement.

## Suggested build-budget guardrails (future)

- Add a CI step failing on:
  - Initial JS transfer > 500 KB gzipped
  - Any chunk > 1 MB raw
  - Total `dist/assets` > 15 MB
- Hook into `vite build` via `rollup-plugin-size` or a custom check over the manifest.
