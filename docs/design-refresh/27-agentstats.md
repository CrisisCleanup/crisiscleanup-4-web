# 27 — AgentStats refresh

## Intent

`AgentStats.vue` is 60 lines that render four "label: value" pairs
in a flex row — inbound count, outbound count, total login time,
total call time. It's embedded at the top of `CallHistory.vue` and
stands alone in the overlay (no card wrapper of its own). The
current implementation:

- Uses `text-sm` labels with `opacity-40` numbers beside them — the
  opacity trick is a poor accessibility signal and doesn't match
  any other stat display in the app.
- Has no grouping — label and number sit inline with a space
  separator (`{{ label }} <div>{{ value }}</div>`), which reads as
  a single run-on line.
- Pulls `agentStats` off `useConnectFirst` but doesn't guard
  against `agentStats` being `undefined` in early renders (today
  the template emits `NaN - undefined` transiently).

This spec makes `AgentStats` into a small, standalone stat strip
that reads cleanly whether mounted inside `CallHistory` (spec 25)
or alone in the overlay.

## Before / After

| Concern | Current | Target |
|---|---|---|
| Outer | `<div class="flex flex-col"><div><div class="flex">…` — three nested divs doing nothing | `<div class="flex flex-wrap gap-4">` |
| Stat item | `<div class="flex p-2 items-center text-sm">{{ label }}<div class="opacity-40 ml-1">{{ value }}</div></div>` | `<div class="flex flex-col min-w-[100px]"><span class="text-[11px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">{{ label }}</span><span class="text-[15px] font-semibold tabular-nums text-black">{{ value }}</span></div>` |
| Inbound count fallback | `agentStats.totalCallsHandled - agentStats.totalManualDials \|\| 0` — unsafe when either operand is undefined | `Math.max(0, (agentStats?.totalCallsHandled ?? 0) - (agentStats?.totalManualDials ?? 0))` |
| Outbound count | `agentStats.totalManualDials \|\| 0` | `agentStats?.totalManualDials ?? 0` |
| Login time | `formatSeconds(agentStats.totalLoginTime \|\| 0)` | `formatSeconds(agentStats?.totalLoginTime ?? 0)` |
| Call time | `formatSeconds(agentStats.totalTalkTime \|\| 0)` | `formatSeconds(agentStats?.totalTalkTime ?? 0)` |
| Render guard | None; renders `NaN` briefly when `agentStats` is undefined | `v-if="agentStats"` wraps the whole block, falling back to a 4-item `PaneSkeleton variant="line"` row while loading |

## Files to touch

- **EDIT:** `src/components/phone/AgentStats.vue`.
- **NO other changes.** The consumer (`CallHistory.vue` per spec 25) mounts it as `<AgentStats class="pb-3 border-b …" />`; no API change.

## Implementation

```vue
<template>
  <div v-if="agentStats" class="flex flex-wrap gap-x-6 gap-y-2">
    <Stat :label="$t('phoneDashboard.inbound_count')" :value="inboundCount" testid="testInboundCountDiv" />
    <Stat :label="$t('phoneDashboard.outbound_count')" :value="outboundCount" testid="testOutboundCountDiv" />
    <Stat :label="$t('phoneDashboard.total_login_time')" :value="loginTime" testid="testTotalLoginTimeDiv" />
    <Stat :label="$t('phoneDashboard.total_call_time')" :value="talkTime" testid="testTotalCallTimeDiv" />
  </div>
  <div v-else class="flex flex-wrap gap-x-6 gap-y-2">
    <PaneSkeleton v-for="i in 4" :key="i" variant="line" width="1/3" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue';
import useConnectFirst from '@/hooks/useConnectFirst';
import { formatSeconds } from '@/filters';
import PaneSkeleton from '@/components/phone/foundation/PaneSkeleton.vue';

const { agentStats } = useConnectFirst();

const inboundCount = computed(() =>
  Math.max(0, (agentStats.value?.totalCallsHandled ?? 0) - (agentStats.value?.totalManualDials ?? 0)),
);
const outboundCount = computed(() => agentStats.value?.totalManualDials ?? 0);
const loginTime = computed(() => formatSeconds(agentStats.value?.totalLoginTime ?? 0));
const talkTime = computed(() => formatSeconds(agentStats.value?.totalTalkTime ?? 0));

const Stat = defineComponent({
  props: { label: String, value: [String, Number], testid: String },
  setup: (p) =>
    () =>
      h('div', { class: 'flex flex-col min-w-[100px]', 'data-testid': p.testid }, [
        h(
          'span',
          {
            class: 'text-[11px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900',
          },
          p.label,
        ),
        h(
          'span',
          { class: 'text-[15px] font-semibold tabular-nums text-black' },
          p.value,
        ),
      ]),
});
</script>
```

If inline `Stat` via `defineComponent` + `h()` is awkward for the
codebase convention, extract it as `src/components/phone/Stat.vue`
instead — same props, same markup. The JS function form keeps
`AgentStats.vue` self-contained, which is the original design
intent of the file.

## Reuse

- Spec 19 `PaneSkeleton` for the loading fallback.
- `useConnectFirst`, `formatSeconds`, `vue-i18n` — unchanged.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `pnpm dev`: stats display with clearly separated labels (uppercase) above numbers (tabular). Numbers don't flash `NaN` on cold mount — either skeleton or value, never undefined arithmetic.
- Resize the viewport: flex-wrap lets two pairs wrap to a second row cleanly at 640 px.

## Out of scope

- The underlying `agentStats` data source (`useConnectFirst`).
- Per-day breakdowns or historical stats.
- Any new stat (e.g. "calls answered today") — product decision.
- Polling. `agentStats` is live via the same websocket as `GeneralStats`.

## Risks / rollback

- **Risk — inline `Stat` component.** If code review prefers an explicit file, extract to `Stat.vue`. Functionally identical.
- **Risk — `Math.max` clamp.** `totalCallsHandled - totalManualDials` can legitimately be negative if the websocket delivers fields out of order. Clamping to 0 is correct for display but masks a data bug; if product wants to investigate, add a `console.debug` behind `import.meta.env.DEV`.
- **Rollback.** Revert the single file.
