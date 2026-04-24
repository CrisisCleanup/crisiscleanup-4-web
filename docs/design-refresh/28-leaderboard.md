# 28 — Leaderboard refresh

## Intent

`Leaderboard.vue` ranks volunteer agents by calls-handled across
three resolutions (today / this week / all time). The list item
carries a lot: avatar, name (with tooltip), organization,
live-state chip (away/online/offline/connecting/talking), last-seen
relative time, language tags, and a 3-column numeric grid
(inbound / outbound / total).

Layout issues:

1. The 3-column numeric grid renders **both** a row of static text
   labels ("Inbound" / "Outbound" / "Total") *and* a row of the
   numbers immediately below — **per row** of the leaderboard. Eleven
   agents → eleven copies of the same header row. Labels should
   live once at the top.
2. Live-state chip is bespoke: `&#8226; {{ rank.state[0] }}` with a
   colour class (`text-red-500` / `text-green-300` / `text-dark-blue`
   / `text-yellow-500` / `text-crisiscleanup-teal`). Five different
   colour tokens, one glyph character, no structure. `BasePill` is
   the right fit.
3. Pagination buttons are 24×24 (`w-6 h-6`) `<base-button>`s with
   `bg-crisiscleanup-light-smoke` and `variant="solid"` — the spec-04
   button variants don't produce that look; these are hand-overridden.
4. The header has a dropdown taking `w-44` — fine — but the whole
   surface uses `<base-text variant="h3">` liberally for labels that
   should be micro-labels.
5. `TitledCard` is absent but the component carries
   `shadow-crisiscleanup-card` directly on the root. Per spec 19's
   updated recipe (bordered pane cards on smoke), swap this to the
   standard border treatment so the leaderboard reads as a peer of
   the other phone panes rather than a single-elevated outlier.

## Before / After

### Header

