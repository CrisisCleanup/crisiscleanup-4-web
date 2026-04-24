# 25 — CallHistory refresh

## Intent

`CallHistory.vue` is the "last N calls" list the volunteer sees in
the overlay tab. Today it's a `TitledCard` wrapping an `AgentStats`
strip at the top plus an `AjaxTable` below, with three custom
cell slots (incident glyph, phone-number + icon, started-at + inbound
indicator) and one status-text slot that i18n-resolves via string
concatenation.

Two issues:

1. **`TitledCard` is a legacy card wrapper** — it hasn't been touched
   by any refresh spec yet; its shadow / padding conventions are
   out of sync with spec 19's pane-card recipe (bordered white card
   on smoke page, no drop shadow).
2. **`AgentStats` is a stub** embedded inside `CallHistory` — it's
   just four inline "label: value" pairs in a flex row with no
   borders, no grouping, no card. Spec 27 covers that file in
   isolation; here we just need to mount it cleanly.

This spec refreshes the pane wrapper, stops using `TitledCard`,
adopts the pane-card recipe from spec 19, and wires two new states
the pane is missing today: **empty** (the current user has made zero
calls on this incident) and **error** (the `AjaxTable` fetch failed).

## Before / After

| Concern | Current | Target |
|---|---|---|
| Outer wrapper | `<TitledCard :title="Last 10 calls">` | `<section class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3">` with 12 px uppercase micro-label header |
| Inner layout | `card-container overflow-auto h-full` with `AgentStats` + `AjaxTable` stacked | Same stack; outer wrapper already scrolls via the overlay container — drop the inner `overflow-auto` |
| `AgentStats` mount | Directly inside the card, no separation | Same position, rendered at the top of the pane with a 1 px bottom divider (`pb-3 border-b border-crisiscleanup-grey-100`) |
| Empty state | `AjaxTable`'s internal empty renders (unverified styling, likely just "No data") | `PaneEmpty` slot when `items.length === 0`. Title "No recent calls"; description "Your last 10 calls will appear here once you start taking calls." |
| Error state | Toast from the axios interceptor (implicit) | `PaneError` rendered inside the pane card when the fetch rejects, with a `<base-button>` retry action in the `action` slot |
| `incident` cell | Disaster icon + on-mobile a start-cased text fallback | Unchanged visually — already minimal |
| `phone_number` cell | `ccu-icon phone-classic` + formatted number | Keep; replace `ccu-icon` glyph with a Lucide `phone` (consistent with spec 18's Lucide exception for phone-nav tabs) — only if Lucide is already imported for another reason. Otherwise keep `ccu-icon` |
| `created_at` cell | `momentFromNow(…)` + `BasilPhoneInOutline` / `BasilPhoneOutOutline` inline icons | Keep; Basil icons already match the icon weight |
| `status_text` cell | Raw `$t('phoneStatus.' + slug)` | Wrap in a small `<BasePill variant="completed">` when status is a completion, `<BasePill variant="dark">` otherwise — clearer at-a-glance read |
| Scoped `<style>` | `.cell { color: crisiscleanup-dark-300 }` + `.svg-container svg { 26×26 }` | Remove `.cell` (unused here). Keep `.svg-container` only if an inner child actually uses it (grep) |

## Files to touch

- **EDIT:** `src/components/phone/CallHistory.vue` — outer swap + new states + status pill.
- **NO changes** to `AjaxTable.vue` unless its empty/error slot API doesn't support pass-through (grep `slot=\"empty\"` / `slot=\"error\"` in `AjaxTable.vue` and confirm; if missing, wrap the table in a v-if/v-else chain against the `items.length` ref it already exposes).
- **EDIT (tests):** update any `TitledCard`-class assertion in `test/unit/components/phone/CallHistory.test.ts` if present.

## Implementation

### 1. Template

```vue
<template>
  <section
    class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3 min-w-0"
    data-testid="testCallHistory"
  >
    <header class="flex items-center justify-between">
      <h2 class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
        {{ $t('phoneDashboard.last_10_calls') }}
      </h2>
    </header>

    <AgentStats class="pb-3 border-b border-crisiscleanup-grey-100" />

    <PaneError
      v-if="loadError"
      :title="$t('phoneDashboard.call_history_error')"
      :description="$t('phoneDashboard.call_history_error_hint')"
    >
      <template #action>
        <base-button variant="outline" size="small" :action="reload">
          {{ $t('actions.retry') }}
        </base-button>
      </template>
    </PaneError>

    <AjaxTable
      v-else
      ref="tableRef"
      :url="callHistoryUrl"
      :columns="historyCols"
      enable-search
      :query="{ sort: '-created_at', user: currentUser.id }"
      data-testid="testAgentHistoryTable"
      @row-click="(item) => $mq === 'sm' && $emit('rowClick', item)"
      @update:items="onItemsUpdate"
      @error="onTableError"
    >
      <template #empty>
        <PaneEmpty
          :title="$t('phoneDashboard.no_recent_calls')"
          :description="$t('phoneDashboard.no_recent_calls_hint')"
        />
      </template>
      <template #incident="{ item }">…</template>          <!-- unchanged -->
      <template #phone_number="{ item }">…</template>     <!-- unchanged -->
      <template #created_at="slotProps">…</template>      <!-- unchanged -->
      <template #status_text="slotProps">
        <BasePill
          v-if="slotProps.item.status_text"
          :variant="statusVariant(slotProps.item.status_text)"
        >
          {{ $t(`phoneStatus.${slotProps.item.status_text}`) }}
        </BasePill>
      </template>
    </AjaxTable>
  </section>
</template>
```

### 2. Script additions

```ts
import PaneEmpty from '@/components/phone/foundation/PaneEmpty.vue';
import PaneError from '@/components/phone/foundation/PaneError.vue';
import BasePill from '@/components/BasePill.vue';

const loadError = ref(false);
const tableRef = ref<InstanceType<typeof AjaxTable> | null>(null);

function onItemsUpdate() {
  loadError.value = false;
}
function onTableError() {
  loadError.value = true;
}
function reload() {
  loadError.value = false;
  tableRef.value?.refresh?.();
}

function statusVariant(slug: string) {
  if (slug.startsWith('answered_')) return 'completed';
  if (slug.startsWith('no-answer_')) return 'urgent';
  return 'dark';
}
```

The `@update:items` and `@error` events on `AjaxTable` — if they
don't exist, wrap the fetch in a `try/catch` by binding to the
underlying `useAxios` hook that `AjaxTable` uses. Grep
`AjaxTable.vue` first; if you have to add the events, keep the
change surgical (two emits, nothing else).

### 3. New i18n keys

| Key | English copy |
|---|---|
| `phoneDashboard.no_recent_calls` | "No recent calls" |
| `phoneDashboard.no_recent_calls_hint` | "Your last 10 calls will appear here once you start taking calls." |
| `phoneDashboard.call_history_error` | "Couldn't load call history" |
| `phoneDashboard.call_history_error_hint` | "Check your connection and retry. Other phone surfaces still work." |

### 4. Testids

Preserved: `testAgentHistoryTable`, `testIncidentdiv`,
`testPhoneClassicicon`, `testShowOutboundsModalButton` (if any — grep).

New: `testCallHistory`, `testCallHistoryEmpty`, `testCallHistoryError`.

## Reuse

- Spec 19 primitives: `PaneEmpty`, `PaneError`.
- Spec 06 `BasePill` for status tagging.
- `AjaxTable` (global component) — unchanged; only its slots consumed.
- `AgentStats` — unchanged (spec 27 refreshes it independently).
- `DisasterIcon`, `BasilPhoneInOutline`, `BasilPhoneOutOutline` — unchanged.
- Tokens: `crisiscleanup-grey-100` (card border), `crisiscleanup-grey-900`. Zero new.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` — clean.
- `pnpm dev`:
  - Open Call history tab with a new user (zero calls) → `PaneEmpty` renders.
  - Disable the network (DevTools offline mode) and click Retry → `PaneError` persists with button enabled; re-enable network, click Retry → table re-renders.
  - Normal flow: 10 rows, each status shows as a pill; answered → `completed` (grey), no-answer → `urgent` (red), skipped/other → `dark` (black).
- 390 px: single-column table with row-click → `rowClick` emit.

## Out of scope

- `TitledCard.vue` deletion. The component might have other consumers; a cleanup pass belongs to a separate audit.
- `AjaxTable` refactor. Events may need to be added (two tiny emits); broader refactor is out.
- `AgentStats` internals — spec 27.
- Pagination / "view all calls". The current 10-call cap is product-intended.

## Risks / rollback

- **Risk — `AjaxTable` doesn't emit `update:items` or `error`.** Most likely; add two `emits` if missing. If `AjaxTable` swallows errors entirely, fall back to the existing axios response interceptor's toast and drop the in-pane `PaneError` — explicitly documented in the spec so the PR can stay scoped.
- **Risk — status-variant misclassification.** The `phoneStatus.*` slug taxonomy is larger than "answered_*" / "no-answer_*" / "skipped_*" — there's `either_bad-number` and ad-hoc entries. Fall back to `variant="dark"` for any unknown slug (already the default in `statusVariant`). QA the 15 slugs individually.
- **Rollback.** Revert `CallHistory.vue`. No shared component / hook / model changes.
