# 15 — Work utility bar (view toggles, search, filters, sliders)

## Intent

The **Work page utility bar** (`src/pages/Work.vue:329-537`, desktop branch)
is the operator's most-used control strip — view toggles on the left, a case
count, a combined search + location select in the middle, a
filters / layers / download cluster on the right, and two range sliders
(SVI + "Updated") rendered beneath the main row. Today it has three sharp
problems visible in any 1440 px screenshot:

1. **View-toggle icons are low quality.** `WorksiteNavigationIcons`
   (`src/pages/WorksiteNavigationIcons.vue`) renders seven `ccu-icon`s
   back-to-back: `map`, `table`, `image`, `scroll` (feed), `calendar`,
   `calendar-list`, `calendar-map`. Some are bespoke SVGs in
   `src/assets/icons/` (`map`, `table`, `calendar`, `calendar-list`,
   `calendar-map`); the photo + feed glyphs come from FontAwesome via
   `:fa="true"`. Stroke weights, padding, and optical sizing don't match
   across the row — the result reads as "greyed-out decorations" rather
   than a real segmented control. There's also no visual container
   distinguishing the selected state beyond a yellow tint filter.
2. **Flow is cluttered.** View toggles, count, search, location select,
   and the right-side actions all sit inside a single
   `flex flex-wrap w-full p-3 gap-2` row with no visual grouping. Heavy
   items (the `w-72` location select, the `w-24` case count) float
   between lighter ones; at narrower widths they wrap unpredictably and
   the collapse chevron ends up in row 2. The count ("Cases 24,324")
   reads as a microcopy label instead of a stat.
3. **Translation leak + stranded sliders.** The location select's
   placeholder shows the raw key `casesVue.find_county_city_postal_code`
   when the portal hasn't yet loaded that phrase
   (`src/pages/Work.vue:394`). And the two sliders
   (`src/pages/Work.vue:505-536`) are centered in their own full-width row
   beneath the bar with no label or divider — they look detached from
   the controls that produce them and pre-empt a third of the map
   viewport on standard laptops.

This spec tightens all three without adding behavior. Kit tokens only:
4 px radii, `shadow-crisiscleanup-card`, `primary` yellow selected state,
no new colors.

## Before / After

| Concern | Current | Target |
|---|---|---|
| View icons | 7 `ccu-icon`s at `size="medium"` with `filter-yellow`/`filter-gray`; mixed bespoke + FA sources | 7 refreshed bespoke SVGs at a single 20 px optical size, wrapped in a **segmented button group**; selected tile gets `bg-primary text-black`, not a tint filter |
| Photo + feed icons | FontAwesome (`type="image"`/`"scroll"` with `:fa="true"`) | New bespoke SVGs (`photo-map.svg`, `feed.svg`) so every tile shares stroke weight |
| Row layout | one `flex flex-wrap gap-2` row for *everything* | three explicit slots: **left** (view group + count), **center** (search + location), **right** (filters + layers + download + collapse) — each with a subtle vertical divider `border-l border-crisiscleanup-grey-100` |
| Case count | `font-thin` text inline with icons | Compact pill: `Cases · 24,324` — `text-[13px] font-semibold` in `bg-crisiscleanup-smoke rounded px-2 py-1` |
| Location select placeholder | leaks raw key when portal copy is stale | `$t('casesVue.find_county_city_postal_code', 'Find a county, city, or postal code')` — fallback string ships with the build |
| Sliders | centered row beneath the bar, always on | Right-rail **"Refine"** popover button in the right cluster that opens both sliders in a 280 px wide panel; if `allWorksiteCount < 100` the button stays hidden (same condition as today) |
| Collapse chevron | bottom-right, `rounded-full border` with no label | unchanged visually, moved to the far end of the right cluster |
| Wrap behavior | icons wrap first, collapse chevron jumps rows | left + right clusters stay pinned; center (search + select) collapses to icon-only at `<lg` then to a "Search" modal trigger at `<md` (already handled by `mq.mdMinus` in WorksiteActions) |

