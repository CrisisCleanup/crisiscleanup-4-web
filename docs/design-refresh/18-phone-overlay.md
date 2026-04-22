# 18 — Phone overlay (sidebar, call banner, agent toolbar)

## Intent

The phone console — mounted at `/incident/:incident_id/phone` through
`src/pages/phone/routes.ts:5-12` — is the last major surface that still
carries pre-refresh chrome. Three subregions read visibly dated next to the
rest of the app now that specs 01–17b have shipped:

1. **The right sidebar** (`src/components/phone/PhoneOverlay.vue:757-872`)
   is a separate `bg-gray-100` column glued to the right of the page grid.
   Its 9 section tabs use a **yellow-tint filter on the icon + a 4 px
   left border** to indicate selection, with a **4 px bottom border on
   every row** between items. The whole column reads as a screenshot
   from a different app — heavy separators, `filter-primary`/`filter-gray`
   on bespoke SVGs, `hover:bg-primary-light hover:bg-opacity-30` yellow
   wash, and a raw `font-awesome-icon` chevron in a
   `border border-t-2` footer for the collapse toggle
   (`PhoneOverlay.vue:857-870`). The kit's nav language (spec 03, spec 14)
   is solid-fill active tiles on `bg-white`, 1 px separators, and smoke
   hover — none of it is present here.

2. **The active-call banner** (`PhoneOverlay.vue:398-483`) is a
   `bg-crisiscleanup-phone-green` (`#2D830C`) strip that
   **`animate-pulse`s** whenever a call is connected, with a *second*
   inline hex (`style="background: #358816"` on line 766) for the
   sidebar's "current call" header above the tabs. Two different greens,
   a pulsing animation that competes with every input on the page, and
   density (`p-3`, `py-2` everywhere) that doesn't match the utility
   strips introduced by specs 02, 14, and 15.

3. **The agent toolbar** (`src/components/phone/Agent.vue`, rendered by
   `PhoneToolBar.vue` at the top of the phone grid) crams six unrelated
   controls into a single `flex flex-wrap` row: status indicator,
   mobile number, language tag list with inline edit, "Start/Stop Taking
   Calls" button, "Not Playing Nice" checkbox + tooltip icon + call-type
   select, hangup icon. The spacing is `mr-3 / ml-3 / mx-2 / ml-4`
   hand-tuned, text is `text-xs`, and the disabled on-call state uses
   `bg-crisiscleanup-dark-400 bg-opacity-40` — a one-off dark tint that
   appears nowhere else post-refresh.

Everything in this spec is **layout + token polish**. No behavior
changes, no new sections, no routing changes. Kit tokens only: 4 px
radii, `shadow-crisiscleanup-card`, existing `phone-inbound` /
`phone-outbound` / `phone-calldown` palette pairs from
`tailwind.config.cjs:70-172`, `bg-primary` (yellow) for selected state,
`crisiscleanup-smoke` for hover, `crisiscleanup-grey-100` for dividers.

## Before / After

