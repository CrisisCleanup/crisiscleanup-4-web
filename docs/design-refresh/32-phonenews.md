# 32 — PhoneNews refresh

## Intent

`PhoneNews.vue` is a two-tab CMS reader (News / User guide) that
pulls two distinct CMS tag streams (`phone-news` and `user-guide`)
into a global `<tabs>` / `<tab>` component. Each tab lists 10 items
with thumbnail + title + 3-line content clamp; clicking an item
opens a modal via `useDialogs` + `CmsViewer`.

Overlap with spec 31:

- Spec 31 (`PhoneCmsItems`) renders a single CMS stream via
  `BlogPosts`. Spec 32 renders two streams via a custom list.
- Both poll `/cms?tags=…` every 5 minutes and emit `unreadCount`.
- The two components duplicate the fetch / polling / modal logic.

This spec does **not** merge the two files — that's a larger
refactor with cross-tab implications. It does the surface refresh
and wires a single shared tabs chrome that matches specs 25–31.

## Before / After

### Tabs chrome

| Concern | Current | Target |
|---|---|---|
| Outer | Raw `<tabs ref="tabs" tab-details-classes="h-full overflow-auto">` | Pane card wrapper: `<section class="bg-white rounded border border-crisiscleanup-grey-100 flex flex-col min-w-0">` with the `<tabs>` inside |
| Tab header | Global `<tabs>` default header | Same, but confirm the spec-14 polished tabs render consistently — if they don't, add a spec-14 follow-up note |
| Tab content | `overflow-auto` inside each tab | Same — natural scroll boundary is the pane card |

### List item

| Concern | Current | Target |
|---|---|---|
| Row | `<li class="hover:bg-crisiscleanup-light-grey cursor-pointer border-b-2">` — 2 px border-bottom is too heavy | `<li class="border-b border-crisiscleanup-grey-100 last:border-b-0 hover:bg-crisiscleanup-smoke transition cursor-pointer">` |
| Inner | `<div class="p-2 flex">` with 80×80 thumbnail + title + 3-line clamp | `<button class="w-full text-left p-3 flex gap-3 items-start">` — use a real button for a11y |
| Thumbnail | `w-20 h-20 mr-2` | `w-16 h-16 flex-none rounded bg-crisiscleanup-smoke object-cover` — drop the external `mr-2`, consolidated into parent `gap-3` |
| Fallback image | `cc-logo.svg` at 80×80 | Same glyph, but at 64×64 to match thumbnail; center inside the 16×16 slot |
| Title | `text-xl sm:text-sm my-1 font-bold truncate` | `text-[13px] font-semibold leading-snug line-clamp-1 text-black` |
| Body | `text-xs line-clamp-3` | `text-[12px] text-crisiscleanup-grey-900 line-clamp-2` — 2 lines is enough alongside the title |
| Wrapper height | `h-20 overflow-y-hidden` with fixed outer | drop the h-20 cap; use `line-clamp` for content control |

### States

| Concern | Current | Target |
|---|---|---|
| Empty (no items) | Nothing renders | `<PaneEmpty>` per tab — different copy for news vs. user guide |
| Error (axios throws) | `console.error`, silent | `<PaneError>` with retry |
| Loading | Nothing | `<PaneSkeleton variant="row">` ×6 per tab while the first fetch is pending |

### Script

| Concern | Current | Target |
|---|---|---|
| Two axios calls in `getNews` | News + UserGuide back-to-back | Parallelize with `Promise.all` — halves the time to first render |
| `newsInterval` clear on unmount | Already done | Unchanged |
| Unread count emission | Only on news stream | Unchanged — user guide doesn't contribute to the overlay badge |

## Files to touch

- **EDIT:** `src/components/phone/PhoneNews.vue` — template + `Promise.all` refactor.
- **NO changes** to `CmsViewer`, `useDialogs`.

## Implementation

### 1. Extract list-item component

Because both tabs render the same row markup, extract once:

```vue
<!-- local component inside PhoneNews.vue, or a small sibling file -->
<script setup lang="ts">
defineProps<{ item: any }>();
const emit = defineEmits<{ (e: 'click', item: any): void }>();
import { formatCmsItem } from '@/utils/helpers';
</script>

<template>
  <button
    type="button"
    class="w-full text-left p-3 flex gap-3 items-start border-b border-crisiscleanup-grey-100 last:border-b-0 hover:bg-crisiscleanup-smoke transition"
    @click="emit('click', item)"
  >
    <img
      v-if="item.thumbnail_file"
      :src="item.thumbnail_file.blog_url"
      class="w-16 h-16 flex-none rounded bg-crisiscleanup-smoke object-cover"
      alt=""
    />
    <div
      v-else
      class="w-16 h-16 flex-none rounded bg-crisiscleanup-smoke grid place-items-center"
    >
      <img src="@/assets/cc-logo.svg" class="w-10 h-10" alt="Crisis Cleanup" />
    </div>
    <div class="flex-1 min-w-0 flex flex-col gap-1">
      <div
        class="text-[13px] font-semibold leading-snug line-clamp-1 text-black"
        v-html="$t(formatCmsItem(item.title))"
      />
      <p
        class="text-[12px] leading-snug text-crisiscleanup-grey-900 line-clamp-2"
        v-html="$t(formatCmsItem(item.content))"
      />
    </div>
  </button>
</template>
```