## Files to touch

- `src/pages/WorksiteNavigationIcons.vue` — rewrite template to use a
  segmented group; keep props and emits untouched.
- `src/assets/icons/` — ship five refreshed bespoke SVGs:
  `map.svg` (already exists, **redraw**), `table.svg` (redraw),
  `calendar.svg` (redraw), `calendar-list.svg` (redraw),
  `calendar-map.svg` (redraw) + two new files: `photo-map.svg`,
  `feed.svg`. All 24×24 viewBox, 1.75 px stroke, stroke-linejoin: round,
  `currentColor` fill — matches the tracker's "bespoke icons" principle
  (`00-tracker.md`).
- `src/pages/Work.vue` — restructure the utility bar row into three
  clusters, replace the case-count span with a pill, pull the two
  sliders into a new `<WorksiteRefine>` popover.
- `src/components/work/WorksiteRefine.vue` — **new**. Tiny wrapper that
  renders the existing `<Slider>` components inside a `v-popover`
  triggered by a single "Refine" `base-button` with `ccu-icon="filters"`
  (reuses `WorksiteActions`'s filter glyph so the right cluster reads
  uniformly). **No business logic** — forwards `input` events straight
  back to `Work.vue`.
- `src/components/BaseIcon.vue` — no changes; existing `ccu-icon`
  component already supports bespoke SVGs via name lookup and
  `filter-*` utilities.

**Icon pack decision (revised):** the original draft tried to stay inside
the tracker's *"never substitute Lucide / Heroicons"* principle. The view
toggles are a clear exception for three reasons and the exception was
approved:

1. The bespoke SVGs in `src/assets/icons/` have **inconsistent intrinsic
   sizes** — the bundled `calendar.svg` renders visibly smaller than
   `map.svg` / `table.svg` at `w-5 h-5`. A segmented control needs one
   optical size, uniformly.
2. Bespoke SVGs are `<img>` tags driven by `ccu-icon`, so they carry
   **fixed fills** and can't recolor on selected state. The kit's
   `filter-yellow` utility is a hack that tints everything, so the
   "selected = yellow" state reads as "greyed out with a hue shift"
   instead of a confident fill change.
3. **Lucide** (`~icons/lucide/*`) is already installed via
   `@iconify/json` and `unplugin-icons`. Its glyphs render as inline
   `<svg>` with `currentColor` stroke, so `text-black` vs
   `text-crisiscleanup-grey-900` on the parent button swaps the icon
   color cleanly.

Mapping used:

| Tab | Lucide name |
|---|---|
| Map | `map` |
| Table | `rows-3` |
| Photo map | `image` |
| Feed | `scroll-text` |
| Calendar | `calendar` |
| Calendar list | `calendar-days` |
| Calendar map | `map-pinned` |

Everything else on the page still uses bespoke `src/assets/icons` — the
tracker principle stands, with a documented scoped exception for the
Work utility bar's view-mode segmented group. If other surfaces with
the same "segmented control of icons" pattern appear, reuse this mapping
rather than re-evaluating per surface.

## Implementation

