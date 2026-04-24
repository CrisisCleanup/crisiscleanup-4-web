# 31 — PhoneCmsItems refresh

## Intent

`PhoneCmsItems.vue` is a ~100-line wrapper that fetches the last 10
CMS posts tagged `phone-news` and hands them to `BlogPosts` for
rendering. Every 5 minutes (`setInterval(getNews, 300_000)`) it also
polls a "new-since-last-seen" count and emits `unreadCount` — that's
the badge on the PhoneOverlay's CMS tab per spec 18.

The component is functionally fine. The issues are:

1. **No pane card** — it renders bare inside the overlay tab.
   Inconsistent with specs 25, 26, 28, 29.
2. **No header** — `BlogPosts` presumably owns its own internal
   header, but the overlay tab has no "News" micro-label and no
   "N unread" indicator co-located with the content.
3. **`max-h-168`** is a non-standard arbitrary height with no
   breakpoints — at 390 px it overflows the overlay sheet.
4. **`BlogPosts` styling** is not in scope per the spec 18
   out-of-scope bullet ("Phone content panes … individual panes
   are follow-ups") — but the *wrapper* can still carry pane-card
   chrome.

## Before / After

| Concern | Current | Target |
|---|---|---|
| Outer | `<BlogPosts :cms-items="news" class="max-h-168" />` bare | `<section class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3 min-w-0">` containing header + BlogPosts |
| Header | None | `<header>` with 12 px uppercase "News" label + unread count pill on the right (`<BasePill variant="primary" v-if="unreadCount">{{ unreadCount }}</BasePill>`) |
| Empty state | Relies on `BlogPosts` internal empty | Wrap: `v-if="news.length" <BlogPosts /> v-else <PaneEmpty>` |
| Error state | Try/catch swallows into `console.error` (silent fail) | Expose an error ref; render `PaneError` when the fetch throws; retry via `getNews()` |
| Height cap | `max-h-168` arbitrary | Let the overlay tab own scroll (spec 18's overlay already has an internal overflow). Drop the inline cap |
| Polling cleanup | `onBeforeUnmount` clears the interval already | Unchanged |

## Files to touch

- **EDIT:** `src/components/phone/PhoneCmsItems.vue` — template wrapping + error ref + PaneEmpty integration.
- **NO changes** to `BlogPosts.vue`, `CmsViewer.vue`, `useDialogs`.

## Implementation

```vue
<template>
  <section
    class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3 min-w-0"
    data-testid="testPhoneCmsItems"
  >
    <header class="flex items-center justify-between">
      <h2 class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
        {{ $t('phoneDashboard.news') }}
      </h2>
      <BasePill v-if="unreadCount > 0" variant="primary">
        {{ unreadCount }}
      </BasePill>
    </header>

    <PaneError
      v-if="loadError"
      :title="$t('phoneDashboard.news_error')"
    >
      <template #action>
        <base-button variant="outline" size="small" :action="getNews">
          {{ $t('actions.retry') }}
        </base-button>
      </template>
    </PaneError>

    <BlogPosts
      v-else-if="news.length"
      :cms-items="news"
      @on-click="showDetails"
    />

    <PaneEmpty
      v-else-if="loaded"
      :title="$t('phoneDashboard.news_empty')"
      :description="$t('phoneDashboard.news_empty_hint')"
    />

    <PaneSkeleton v-else variant="block" />
  </section>
</template>
```

```ts
const loaded = ref(false);
const loadError = ref(false);

async function getNews() {
  loadError.value = false;
  try {
    // existing unread + main fetch logic
    loaded.value = true;
  } catch (error) {
    console.error(error);
    loadError.value = true;
  }
}
```

### New i18n keys

| Key | English copy |
|---|---|
| `phoneDashboard.news_error` | "Couldn't load news" |
| `phoneDashboard.news_empty` | "No news to show" |
| `phoneDashboard.news_empty_hint` | "Announcements from the Crisis Cleanup team will appear here." |

## Reuse

- Spec 19: `PaneEmpty`, `PaneError`, `PaneSkeleton`.
- Spec 06: `BasePill`.
- `BlogPosts`, `CmsViewer`, `useDialogs`, `useCurrentUser` — unchanged.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `pnpm dev`:
  - Fresh user with no `news_last_seen`: unread pill doesn't render
    (server returns 0); content loads.
  - Force a 500 on `/cms?tags=phone-news` via DevTools: `PaneError`
    renders with retry.
  - Navigate away, back, then wait 5 min → poll re-runs on a fresh
    mount (each tab reopen does one `getNews` on mount plus the
    5 min interval).
- Mobile: no inline height cap; the overlay sheet's own overflow
  handles long content.

## Out of scope

- `BlogPosts` internal styling (separate component; its own refresh
  track if needed).
- `CmsViewer` modal styling (same).
- Read-receipt UX (marking an item as seen on click). Product hasn't
  asked.
- Pagination / "view all." The 10-item cap is a product decision.

## Risks / rollback

- **Risk — `loaded` vs. `loadError`.** Initial render shows a
  skeleton; first `getNews` either sets `loaded` or `loadError`.
  Ensure they're mutually exclusive — the template's `v-if/v-else-if`
  chain handles that.
- **Risk — double-fetch on mount.** Current code runs `getNews` in
  `onMounted` *and* starts an interval in `onBeforeMount`. Don't add
  a third call; the existing pair is fine.
- **Rollback.** Revert one file.
