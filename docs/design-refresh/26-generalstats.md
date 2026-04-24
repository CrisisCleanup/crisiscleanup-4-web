# 26 — GeneralStats refresh

## Intent

`GeneralStats.vue` is the **queue-and-volume** overlay tab. It shows
"total people waiting" as a giant number, remaining callbacks +
calldowns + agent online/available as four smaller cards, and opens
a modal with a full `AjaxTable` of remaining outbounds when the
volunteer clicks "view all."

Two distinct surfaces in one file:

1. **The summary view** — 2×2 grid + a hero tile. Every tile is
   `bg-white rounded shadow border` (two-layer elevation, border +
   shadow), headings are inconsistent (`base-text class="text-sm
   font-medium"` in some tiles, plain `$t(...)` in another), and
   the hero tile is a `p-10` 5xl-font number on a separate card.
   Nothing ties them into a cohesive stats pane.

2. **The outbounds-modal view** — toggled by `showingOutboundsModal`,
   renders inline (not a true modal) with its own `AjaxTable`,
   filter button, filter count badge (`rounded-full mx-1 px-1
   bg-yellow-500 text-xs` — a bespoke inline badge that pre-dates
   `BasePill`), and a "back" button. The filter button has a custom
   `ccu-icon="filters"` prop that doesn't match `BaseButton`'s
   spec-04 API.

Also: the commented-out `statsPerQueue` block (lines 122-134) is
dead code. Remove it in this spec.

## Before / After

### Summary view

| Concern | Current | Target |
|---|---|---|
| Outer layout | `<div class="flex flex-col items-center max-w-2xl">` — centered column, caps width at ~42 rem | `<section class="w-full flex flex-col gap-4">` — full width of the pane column; children carry their own cards |
| Hero tile | `flex flex-col gap-3 items-center justify-center shadow border rounded w-full p-10` with `text-5xl font-light` number | Pane card recipe: `bg-white rounded border border-crisiscleanup-grey-100 p-6 flex flex-col items-center gap-2`; label is 12 px uppercase, number is `text-4xl font-semibold tabular-nums` |
| 4-tile grid | `grid grid-cols-2 gap-4 w-full mt-4` | `grid grid-cols-2 md:grid-cols-4 gap-4` — 4-up on desktop, 2-up on mobile |
| Tile card | `bg-white p-4 rounded shadow border` (border + shadow — remove border) | `bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-1` |
| Tile heading | `base-text class="text-sm font-medium"` | 12 px uppercase letter-spaced micro-label |
| Tile number | `text-lg` / `text-2xl` (inconsistent) | `text-2xl font-semibold tabular-nums` — consistent across all four |
| "View all" link | `base-button type="link" class="underline text-sm font-semibold"` | `base-button variant="text" size="small"` — spec 04 already owns the link affordance; drop the underline class |

### Outbounds-modal view

| Concern | Current | Target |
|---|---|---|
| Container | `bg-white shadow p-6 rounded h-5/6` — a separate "modal" that's actually an inline panel | Real `Modal` component (`src/components/Modal.vue` — globally registered per `src/main.ts`). Open via `v-model`, not a local ref + conditional `v-if`. |
| Title | `<h2 class="text-xl font-semibold">` | 16 px h2 per tracker type scale |
| Filter button | `base-button ccu-icon="filters" icon-size="md"` + inline yellow count badge | `base-button variant="outline" size="small"` with `<BasePill variant="primary">` for the count; drop `ccu-icon` prop and use the standard icon slot |
| Filter count pill | `<span class="rounded-full mx-1 px-1 bg-yellow-500 text-xs">{{ n }}</span>` | `<BasePill variant="primary">{{ n }}</BasePill>` |
| Table | `AjaxTable` with a phone_number slot | Same, but with `PaneEmpty` in the `empty` slot |
| Back button | `base-button text="back" icon="arrow-left"` | Same, but per spec 04 `variant="text"` |

### Shared

| Concern | Current | Target |
|---|---|---|
| Dead code | Commented-out `statsPerQueue` block (`GeneralStats.vue:122-134`) | Delete |
| `setInterval(updateCallbacks, 60_000)` polling | Runs every 60 s forever | Keep, but ensure it's cleared on unmount (`onBeforeUnmount(() => clearInterval(handle))`) — current code leaks the interval |
| WebSocket cleanup | `socket.value = s`, never closed | Add `onBeforeUnmount(() => socket.value?.close?.())` |

## Files to touch

- **EDIT:** `src/components/phone/GeneralStats.vue` — substantial template rewrite, polling cleanup, dead code removal.
- **EDIT (tests):** update any unit tests that assert the old tile count / label casing.
- **NO changes** to `PhoneOutboundFilters.vue` or the `/phone_outbound` query semantics.

## Implementation

### 1. Summary view template