1. **Redraw / add the bespoke SVGs.** Each icon:
   - 24×24 `viewBox`
   - single root `<svg>` with `fill="currentColor"` (filled glyphs) or
     `stroke="currentColor" stroke-width="1.75" fill="none"` (outlined);
     stay consistent within the row — outlined for *all* seven view
     toggles is the target here
   - no embedded `width` / `height` so Tailwind sizing utilities win
   - no inline styles, no `<title>` (screen-reader label comes from
     `ccu-icon`'s `alt` prop)

   New files:
   - `src/assets/icons/photo-map.svg` — map rectangle with a pinned
     photo-frame overlay
   - `src/assets/icons/feed.svg` — three horizontal rules of decreasing
     width in a rounded rectangle

   Redraws: `map`, `table`, `calendar`, `calendar-list`, `calendar-map`
   — keep names identical so every `<ccu-icon type="…">` call continues
   to resolve. Compare side-by-side against `src/assets/icons/filters.svg`
   + `src/assets/icons/layers.svg` (these two already match the target
   weight and are the reference for the redraw).

2. **Rewrite `WorksiteNavigationIcons.vue`** as a segmented group. Keep
   the public shape (props / emits) byte-identical so `Work.vue` and
   `Phone.vue` callers don't change.

   ```vue
   <template>
     <div
       role="tablist"
       :aria-label="$t('casesVue.view_mode')"
       class="inline-flex items-center rounded border border-crisiscleanup-grey-100 bg-white overflow-hidden"
     >
       <button
         v-for="tab in tabs"
         :key="tab.key"
         v-show="tab.visible"
         type="button"
         role="tab"
         :aria-selected="tab.active"
         :data-testid="tab.testid"
         :title="tab.label"
         class="w-9 h-9 grid place-items-center transition"
         :class="
           tab.active
             ? 'bg-primary text-black'
             : 'text-crisiscleanup-grey-900 hover:bg-crisiscleanup-smoke'
         "
         @click="tab.emit"
       >
         <ccu-icon
           :type="tab.icon"
           :fa="tab.fa"
           size="small"
           :alt="tab.label"
         />
       </button>
     </div>
   </template>
   ```

   Build `tabs` as a computed off the existing props. Example row for
   map:

   ```ts
   {
     key: 'map',
     icon: 'map',
     fa: false,
     active: props.showingMap,
     visible: true,
     testid: 'testMapViewIcon',
     label: t('casesVue.map_view'),
     emit: () => emit('showMap'),
   }
   ```

   The `scroll` / `image` rows keep `fa: true` **until** the two new
   bespoke SVGs from step 1 land, then flip to `fa: false` and
   `icon: 'feed'` / `icon: 'photo-map'`. If the redraws slip, ship the
   layout change on its own.

3. **Restructure the Work utility bar.** In `src/pages/Work.vue:329-440`,
   replace the current single-row wrap with a 3-cluster grid:

   ```html
   <div
     v-if="!collapsedUtilityBar"
     :key="currentIncidentId"
     class="flex items-center gap-3 w-full p-3"
   >
     <!-- LEFT: view group + count -->
     <div class="flex items-center gap-3 flex-none">
       <WorksiteNavigationIcons … />
       <span
         v-if="allWorksiteCount"
         class="inline-flex items-center gap-1 rounded bg-crisiscleanup-smoke px-2 py-1 text-[13px] font-semibold text-black"
       >
         <span class="text-crisiscleanup-grey-900 font-normal">
           {{ $t('casesVue.cases') }}
         </span>
         <span data-testid="testCaseCountContent">
           {{ numeral(filteredWorksiteCount ?? allWorksiteCount) }}
           <template v-if="filteredWorksiteCount !== allWorksiteCount">
             / {{ numeral(allWorksiteCount) }}
           </template>
         </span>
       </span>
     </div>

     <!-- CENTER: search + location -->
     <div class="flex-1 min-w-0 flex items-center gap-2 pl-3 border-l border-crisiscleanup-grey-100">
       <WorksiteSearchAndFilters … class="flex-1 min-w-0" />
       <base-select … class="w-60 flex-none" />
     </div>

     <!-- RIGHT: actions + refine + collapse -->
     <div class="flex items-center gap-1 flex-none pl-3 border-l border-crisiscleanup-grey-100">
       <WorksiteRefine
         v-if="allWorksiteCount >= 100"
         :svi-value="sviSliderValue"
         :date-value="dateSliderValue"
         :date-from="dateSliderFrom"
         :date-to="dateSliderTo"
         :show-svi="!portal?.attr?.hide_svi_slider"
         @svi="filterSvi"
         @date="filterDates"
       />
       <WorksiteActions … />
       <spinner v-if="downloadingWorksites" size="small" />
       <button
         type="button"
         class="w-8 h-8 grid place-items-center rounded hover:bg-crisiscleanup-smoke transition"
         :aria-label="collapsedUtilityBar ? $t('actions.show_options') : $t('actions.hide_options')"
         data-testid="testCollapseUtilityBarIcon"
         @click="collapsedUtilityBar = !collapsedUtilityBar"
       >
         <font-awesome-icon
           :icon="collapsedUtilityBar ? 'chevron-down' : 'chevron-up'"
         />
       </button>
     </div>
   </div>
   ```

   Keep the `collapsedUtilityBar ? 'w-full' : ''` collapse branch
   untouched — the chevron still renders on its own line when the whole
   bar is collapsed.

4. **Delete** the old standalone sliders block
   (`src/pages/Work.vue:496-537`). They now live inside
   `<WorksiteRefine>`.

5. **Build `WorksiteRefine.vue`** — thin wrapper, no logic, just markup:

   ```vue
   <template>
     <v-popover placement="bottom-end" :auto-hide="false">
       <base-button
         data-testid="testRefineButton"
         variant="text"
         class="text-base font-thin mx-1 flex items-center gap-1"
         ccu-icon="filters"
         icon-size="medium"
         icon-classes="w-4"
         :alt="$t('casesVue.refine')"
       >
         {{ $t('casesVue.refine', 'Refine') }}
       </base-button>
       <template #popper>
         <div class="w-72 p-4 flex flex-col gap-4">
           <div v-if="showSvi">
             <div class="text-[12px] font-bold uppercase tracking-[0.08em] text-crisiscleanup-grey-900 mb-2">
               {{ $t('svi.vulnerability') }}
             </div>
             <Slider … :value="sviValue" @input="v => $emit('svi', v)" />
           </div>
           <div>
             <div class="text-[12px] font-bold uppercase tracking-[0.08em] text-crisiscleanup-grey-900 mb-2">
               {{ $t('casesVue.updated') }}
             </div>
             <Slider … :value="dateValue" @input="v => $emit('date', v)" />
           </div>
         </div>
       </template>
     </v-popover>
   </template>
   ```

6. **Fix the placeholder leak** on the location select
   (`src/pages/Work.vue:394`):

   ```diff
   - :placeholder="$t('casesVue.find_county_city_postal_code')"
   + :placeholder="
   +   $t(
   +     'casesVue.find_county_city_postal_code',
   +     'Find a county, city, or postal code',
   +   )
   + "
   ```

   Same two-arg fallback pattern shipped in the Volunteer-chart polish —
   vue-i18n 9's second positional arg is the default message. Prevents
   the raw key from flashing during portal copy cold-loads.

## Reuse

- `ccu-icon` (`BaseIcon.vue`) — unchanged. Bespoke SVG resolver
  already handles `src/assets/icons/*.svg`; new files drop in.
- `v-popover` from `floating-vue` (already in app bootstrap) — used
  by `WorksiteRefine` exactly like `WorksiteActions` uses it for layers.
- Existing `<Slider>` component — lifted wholesale into `WorksiteRefine`;
  props stay identical.
- Tokens: `primary` (selected background), `crisiscleanup-smoke`
  (pill + hover), `crisiscleanup-grey-100` (divider), `crisiscleanup-grey-900`
  (muted label) — all present in `tailwind.config.cjs`, no new tokens.
- Data-testids: every `testid` currently asserted in specs
  (`testMapViewIcon`, `testTableViewIcon`, `testPhotoMapViewIcon`,
  `testFeedViewIcon`, `testCalendarIcon`, `testCalendarListViewIcon`,
  `testCalendarMapViewIcon`, `testCaseCountContent`,
  `testCaseCountFilteredContent`, `testCollapseUtilityBarIcon`)
  stays on its new host element — no selector churn.

## Verification

- `pnpm dev` at **1440 px**:
  - Utility bar renders as three visually separated clusters with
    thin vertical dividers.
  - Segmented view group: hover on inactive tile fades to smoke;
    selected tile is yellow with black glyph — no grey "filter" tint
    remains.
  - Case count sits right of the group as a smoke pill, not inline
    muted text.
  - Typing in the middle search does not push the location select or
    the right cluster out of row 1.
  - Click the new "Refine" button → popover opens with both sliders
    stacked and labeled (SVI + Updated). Moving them updates the map
    exactly as before.
- `pnpm dev` at **1024 px**:
  - Center cluster truncates cleanly; right cluster stays intact.
  - Sliders no longer pre-empt vertical space beneath the bar — the
    map viewport reclaims ~90 px.
- `pnpm dev` at **390 px** (mobile):
  - `mq.mdMinus` path in `WorksiteActions.vue` is untouched — the three
    white icon-buttons (search / filters / layers) still stack in the
    top-right corner over the map.
- Search with a query that returns < full count → count pill renders
  `{filtered} / {total}`.
- Portal with `hide_svi_slider` toggled true → Refine popover shows
  only the "Updated" slider.
- Cold-load a locale that hasn't cached
  `casesVue.find_county_city_postal_code` — placeholder now shows
  "Find a county, city, or postal code", not the raw key.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e:primary`
  — clean. Existing specs that target
  `testMapViewIcon` / `testCollapseUtilityBarIcon` / etc. still pass.

## Out of scope

- **Full icon-pack swap** (Lucide / Heroicons / Phosphor) — tracker
  principle forbids it; if the bespoke redraw in step 1 slips, ship
  the layout-only portion of this spec and open a dedicated icon-refresh
  track.
- **Filters drawer UX** (`WorksiteFilters.vue` modal) — orthogonal; this
  spec only moves the trigger around.
- **Layers popover content** — unchanged.
- **Mobile Work page top strip** (`v-if="mq.mdMinus"` branch at
  `src/pages/Work.vue:1-325`) — floating-button layout is its own
  problem; this spec is desktop-only.
- **Phone page** — same `WorksiteNavigationIcons` is used there
  (`src/pages/phone/PhoneSystem.vue`), but the phone-page utility bar is
  a different beast (green-phone overlay, tool bar, etc.). Segmented-group
  component drops in cleanly because props stay stable; applying to the
  phone bar is a follow-up.
- **Case-count semantics** (e.g. clicking the pill to clear filters) —
  visual-only here.

## Risks / rollback

- **Risk:** hand-drawn SVG inconsistency — the seven glyphs are the
  visible contract between this page and every operator who uses it.
  Redrawing in isolation without a tracing grid will produce an
  uneven row, which is exactly the problem we're trying to solve. If
  the redraw is going to happen, do it in a single sitting in a vector
  tool, against a shared 24×24 grid, and paste the seven finals in one
  commit. **If in doubt, skip step 1 entirely and keep current icons**
  — layout wins (steps 2–6) still materially improve the page.
- **Risk:** `WorksiteRefine` re-renders on every slider change if
  `Work.vue` passes ref values by reference. Mirror the current
  component's `:value` binding (prop on the inner `<Slider>`s) — the
  wrapper itself holds no state.
- **Risk:** `WorksiteNavigationIcons` is also imported by
  `src/pages/phone/PhoneSystem.vue` indirectly through view-toggle
  buttons. Confirm the phone page still compiles and renders by
  walking `/incident/:id/phone` at 1440 px after the rewrite.
- **Risk:** the kit's vertical-divider rule (`border-l` in a
  `flex items-center` parent) can disappear under Safari's
  background-clip on Retina — verify in Safari TP.
- **Rollback:** all changes are local to four files
  (`WorksiteNavigationIcons.vue`, `Work.vue`, `WorksiteRefine.vue`,
  the six/seven SVG files) plus one string in the location select. Revert
  the commit.