| Concern | Current | Target |
|---|---|---|
| Sidebar column surface | `bg-gray-100` separate column at right edge, `border-b-4` between items, `border border-t-2` footer | `bg-white` with a single `border-l border-crisiscleanup-grey-100`; rows separated by `border-b border-crisiscleanup-grey-100` (1 px); no footer border, just a smoke-hover chevron tile |
| Column width | `w-56` expanded / `w-14` collapsed | `w-52` (208 px) expanded / `w-12` (48 px) collapsed — matches chat pane (spec 14) |
| Tab row (expanded) | `p-2 … flex items-center gap-2 border-b-4` + `filter-primary`/`filter-gray` + `border-l-4 border-l-primary-light font-bold` active | 40 px tall row (`h-10 px-3 gap-2`), selected tile fills with `bg-primary text-black`, hover is `hover:bg-crisiscleanup-smoke`, no border-left strip, no filter tint |
| Tab row (collapsed) | 32 px icon tile with same filter/border-left active | 48 px wide `w-12 h-10` tile, same fill/hover/selected language as expanded |
| Icon source | 9 bespoke SVGs via `ccu-icon` with `filter-primary`/`filter-gray` recolor | Lucide via `unplugin-icons` (`~icons/lucide/*`) — **scoped exception**, same rationale as spec 15 (the sidebar is a nav tab stack whose selected state must be a confident fill change, which bespoke `<img>`-based SVGs can't do without the filter hack) |
| Hover wash | `hover:bg-primary-light hover:bg-opacity-30` (yellow 30 %) | `hover:bg-crisiscleanup-smoke` — neutral, same as spec 03 / spec 15 |
| Badges on tabs | Raw `<badge>` with `bg-primary-light text-black p-2` or `bg-red-500 text-white p-2` | `<BasePill variant="primary" size="sm">` for counts, `variant="danger"` for urgent chat — shipped in spec 06 |
| Collapse chevron (sidebar) | `font-awesome-icon chevron-left/right` inside `p-3 border border-t-2` row, "Collapse" literal string in English only | 32×32 icon button (`w-8 h-8 grid place-items-center rounded hover:bg-crisiscleanup-smoke`), `font-awesome-icon` kept but `aria-label` is localized (`actions.hide_options` / `actions.show_options`) |
| Call banner color (active) | `bg-crisiscleanup-phone-green` (`#2D830C`) + `animate-pulse` | Token-driven: `bg-crisiscleanup-phone-inbound-dark` (`#05A4D2`) when inbound, `bg-crisiscleanup-phone-outbound-dark` (`#419954`) when outbound, `bg-crisiscleanup-grey-800` when `hasCallEnded`. **No `animate-pulse`.** |
| Call banner density | `p-3` with three nested flex layers | `px-4 py-2` single row at `h-12`, gap-4; caller info on the left, hangup/complete on the right |
| Second green (sidebar header) | inline `style="background: #358816"` on `PhoneOverlay.vue:766` | removed — the sidebar's "current call 00:00:00" strip is replaced with a compact pill that reuses the same banner token, rendered inline at the top of the expanded sidebar only |
| Call timer | `BaseText` bold white at 16 px | Same color/size but `font-variant-numeric: tabular-nums` so the digits don't jitter as seconds tick |
| Mobile bottom nav | `h-14 bg-gray-100`, all 9 icons in one row with `border-t-4 border-primary-light` active strip | `h-16 bg-white border-t border-crisiscleanup-grey-100`, **5 primary tabs** (Call history, Stats, Chat, News, More), extras (Manual dialer, Leaderboard, Zoom, Report bug, Phone Doctor) open via the "More" tab as a full-height bottom sheet |
| Mobile tab active indicator | 4 px yellow top border | 2 px dot centered below the label, `bg-primary` — same pattern as the dashboard tabs refreshed in spec 13 |
| Agent toolbar layout | one `flex flex-wrap` row of 6 controls | three explicit clusters with dividers — **left** (status pill + mobile number), **center** (languages + edit), **right** (start/stop button, not-playing-nice checkbox/select, hangup) — matches the 3-cluster pattern from spec 15 |
| Agent toolbar on-call state | dimmed `bg-crisiscleanup-dark-400 bg-opacity-40` button labeled "On Call" | Compact pill next to the status indicator: `<BasePill variant="success" size="sm">{{ $t('phoneDashboard.on_call') }}</BasePill>`; the toolbar *action slot* becomes the hangup button (already exists, currently sits at the very end) |
| Languages tag list | `mx-2 text-crisiscleanup-dark-200` label + inline tags + bespoke `edit` icon at `size="small" mx-1` | Labeled cluster: micro label "Languages" in 12 px uppercase, tag list, edit icon in a 32×32 hover tile so the hit target matches spec 11 |

## Files to touch

- `src/components/phone/PhoneOverlay.vue` — replace the sidebar column
  (`:757-872`), the active-call banner (`:398-483`), and the mobile
  bottom nav (`:321-387`). Sections keep their current `view` strings so
  no `currentView === 'x'` branches change.
- `src/components/phone/Agent.vue` — restructure the toolbar into three
  clusters; swap the on-call disabled button for a status pill + hangup
  action pairing.
- `src/components/phone/PhoneIndicator.vue` — unchanged visually, but
  verify its surface works on `bg-white` (currently renders fine on both
  `bg-white` and `bg-gray-100`).
- `src/components/BasePill.vue` — **no changes**; must exist from spec
  06 and support `variant="primary" | "danger" | "success"` and
  `size="sm"`. If spec 06 isn't merged yet, fall back to
  `<span class="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[12px] font-semibold text-black">` inline and convert later.
- `src/assets/icons/` — **no new SVGs**. The 9 section icons are
  migrated to Lucide (scoped exception).
- `docs/design-refresh/00-tracker.md` — add row 18, drop
  "Phone panel rework beyond the header's phone indicator" from the
  "Out of scope" list.

**Icon mapping (scoped Lucide exception):** same rationale as spec 15.
The sidebar is a tab stack whose selected state is the whole point of
the control; the bespoke `ccu-icon` flow renders SVG via `<img>` and
cannot recolor without the `filter-*` hack, which is the exact thing
that looks dated. Lucide is already installed (`@iconify/json` +
`unplugin-icons`) so `~icons/lucide/phone-incoming` renders inline with
`currentColor` and swaps from grey → black (on yellow) cleanly.

| Section (`view` key) | Lucide glyph | Rationale |
|---|---|---|
| `callHistory` | `phone-incoming` | Inbound + history context |
| `manualDialer` | `phone-outgoing` | Outbound dialer |
| `leaderboard` | `trophy` | Volunteer stats |
| `zoom` | `video` | Join Zoom link |
| `cms` | `newspaper` | CMS news feed |
| `generalStats` | `bar-chart-3` | Queue / stats |
| `chat` | `message-circle` | Chat pane |
| `reportBug` | `bug` | Report bug action |
| `phoneDoctor` | `stethoscope` | Diagnostics |

The agent toolbar's three bespoke icons (`edit`, `help`, `hangup`) stay
on `ccu-icon` — they're single-instance, non-tab, and their current
rendering is fine; only the spacing around them changes.

## Implementation

1. **Extract section config off `sections` computed**
   (`PhoneOverlay.vue:53-117`). Each entry gains a `lucide` key:

   ```ts
   import IconPhoneIncoming from '~icons/lucide/phone-incoming';
   import IconPhoneOutgoing from '~icons/lucide/phone-outgoing';
   // … (9 total)

   const sections = computed(() => [
     {
       view: 'callHistory',
       text: t('phoneDashboard.last_10_calls'),
       icon: IconPhoneIncoming,
       alt: t('phoneDashboard.last_10_calls'),
     },
     // …
   ]);
   ```

   Keep `view`, `text`, `alt`, `onOpen` shapes; only swap `icon: 'phone-history'` (string →
   component reference). The template will render with `<component :is="section.icon" />`
   instead of `<ccu-icon :type="section.icon" …>`.

2. **Rewrite the desktop sidebar column**
   (`PhoneOverlay.vue:757-872`). Target markup:

   ```html
   <aside
     v-if="!useBottomNav"
     class="bg-white border-l border-crisiscleanup-grey-100 flex flex-col justify-between"
     :class="sideBarExpanded ? 'w-52' : 'w-12'"
   >
     <div>
       <!-- current-call strip (replaces lines 762-772) -->
       <div
         v-if="isOnCall"
         class="h-10 px-3 flex items-center gap-2 text-white text-[13px] font-semibold"
         :class="isInboundCall
           ? 'bg-crisiscleanup-phone-inbound-dark'
           : 'bg-crisiscleanup-phone-outbound-dark'"
       >
         <span class="w-2 h-2 rounded-full bg-white" />
         <span v-if="sideBarExpanded">{{ $t('phoneDashboard.current_call') }}</span>
         <span class="ml-auto tabular-nums">{{ formattedElapsedTime }}</span>
       </div>

       <!-- section tabs -->
       <nav role="tablist" :aria-label="$t('phoneDashboard.phone_sections')">
         <button
           v-for="section in sections"
           :key="section.view"
           type="button"
           role="tab"
           :aria-selected="currentView === section.view"
           :data-testid="`testPhoneOverlay_${section.view}`"
           :title="section.text"
           class="relative w-full h-10 flex items-center gap-2 border-b border-crisiscleanup-grey-100 transition"
           :class="[
             currentView === section.view
               ? 'bg-primary text-black font-semibold'
               : 'text-crisiscleanup-grey-900 hover:bg-crisiscleanup-smoke',
             sideBarExpanded ? 'px-3' : 'justify-center px-0',
           ]"
           @click="currentView === section.view ? closeTab() : updateView(section)"
         >
           <component :is="section.icon" class="w-5 h-5 flex-none" />
           <span v-if="sideBarExpanded" class="text-[13px] truncate">
             {{ section.text }}
           </span>
           <!-- badge slot -->
           <BasePill
             v-if="section.view === 'generalStats' && callsWaiting > 0"
             variant="primary"
             size="sm"
             class="ml-auto"
           >
             {{ callsWaiting }}
           </BasePill>
           <BasePill
             v-else-if="section.view === 'cms' && unreadNewsCount > 0"
             variant="primary"
             size="sm"
             class="ml-auto"
           >
             {{ unreadNewsCount }}
           </BasePill>
           <span v-else-if="section.view === 'chat'" class="ml-auto flex gap-1">
             <BasePill
               v-if="unreadChatCount > 0"
               variant="primary"
               size="sm"
             >{{ unreadChatCount }}</BasePill>
             <BasePill
               v-if="unreadUrgentChatCount > 0"
               variant="danger"
               size="sm"
             >{{ unreadUrgentChatCount }}</BasePill>
           </span>
         </button>
       </nav>
     </div>

     <!-- collapse toggle (replaces 857-870) -->
     <button
       type="button"
       class="h-10 border-t border-crisiscleanup-grey-100 flex items-center justify-center gap-2 text-[12px] text-crisiscleanup-grey-900 hover:bg-crisiscleanup-smoke transition"
       :aria-label="sideBarExpanded ? $t('actions.hide_options') : $t('actions.show_options')"
       @click="sideBarExpanded = !sideBarExpanded"
     >
       <font-awesome-icon
         :icon="['fas', sideBarExpanded ? 'chevron-right' : 'chevron-left']"
       />
       <span v-if="sideBarExpanded">{{ $t('actions.collapse') }}</span>
     </button>
   </aside>
   ```

3. **Replace the active-call banner**
   (`PhoneOverlay.vue:398-483`). Reduce to a single row inside the
   content column:

   ```html
   <header
     v-if="caller"
     class="px-4 h-12 flex items-center justify-between gap-4 text-white"
     :class="bannerClass"
   >
     <div class="flex items-center gap-3 min-w-0">
       <span class="w-2 h-2 rounded-full bg-white flex-none" />
       <span class="text-[13px] font-semibold whitespace-nowrap">
         <template v-if="isConnecting">{{ $t('phoneDashboard.connecting') }}</template>
         <template v-else-if="isInboundCall">{{ $t('phoneDashboard.inbound_call') }}</template>
         <template v-else-if="isOutboundCall">{{ $t('phoneDashboard.outbound_call') }}</template>
         <template v-else-if="hasCallEnded">{{ $t('phoneDashboard.call_ended') }}</template>
       </span>
       <PhoneNumberDisplay :phone-number="caller.dnis" type="plain" class="truncate" />
       <span v-if="caller.location_name" class="text-[13px] opacity-80 truncate">
         {{ caller.location_name }} {{ caller.state_name }}
       </span>
       <span class="tabular-nums text-[13px] opacity-90">{{ formattedElapsedTime }}</span>
     </div>
     <div class="flex items-center gap-2 flex-none">
       <base-button
         :action="() => (expanded = !expanded)"
         :text="$t('actions.show_details')"
         variant="text"
         :suffix-icon="expanded ? 'chevron-up' : 'chevron-down'"
         class="text-white"
       />
       <base-button
         v-if="isOnCall"
         variant="solid"
         :action="endCall"
         :text="$t('actions.end_call')"
         class="text-black"
       />
       <base-button
         v-else
         variant="solid"
         :action="showCompleteCall"
         :text="$t('phoneDashboard.complete_call')"
         class="text-black"
       />
     </div>
   </header>
   ```

   With:

   ```ts
   const bannerClass = computed(() => {
     if (hasCallEnded.value) return 'bg-crisiscleanup-grey-800';
     if (isInboundCall.value) return 'bg-crisiscleanup-phone-inbound-dark';
     return 'bg-crisiscleanup-phone-outbound-dark';
   });
   ```

   **Drop `animate-pulse`** on line 401. The color signal + timer motion
   is enough; the pulse is the single largest visual offender on this
   page.

4. **Rewrite the mobile bottom nav**
   (`PhoneOverlay.vue:321-387`). Collapse to 5 tabs:

   ```ts
   const mobilePrimaryViews = new Set([
     'callHistory',
     'generalStats',
     'chat',
     'cms',
   ]);
   const mobileSections = computed(() => {
     const primary = sections.value.filter((s) => mobilePrimaryViews.has(s.view));
     const overflow = sections.value.filter((s) => !mobilePrimaryViews.has(s.view));
     return [
       ...primary,
       {
         view: '__more__',
         text: t('actions.more'),
         icon: IconMoreHorizontal, // ~icons/lucide/more-horizontal
         alt: t('actions.more'),
         overflow,
       },
     ];
   });
   ```

   Tapping "More" sets `currentView = '__more__'`, which renders a
   full-height bottom sheet listing the overflow sections as a vertical
   list (same `button` markup as the desktop sidebar rows). Selecting an
   overflow item sets `currentView` to that item's `view` and collapses
   the sheet — exactly what the current icon-tap does.

   Markup:

   ```html
   <nav class="h-16 bg-white border-t border-crisiscleanup-grey-100 flex">
     <button
       v-for="section in mobileSections"
       :key="section.view"
       :data-testid="`testPhoneOverlay_${section.view}`"
       type="button"
       class="flex-1 flex flex-col items-center justify-center gap-0.5 transition"
       :class="currentView === section.view
         ? 'text-black'
         : 'text-crisiscleanup-grey-900 hover:bg-crisiscleanup-smoke'"
       @click="() => section.view === '__more__'
         ? openMoreSheet()
         : (currentView === section.view ? closeTab() : updateView(section))"
     >
       <component :is="section.icon" class="w-5 h-5" />
       <span class="text-[10px] uppercase tracking-[0.04em] leading-none">
         {{ section.text }}
       </span>
       <span
         class="w-1 h-1 rounded-full bg-primary transition-opacity"
         :class="currentView === section.view ? 'opacity-100' : 'opacity-0'"
       />
       <!-- badges identical to desktop, ml/absolute positioning per current pattern -->
     </button>
   </nav>
   ```

5. **Restructure `Agent.vue`** into three clusters with vertical
   dividers, matching spec 15's utility-bar language:

   ```html
   <template>
     <div class="bg-white h-12 px-3 flex items-center gap-3 text-[13px] border-b border-crisiscleanup-grey-100">
       <!-- LEFT: status + mobile -->
       <div class="flex items-center gap-3 flex-none">
         <PhoneIndicator />
         <BasePill
           v-if="isOnCall || caller"
           variant="success"
           size="sm"
         >
           {{ $t('phoneDashboard.on_call') }}
         </BasePill>
         <BasePill
           v-else-if="isTakingCalls"
           variant="primary"
           size="sm"
         >
           {{ allowedCallsString }}
         </BasePill>
         <base-text
           v-if="currentUser"
           data-testid="testCurrentUserMobileContent"
           variant="bodysm"
           class="text-crisiscleanup-grey-900"
         >
           {{ currentUser.mobile }}
         </base-text>
       </div>

       <!-- CENTER: languages -->
       <div
         class="flex items-center gap-2 pl-3 border-l border-crisiscleanup-grey-100 min-w-0"
         data-testid="testPhoneDashboardLanguagesDiv"
       >
         <span class="text-[11px] uppercase tracking-[0.06em] text-crisiscleanup-grey-900 font-semibold flex-none">
           {{ $t('phoneDashboard.languages') }}
         </span>
         <div class="flex items-center gap-1 min-w-0 overflow-hidden">
           <template v-for="l in languages" :key="`l_${l?.id ?? 'x'}`">
             <LanguageTag v-if="l?.id" :language-id="l.id" />
           </template>
         </div>
         <button
           type="button"
           class="w-8 h-8 grid place-items-center rounded hover:bg-crisiscleanup-smoke transition flex-none"
           :aria-label="$t('actions.edit')"
           data-testid="testLanguageEditIcon"
           @click="editingAgent = true"
         >
           <ccu-icon type="edit" size="small" :alt="$t('actions.edit')" />
         </button>
       </div>

       <!-- RIGHT: call-taking + extras + hangup -->
       <div class="ml-auto flex items-center gap-2 flex-none pl-3 border-l border-crisiscleanup-grey-100">
         <base-button
           v-if="isNotTakingCalls && !isOnCall && !caller"
           data-testid="testIsNotTakingCallsButton"
           variant="solid"
           size="medium"
           :action="startTakingCalls"
           :text="$t('phoneDashboard.start_taking_calls')"
         />
         <base-button
           v-else-if="!isOnCall && !caller"
           data-testid="testIsNotOnCallButton"
           variant="outline"
           size="medium"
           :action="setAway"
           :text="$t('phoneDashboard.stop_taking_calls')"
         />

         <base-checkbox
           v-if="!notPlayingNice"
           v-model="notPlayingNice"
           data-testid="notPlayingNiceCheckbox"
         >
           <span class="whitespace-nowrap">{{ $t('phoneDashboard.not_playing_nice') }}</span>
         </base-checkbox>
         <button
           v-tooltip="{
             content: $t('phoneDashboard.not_playing_nice_alt'),
             triggers: ['click'],
             popperClass: 'interactive-tooltip w-72',
             html: true,
           }"
           type="button"
           class="w-8 h-8 grid place-items-center rounded hover:bg-crisiscleanup-smoke transition"
           :aria-label="$t('phoneDashboard.not_playing_nice_alt')"
         >
           <ccu-icon type="help" size="small" />
         </button>
         <base-select
           v-if="notPlayingNice"
           data-testid="notPlayingNiceSelect"
           class="w-56 h-9"
           :options="[
             AllowedCallType.INBOUND_ONLY,
             AllowedCallType.OUTBOUND_ONLY,
             AllowedCallType.BOTH,
           ]"
           @update:model-value="$emit('setAllowedCallType', $event)"
         />

         <button
           v-if="(isOnCall || caller) && isOutboundCall"
           type="button"
           class="w-9 h-9 grid place-items-center rounded hover:bg-crisiscleanup-smoke transition"
           :aria-label="$t('actions.hangup')"
           data-testid="testHangupIcon"
           @click="hangUp"
         >
           <ccu-icon type="hangup" size="lg" :alt="$t('actions.hangup')" />
         </button>
       </div>

       <EditAgentModal v-if="editingAgent" @cancel="editingAgent = false" />
     </div>
   </template>
   ```

   The disabled "On Call" button (`Agent.vue:47-54`) is replaced by the
   success pill in the left cluster — one signal per state, no
   duplicated "on-call" indicator.

6. **Data-testid inventory — must stay on their new host elements**:
   `testPhoneOverlay_callHistory`, `testPhoneOverlay_manualDialer`,
   `testPhoneOverlay_leaderboard`, `testPhoneOverlay_zoom`,
   `testPhoneOverlay_cms`, `testPhoneOverlay_generalStats`,
   `testPhoneOverlay_chat`, `testPhoneOverlay_reportBug`,
   `testPhoneOverlay_phoneDoctor` (sidebar rows) +
   `testPhoneDashboardLanguagesDiv`, `testLanguageEditIcon`,
   `testIsNotTakingCallsButton`, `testIsNotOnCallButton`,
   `testHangupIcon`, `testIsOnCallButton` → **removed**; the status pill
   replaces it (update any E2E that asserted this testid, grep first).
   Also: `testIsConnectingDiv`, `testIsOnCallDiv`, `testIsInboundCallDiv`,
   `testIsOutboundCallDiv`, `testIsCompletedDiv` collapse from nested
   divs into a single `<span>` — move them onto that span (don't drop).

7. **Update the tracker** (`docs/design-refresh/00-tracker.md`):
   - Append row 18 to the status table.
   - Delete the "Phone panel rework beyond the header's phone indicator"
     line from the *Out of scope* list (lines ~93-95).

## Reuse

- `BasePill` (spec 06) — primary/danger/success variants power every
  badge and the new on-call status chip.
- `base-button` (`BaseButton.vue`) — unchanged; `variant="solid"` +
  `variant="outline"` + `variant="text"` are all pre-existing.
- `~icons/lucide/*` via `unplugin-icons` — already wired at
  `vite.config.ts`; Lucide ships with `@iconify/json`. No config change.
- `crisiscleanup-phone-inbound.dark` / `phone-outbound.dark` /
  `grey-800` / `smoke` / `grey-100` — all live in
  `tailwind.config.cjs:70-172`. Zero new tokens.
- `PhoneIndicator.vue` — reused verbatim in the Agent toolbar's left
  cluster.
- `LanguageTag`, `EditAgentModal`, `UpdateStatus`, `CurrentCall`,
  `CallHistory`, `Leaderboard`, `GeneralStats`, `ManualDialer`,
  `PhoneCmsItems`, `PhoneDoctor`, `Chat` — **all untouched**. Only the
  chrome around them changes.
- `useConnectFirst` / `useCurrentUser` / `useMq` — unchanged.
- Existing i18n keys: every string used above already exists in
  `phoneDashboard.*`, `actions.*`, or `chat.*`. The one new key
  (`phoneDashboard.phone_sections` — sidebar `aria-label`) is optional;
  fall back to the literal if copy hasn't shipped.

## Verification

- `pnpm dev`, **1440 px**, authenticated, on
  `/incident/:id/phone`:
  - Sidebar column: white background, 1 px divider lines, 208 px wide
    expanded. Each tab is 40 px tall, icon left, label center, badge
    right when present. Hover = smoke, selected = yellow fill + black
    text. No filter-tinted icons remain.
  - Collapse chevron at the bottom is a 40 px row with smoke hover; the
    "Collapse" literal is wrapped in `$t('actions.collapse')` and
    disappears when the column is 48 px wide.
  - Start a test outbound call (Manual dialer → any number on the
    staging number pool): call banner renders
    `bg-crisiscleanup-phone-outbound-dark` (`#419954`) — no pulse — with
    the timer ticking in tabular-nums. End the call; banner color
    shifts to `bg-crisiscleanup-grey-800` and the "Call ended" label
    takes over with Complete Call on the right.
  - Trigger an inbound call (staging queue with a test caller): banner
    is `bg-crisiscleanup-phone-inbound-dark` (`#05A4D2`) instead.
- `pnpm dev`, **1024 px**: agent toolbar collapses gracefully —
  center cluster (languages) truncates before the right cluster loses
  any controls. The start/stop button and hangup tile never wrap to a
  second row.
- `pnpm dev`, **390 px**: bottom nav is 64 px tall, 5 tabs, active tab
  has black icon + text + the 2 px yellow dot centered under the label.
  Tap "More" → bottom sheet lists Manual Dialer, Leaderboard, Zoom,
  Report Bug, Phone Doctor as 48 px rows. Tap any row → sheet closes,
  selected pane opens full-screen as before.
- Badge rendering: simulate `callsWaiting = 3`, `unreadNewsCount = 2`,
  `unreadChatCount = 4`, `unreadUrgentChatCount = 1` — the chat row
  shows two pills side-by-side (primary + danger), nothing else on the
  page uses the red tone for non-urgent counts.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`,
  `pnpm test:e2e --grep '@primary'` — clean. Grep first for any E2E
  still asserting `testIsOnCallButton`:
  `rg -n 'testIsOnCallButton' test/` — update to the new pill selector
  (`text=On Call` or a new `testIsOnCallPill` if you prefer an explicit
  id).
- `pnpm typecheck` will flag the current file's existing type bleed in
  `PhoneSystem.vue` (pre-existing errors from the diagnostics snapshot —
  `Parameter 'worksite' implicitly has an 'any' type`, etc.). **Do not
  fix those in this spec**; they belong to the implicit-any cleanup
  track. The redesign must not *add* new type errors; leave the
  pre-existing ones alone.
- Dark-mode, i18n, and Sentry surfaces: none of the changes add new
  hex literals, new log paths, or new untranslated strings. Portal
  cold-load (the case that leaks raw i18n keys per spec 15) — none of
  the strings used here are newly introduced, so the stale-copy path
  already covers them.

## Out of scope

- **Section content panes** — `Leaderboard`, `GeneralStats`,
  `PhoneDoctor`, `PhoneCmsItems`, `CallHistory`, `ManualDialer`,
  `Chat`, etc. Each of those is a separate surface; if they look dated
  inside the new chrome, they get their own spec. Only the
  shell/tabs/banner change here.
- **Phone doctor rework** — `PhoneDoctor.vue` is 1100 lines of
  diagnostics and has its own `h-204` layout. This spec only ensures
  the pane hosts cleanly in the refreshed content column.
- **Active-call `CurrentCall` pane** (`PhoneOverlay.vue:746-751`,
  `bg-crisiscleanup-green-800/95`) — the green-tinted "related cases"
  pane behind the banner. Belongs to a CurrentCall-specific refresh
  spec; banner-only here.
- **`PhoneSystem.vue` grid** (`src/pages/phone/PhoneSystem.vue`) —
  the outer page layout (map / table / form / right rail grid) is
  correct; only the right rail (PhoneOverlay) and the top toolbar
  (Agent) are in scope. The existing grid `lg:h-screen lg:grid-cols-3`
  is unchanged.
- **Routing / mount strategy** — PhoneSystem stays a full-page route
  under `layout: 'authenticated'`; no change to whether it's a modal,
  drawer, or page.
- **Call-banner audio / keyboard shortcuts** — the banner is visual
  only; spacebar-to-answer, etc., are a separate discussion.
- **`tailwind.config.cjs`** — no token changes. `phone-inbound` /
  `phone-outbound` / `phone-calldown` already live in the config; this
  spec is the first to actually use them.
- **Backfilling bespoke SVGs for the 9 sidebar tabs** — tracker
  principle is "no Lucide", with documented scoped exception for
  segmented / tab controls (spec 15). If a future iteration redraws
  bespoke SVGs to match the kit weight, the sidebar can flip back —
  the rest of the layout in this spec is icon-source-agnostic.

## Risks / rollback

- **Risk:** Lucide exception expansion. Spec 15 carved a single
  scoped exception for a segmented view-mode control on the Work page.
  This spec opens a second — a 9-tab nav column — under the same
  rationale (fill-based selected state). If reviewers want to keep the
  bespoke set, the fallback is: keep `ccu-icon` for every tab, and
  the active state becomes `bg-primary` + `filter-black` on the icon
  (assuming a `filter-black` utility exists — verify at
  `src/assets/tailwind/filters.css` or the equivalent; if not, add one
  or hand-invert via `style="filter: brightness(0)"`). The *layout*
  win is independent of the icon source.
- **Risk:** `BasePill` ships via spec 06 but that spec is "in-progress,
  manual verify pending" per `00-tracker.md`. If it hasn't merged when
  this spec starts, inline the pill markup (one `<span>` with six
  Tailwind classes) and convert in a follow-up. Do not block on spec 06.
- **Risk:** the existing `animate-pulse` on the call banner is not
  purely cosmetic — some operators report they visually orient to the
  pulse during a rush. Mitigation: the new banner *color shift*
  (grey-800 on call end, outbound-green while live) is a stronger
  signal than pulse; if operator feedback disagrees, add a single
  `animate-pulse` on the 2 px indicator dot only, not the whole strip.
- **Risk:** `@vuex-orm` model reactivity — `callsWaiting`,
  `unreadChatCount`, and `unreadUrgentChatCount` are `ref`s updated
  via event listeners in `onMounted`. The pill refactor keeps the
  v-if chain, so no reactivity path changes, but verify at runtime
  that the chat pill flips urgent→primary correctly when an urgent
  message is read (existing bug, may surface more visibly post-refresh).
- **Risk:** E2E specs tagged `@primary` and `@development` that drive
  the phone overlay rely on the `testIsOnCallButton` testid and on the
  call banner's visible text. The spec keeps every `testPhoneOverlay_*`
  testid; `testIsOnCallButton` disappears. Grep
  `test/e2e test/unit -rn testIsOnCallButton` before merging and update
  those asserts to target the pill (or add `data-testid="testIsOnCallPill"`
  to `BasePill` in this one place).
- **Rollback:** all changes are local to two Vue files
  (`PhoneOverlay.vue`, `Agent.vue`) plus a one-line tracker edit. Revert
  the commit. No data migrations, no config changes, no store changes.