Use in both tabs:

```vue
<tab :name="$t('phoneDashboard.news')" data-testid="testPhoneNewsDiv">
  <PaneError v-if="errors.news" :title="$t('phoneDashboard.news_error')">
    <template #action><base-button variant="outline" size="small" :action="getNews">{{ $t('actions.retry') }}</base-button></template>
  </PaneError>
  <ul v-else-if="news.length">
    <li v-for="item in news" :key="item.id">
      <CmsListItem :item="item" @click="showDetails" />
    </li>
  </ul>
  <PaneEmpty v-else-if="loaded" :title="$t('phoneDashboard.news_empty')" />
  <div v-else class="p-3 flex flex-col gap-2">
    <PaneSkeleton v-for="i in 6" :key="i" variant="row" />
  </div>
</tab>

<tab :name="$t('phoneDashboard.user_guide')">
  <!-- same shape with userGuides -->
</tab>
```

### 2. Parallelize the fetch

```diff
 async function getNews() {
+  errors.value = { news: false, userGuide: false };
   try {
-    if (userStates.value?.[props.stateKey]) {
-      const response = await axios.get(`…unread…`);
-      unreadCount.value = response.data.count;
-      emit('unreadCount', response.data.count);
-    }
-    const response = await axios.get(`…news…`);
-    news.value = response.data.results;
-    const userGuideResponse = await axios.get(`…user-guide…`);
-    userGuides.value = userGuideResponse.data.results;
+    const unreadPromise = userStates.value?.[props.stateKey]
+      ? axios.get(`…unread…`).then((r) => {
+          unreadCount.value = r.data.count;
+          emit('unreadCount', r.data.count);
+        })
+      : Promise.resolve();
+    const newsPromise = axios.get(`…news…`).then((r) => {
+      news.value = r.data.results;
+    }).catch(() => { errors.value.news = true; });
+    const userGuidePromise = axios.get(`…user-guide…`).then((r) => {
+      userGuides.value = r.data.results;
+    }).catch(() => { errors.value.userGuide = true; });
+    await Promise.all([unreadPromise, newsPromise, userGuidePromise]);
+    loaded.value = true;
   } catch (error) {
     console.error(error);
   }
 }
```

Per-stream errors don't cross-contaminate — news fetching can
succeed while user-guide fails, and the tabs surface that state
independently.

### 3. New i18n keys

| Key | English copy |
|---|---|
| `phoneDashboard.news_empty` | "No news yet" |
| `phoneDashboard.news_error` | "Couldn't load news" |
| `phoneDashboard.user_guide_empty` | "No user-guide entries yet" |
| `phoneDashboard.user_guide_error` | "Couldn't load the user guide" |

## Reuse

- Spec 19: `PaneEmpty`, `PaneError`, `PaneSkeleton`.
- `<tabs>` / `<tab>` globally registered components — unchanged.
- `CmsViewer`, `useDialogs`, `formatCmsItem` — unchanged.
- `cc-logo.svg` asset — unchanged.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `pnpm dev`:
  - Both tabs load in parallel — News arrives before User Guide in
    most cases (network-dependent), but the skeletons are
    tab-independent.
  - Click an item → modal opens with full content.
  - Force `/cms?tags=phone-news` to 500: News tab shows PaneError;
    User Guide tab still renders.
  - Thumbnail fallback: items without `thumbnail_file` show the
    centered `cc-logo` glyph on a smoke square.

## Out of scope

- **Merging with `PhoneCmsItems`.** The two components share 80%
  of their logic; a deduplication refactor belongs to a later
  cleanup spec.
- **Marking items as read on click.** Current behaviour is "unread
  count updates on next fetch based on `news_last_seen`." Not in
  scope.
- **Infinite scroll / pagination.** 10-item cap is product.
- **Rich search / filtering across tabs.** Not a product ask.

## Risks / rollback

- **Risk — parallel fetch failure states.** If one of the three
  requests hangs, `Promise.all` resolves only when all settle;
  swap to `Promise.allSettled` if needed. The spec uses per-request
  `.catch` so each failure flags its own error — no hang propagation.
- **Risk — `CmsListItem` local extraction.** If this codebase
  prefers a separate `.vue` file for even tiny reusables, extract
  to `src/components/phone/CmsListItem.vue`.
- **Risk — `v-html` XSS.** Current markup already `v-html`s the CMS
  title/body. Unchanged by this spec.
- **Rollback.** Revert one file (or two if `CmsListItem` was
  extracted).