| Concern | Current | Target |
|---|---|---|
| Outer | `shadow-crisiscleanup-card card` | `bg-white rounded border border-crisiscleanup-grey-100 flex flex-col min-w-0` |
| Header row | `flex justify-between items-center py-4 px-6 border-b border-opacity-20 border-gray-400` | `flex items-center justify-between h-12 px-4 border-b border-crisiscleanup-grey-100` |
| Title | `<base-text variant="h3" bold>` | `<h2 class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">` |
| Resolution dropdown | `w-44` `<base-select>` rendering selected option as h3 | `w-40` `<base-select>` rendering selected option as 13 px; drop the custom selected-option slot (spec 11's refreshed BaseSelect already handles this) |

### Column labels

| Concern | Current | Target |
|---|---|---|
| Placement | Repeated inside *every* rank item (duplicated 11× on a full page) | Rendered **once** in a fixed header strip below the title row |
| Styling | `<div>{{ $t('phoneDashboard.inbound') }}</div>` | 11 px uppercase letter-spaced text, right-aligned |

### List item

| Concern | Current | Target |
|---|---|---|
| Row | `flex items-center justify-between p-2` | `flex items-center justify-between gap-3 h-14 px-4 border-b border-crisiscleanup-grey-100 last:border-b-0 hover:bg-crisiscleanup-smoke transition` |
| Avatar | Left column, `size="xsmall"` + `inner-classes="shadow"` | Same size; remove the shadow (avatars are flat in the kit) |
| Name + tooltip | h3 text size via tooltip prop | 13 px semibold; tooltip unchanged |
| Language tags | `<LanguageTag class="text-bodyxsm">` per tag | Inline `<BasePill variant="incident">` per tag (same substitution spec 24 documents for Agent); 10 px uppercase language code |
| Organization | `base-text variant="h4" regular` | 12 px body; same line-height |
| Live state | bullet (`&#8226;`) + label with color class (5 hand-picked colours) | `<BasePill>` with the variant mapped: AWAY → `urgent`, AVAILABLE → `open`, OFFLINE → `dark`, TRANSITION → `claimed`, ENGAGED → `in-progress` — mapping rationale is one signal per variant family |
| State relative time | `base-text variant="h4" regular` `opacity-50` | 11 px `text-crisiscleanup-grey-900` (no opacity manipulation) |
| Numeric grid | `grid-cols-3` with a stub label row above the values per item | `grid-cols-3` with numbers only; 18 px tabular-nums bold for `total`, 13 px tabular-nums for the two splits |

### Pagination

| Concern | Current | Target |
|---|---|---|
| Buttons | `w-6 h-6` `base-button variant="solid"` + `bg-crisiscleanup-light-smoke` inline + `ccu-icon="arrow-left/right"` | 32×32 icon buttons (`w-8 h-8 grid place-items-center rounded hover:bg-crisiscleanup-smoke disabled:opacity-40 transition`) with `ccu-icon` arrow glyphs |
| Separator | `border-t` on the container | `border-t border-crisiscleanup-grey-100` (explicit token) |
| Alignment | `justify-between` | `justify-between` — unchanged |

### Empty / error / loading

| Concern | Current | Target |
|---|---|---|
| Empty | No state; renders an empty list if the API returns zero rows | `PaneEmpty` with "No ranking data yet" |
| Error | None; axios throws surface via the response interceptor | `PaneError` with retry |
| Loading | Initial paint shows no content until `loadLeaderboard` resolves | `PaneSkeleton variant="row"` ×6 while the fetch is pending |

### Live state
| Concern | Current | Target |
|---|---|---|
| Socket cleanup | `onBeforeUnmount(() => socket.value.close())` — fine | Guard with optional-chaining: `socket.value?.close?.()` (avoid throw on unmounted-before-mounted) |

## Files to touch

- **EDIT:** `src/components/phone/Leaderboard.vue` — substantial template rewrite; helper `stateVariant()` added; state-label + colour-class helper replaced.
- **NO changes** to the `/phone/leaderboard` API.

## Implementation

### 1. Local helpers

```ts
const STATE_VARIANT: Record<string, BasePillVariant> = {
  AWAY: 'urgent',
  AVAILABLE: 'open',
  OFFLINE: 'dark',
  TRANSITION: 'claimed',
  ENGAGED: 'in-progress',
};
const STATE_LABEL: Record<string, string> = {
  AWAY: 'phoneDashboard.state_away',
  AVAILABLE: 'phoneDashboard.state_online',
  OFFLINE: 'phoneDashboard.state_offline',
  TRANSITION: 'phoneDashboard.state_connecting',
  ENGAGED: 'phoneDashboard.state_talking',
};

function stateVariant(rank: { state?: [string, string] }) {
  const raw = rank.state?.[0]?.toUpperCase();
  return raw && STATE_VARIANT[raw] ? STATE_VARIANT[raw] : 'dark';
}
function stateLabel(rank: { state?: [string, string] }) {
  const raw = rank.state?.[0]?.toUpperCase();
  return raw && STATE_LABEL[raw] ? t(STATE_LABEL[raw]) : t('phoneDashboard.state_offline');
}
```

The existing `AGENT_STATES` object keeps its original role (mapping
raw state names to the tuple `[label, colorClass]`) — but we stop
using `colorClass` in the template. Instead of deleting it, leave
it as a compatibility shim; zero cost.

### 2. Template skeleton

```vue
<template>
  <section
    class="bg-white rounded border border-crisiscleanup-grey-100 flex flex-col min-w-0"
    data-testid="testLeaderboardDiv"
  >
    <header class="flex items-center justify-between h-12 px-4 border-b border-crisiscleanup-grey-100">
      <h2 class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
        {{ $t('phoneDashboard.leaderboard') }}
      </h2>
      <base-select
        :model-value="dropdownProps.value"
        :searchable="false"
        :clearable="false"
        class="w-40"
        v-bind="dropdownProps"
        @update:model-value="onDropdownUpdate"
      />
    </header>

    <div class="grid grid-cols-[1fr_auto] items-center px-4 h-8 border-b border-crisiscleanup-grey-100 text-[11px] uppercase tracking-[0.04em] text-crisiscleanup-grey-900">
      <span>{{ $t('phoneDashboard.volunteer') }}</span>
      <span class="grid grid-cols-3 gap-x-4 justify-items-end w-48">
        <span>{{ $t('phoneDashboard.inbound') }}</span>
        <span>{{ $t('phoneDashboard.outbound') }}</span>
        <span>{{ $t('phoneDashboard.total') }}</span>
      </span>
    </div>

    <PaneError v-if="loadError" …><template #action>…</template></PaneError>
    <PaneEmpty v-else-if="loaded && !leaderboard.length" :title="$t('phoneDashboard.no_leaderboard_data')" />
    <div v-else class="max-h-[480px] overflow-y-auto">
      <div v-if="!loaded" class="flex flex-col">
        <PaneSkeleton v-for="i in 6" :key="i" variant="row" />
      </div>
      <ul v-else class="flex flex-col">
        <li
          v-for="rank in leaderboard"
          :key="rank.user.id"
          class="grid grid-cols-[1fr_auto] items-center gap-3 px-4 h-14 border-b border-crisiscleanup-grey-100 last:border-b-0 hover:bg-crisiscleanup-smoke transition"
        >
          <!-- left: avatar + identity -->
          <div class="flex items-center gap-2 min-w-0">
            <Avatar :initials="rank.user.full_name" :url="rank.user?.profilePictureUrl" size="xsmall" data-testid="testAvatarIcon" />
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-1.5 min-w-0">
                <UserDetailsTooltip :dark="false" :user="rank.user.id" name-class="text-[13px] font-semibold" data-testid="testUserInfoTooltip" />
                <BasePill v-for="l in getLanguageTags('en-US')" :key="l" variant="incident">{{ l }}</BasePill>
              </div>
              <div class="flex items-center gap-2 text-[12px] text-crisiscleanup-grey-900">
                <span v-if="rank.user.organization">{{ truncate(rank.user.organization.name, 28) }}</span>
                <BasePill v-if="rank.state" :variant="stateVariant(rank)">
                  {{ stateLabel(rank) }}
                </BasePill>
                <span v-if="rank.state_at" class="tabular-nums">{{ momentFromNow(rank.state_at) }}</span>
              </div>
            </div>
          </div>
          <!-- right: metrics -->
          <div class="grid grid-cols-3 gap-x-4 justify-items-end w-48">
            <span class="text-[13px] tabular-nums" data-testid="testInboundCountDiv">{{ padStart(rank.inbound_calls, 2, '0') }}</span>
            <span class="text-[13px] tabular-nums" data-testid="testOutboundCountDiv">{{ padStart(rank.outbound_calls, 2, '0') }}</span>
            <span class="text-[15px] font-semibold tabular-nums" data-testid="testTotalCountdiv">{{ padStart(rank.total, 2, '0') }}</span>
          </div>
        </li>
      </ul>
    </div>

    <footer v-if="loaded && (previous || next)" class="flex items-center justify-between px-4 h-12 border-t border-crisiscleanup-grey-100">
      <button type="button" class="w-8 h-8 grid place-items-center rounded hover:bg-crisiscleanup-smoke disabled:opacity-40 transition" :disabled="!previous" data-testid="testPreviousButton" @click="loadLeaderboard(null, previous)">
        <ccu-icon type="arrow-left" size="xs" :alt="$t('actions.previous')" />
      </button>
      <button type="button" class="w-8 h-8 grid place-items-center rounded hover:bg-crisiscleanup-smoke disabled:opacity-40 transition" :disabled="!next" data-testid="testNextButton" @click="loadLeaderboard(null, next)">
        <ccu-icon type="arrow-right" size="xs" :alt="$t('actions.next')" />
      </button>
    </footer>
  </section>
</template>
```

### 3. Loaded / error refs

```diff
+ const loaded = ref(false);
+ const loadError = ref(false);
  async function loadLeaderboard(r, url) {
+   loadError.value = false;
    try {
      resolution.value = r ?? resolution.value;
      const { data } = await axios.get(url || `${import.meta.env.VITE_APP_API_BASE_URL}/phone/leaderboard?resolution=${resolution.value}`);
      // … existing logic
+     loaded.value = true;
    } catch {
+     loadError.value = true;
    }
  }
```

### 4. New i18n keys

| Key | English copy |
|---|---|
| `phoneDashboard.volunteer` | "Volunteer" |
| `phoneDashboard.state_away` | "Away" |
| `phoneDashboard.state_online` | "Available" |
| `phoneDashboard.state_offline` | "Offline" |
| `phoneDashboard.state_connecting` | "Connecting" |
| `phoneDashboard.state_talking` | "On a call" |
| `phoneDashboard.no_leaderboard_data` | "No ranking data yet" |
| `phoneDashboard.leaderboard_error` | "Couldn't load leaderboard" |

## Reuse

- Spec 19: `PaneEmpty`, `PaneError`, `PaneSkeleton`.
- Spec 06: `BasePill` (states + language tags).
- `Avatar`, `UserDetailsTooltip`, `base-select`, `base-button`, `useWebSockets`, `User` model — unchanged.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `pnpm dev`:
  - Three resolution options load distinct rankings.
  - State pill swaps colour when the websocket fires a state change.
  - Pagination disables arrows when `previous` / `next` are null.
  - Empty, error, loading states all reachable (throttle the network / force a 500 in DevTools).

## Out of scope

- Sorting options beyond resolution.
- Viewing a user profile in-line (tooltip covers the short-read case).
- Exporting the leaderboard.
- Per-incident vs. all-incidents scope — data source owns that.

## Risks / rollback

- **Risk — state variant mapping.** 5 → 5 mapping; if a new state is added server-side, the fallback is `variant="dark"` which is the current offline colour. Acceptable degradation.
- **Risk — `Avatar` shadow removal.** If other leaderboard consumers rely on the inset shadow, add the override back behind a prop. Low-risk.
- **Risk — pagination overflow regression.** The max-height `max-h-[480px]` is an arbitrary cap; today the component has `max-h-120` (30 rem). Either cap works; measure and pick.
- **Rollback.** Revert one file.