```vue
<template>
  <section v-if="!showingOutboundsModal" class="w-full flex flex-col gap-4">
    <article
      class="bg-white rounded border border-crisiscleanup-grey-100 p-6 flex flex-col items-center gap-2"
      data-testid="testTotalPeopleWaitingTile"
    >
      <p class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
        {{ $t('phoneDashboard.total_people_waiting') }}
      </p>
      <p class="text-4xl font-semibold tabular-nums text-black">
        {{ allUsersInQueue }}
      </p>
    </article>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatTile
        :label="$t('phoneDashboard.remaining_callbacks')"
        :value="remainingCallbacks"
        action-testid="testShowOutboundsModalButton_callbacks"
        @action="() => showOutboundsModal('callback')"
      />
      <StatTile
        :label="$t('phoneDashboard.remaining_calldowns')"
        :value="remainingCalldowns"
        action-testid="testShowOutboundsModalButton_calldowns"
        @action="() => showOutboundsModal('calldown')"
      />
      <StatTile
        :label="$t('phoneDashboard.agents_online')"
        :value="agentsOnline"
      />
      <StatTile
        :label="$t('phoneDashboard.agents_available')"
        :value="agentsAvailable"
      />
    </div>
  </section>
  <OutboundsModalPanel
    v-else
    …
  />
</template>
```

Extract the inline tile markup into a **local** `StatTile`
component (defined in the same SFC or a co-located file). Props:
`label`, `value`, optional `actionTestid`. Emit: `action` if the
tile has a "view all" link. Two lines of markup per tile; the
`v-for` is unnecessary because the four tiles are semantically
distinct.

### 2. Outbounds-modal panel

Rather than toggling a sibling `v-else` branch inside
`GeneralStats`, move the modal-body into its own component:
`src/components/phone/OutboundsModalPanel.vue`. Render it via the
globally-registered `<Modal>`:

```vue
<Modal
  v-if="showingOutboundsModal"
  :title="$t('phoneDashboard.remaining_outbounds')"
  @close="showingOutboundsModal = false"
>
  <!-- filter button + AjaxTable + filters drawer -->
</Modal>
```

Keep the filter-drawer behaviour; migrate the inline yellow badge to
`<BasePill variant="primary">{{ filterCount }}</BasePill>`.

If `Modal.vue`'s API doesn't support a custom close-on-back button
in the header, embed the back-button inside the `title` slot per
its existing slot shape. Grep `Modal.vue` first to confirm.

### 3. Polling / websocket cleanup

```diff
 onBeforeMount(() => {
-  setInterval(() => {
+  pollingHandle.value = setInterval(() => {
     updateCallbacks();
   }, 60_000);
   const { socket: s } = useWebSockets(…);
   socket.value = s;
 });
+onBeforeUnmount(() => {
+  if (pollingHandle.value) clearInterval(pollingHandle.value);
+  socket.value?.close?.();
+});
```

### 4. Dead code

Delete `GeneralStats.vue:122-134` — the commented-out `statsPerQueue`
block. Also delete the `statsPerQueue` and `availableQueues`
computed / consts if they're not read anywhere post-delete
(verified by grepping `statsPerQueue` after the template change).

## Reuse

- `Modal` (globally registered), `AjaxTable`, `BaseButton`, `BasePill`, `LanguageTag`, `PhoneOutboundFilters`.
- Spec 19 primitives: `PaneEmpty` (empty slot in outbounds table).
- Tokens: `crisiscleanup-grey-100` (card border), `crisiscleanup-grey-900`, `primary`.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `pnpm dev` on a staging incident with known queue activity:
  - Hero tile shows total-people-waiting; number is tabular (doesn't jitter when it ticks).
  - Four tiles below; each tile's number is the same visual weight.
  - "View all" → Modal opens; filter button has a pill with the count; empty state renders `PaneEmpty` if the filter returns zero rows.
  - Unmount the component (navigate away from `/phone`) → poll stops (verify by watching the Network tab; no `/phone_outbound?completion__lt=1…` requests after 60 s of being off the page).
- WebSocket closed on unmount (check DevTools' WS tab; connection state transitions to CLOSED).

## Out of scope

- **`Modal` API changes.** If the existing `Modal` component can't host the title + back-button pattern, keep the inline panel and only refresh its internal styling. Modal refactor is its own spec.
- **Adding per-queue stats back (the commented-out block).** If product wants per-queue visibility, a separate spec; don't revive a commented block without a product decision.
- **Changing the 60 s poll interval.** The cadence is a product decision.
- **Pagination of the outbounds table.** Already handled by `AjaxTable`'s internal paging.
- **Search on the outbounds table.** Not currently enabled; out of scope.

## Risks / rollback

- **Risk — `Modal` component global registration variance.** `Modal.vue` may or may not support the slot shape we assume. Grep the file; fall back to the inline-panel approach with the pane-card recipe if `Modal` is too constrained. Document the fallback if taken.
- **Risk — polling cleanup regression.** Adding `clearInterval` is uncontroversial, but if `onBeforeMount` ran twice (unlikely in a standard SFC), the earlier interval leaks. Use `onBeforeUnmount` paired 1:1 with the ref — don't rely on closure capture.
- **Risk — `StatTile` local extraction.** Small inline components co-located in the same SFC aren't a strong pattern in this codebase — grep `defineComponent({ name: .*, setup` inside Vue files to confirm. If the codebase prefers separate files, add `src/components/phone/StatTile.vue` instead.
- **Rollback.** Revert `GeneralStats.vue`. If `OutboundsModalPanel.vue` was extracted as a new file, delete it.
