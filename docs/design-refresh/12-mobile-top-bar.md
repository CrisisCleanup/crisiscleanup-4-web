# 12 — Mobile top bar

## Intent

The mobile (≤ md, 767 px) layout has no real top chrome today. The only
"header" affordance is a **floating `DisasterIcon`** pinned at
`fixed left-4 top-4 z-disaster-icon` (`src/layouts/Authenticated.vue:6-12`)
that opens an incident-selection dialog on tap. Because it's floating, it:

- overlaps table/list headers, map control layers, and the first tappable
  row of most pages,
- has no label — only regular users recognize the icon as a control,
- leaves no room for a user menu / logout, which is currently buried in the
  bottom-tab "More" sheet.

Replace it with a **fixed 48 px top bar** that houses a compact incident-picker
trigger (tile + code pill + name + chev — same recipe as spec 02) plus a
single trailing overflow button for user/logout links. The trigger still
opens the existing `showIncidentSelectionModal`; the overflow button still
opens `showingMoreLinks`. No new dialogs, no new state.

Keep the fixed bottom tab navigation as-is.

## Before / After

| Concern | Current | Target |
|---|---|---|
| Top chrome | floating `DisasterIcon` at `fixed left-4 top-4` | fixed bar at `inset-x-0 top-0 h-12` |
| Z-stack | `z-disaster-icon` over content | `z-header`, content flows under |
| Incident trigger | tap the floating icon (no text) | tap the whole bar row: 28 px tile + yellow `case_label` pill + truncated `name` + `chevron-down` |
| Overflow / menu | hidden until user taps bottom-tab "More" | trailing 32 px icon-button → opens the same `showingMoreLinks` modal (logout + links + download CTA) |
| Content offset | none — content starts at y=0 and is covered by the icon | mobile `<main>` gets `pt-12` to clear the fixed bar |
| Phone indicator | not shown on mobile | unchanged — still not shown |
| Bottom tab nav | fixed bottom, unchanged | unchanged |

## Files to touch

- `src/layouts/Authenticated.vue` — mobile branch only (`v-if="mq.mdMinus"`).
  Delete the floating `DisasterIcon` block, insert the new fixed header
  markup, bump the `<main>` wrapper padding-top.
- No new component files. Reuses `DisasterIcon.vue`,
  `showIncidentSelectionModal`, `showingMoreLinks` modal as-is.

## Implementation

1. **Remove** the floating icon (current lines 6–12):

   ```diff
   - <DisasterIcon
   -   v-if="currentIncident && currentIncident.incidentImage"
   -   :current-incident="currentIncident"
   -   data-testid="testDisasterIcon"
   -   class="fixed left-4 top-4 z-disaster-icon"
   -   @click="showIncidentSelectionModal"
   - />
   ```

2. **Insert** the fixed header as the first child of the `<div class="flex
   flex-col">` wrapper inside the mobile branch:

   ```html
   <header
     class="fixed inset-x-0 top-0 h-12 z-header bg-white border-b
            border-crisiscleanup-grey-100 flex items-center px-3 gap-2"
     data-testid="testMobileHeader"
   >
     <button
       type="button"
       class="flex-1 min-w-0 flex items-center gap-2 px-2 py-1 rounded
              hover:bg-crisiscleanup-smoke transition"
       :aria-label="$t('locationVue.select_incident')"
       data-testid="testMobileIncidentTrigger"
       @click="showIncidentSelectionModal"
     >
       <div
         class="incident-tile w-7 h-7 flex-none grid place-items-center
                rounded bg-crisiscleanup-smoke overflow-hidden"
       >
         <DisasterIcon
           v-if="currentIncident?.incident_type"
           :current-incident="currentIncident"
           data-testid="testDisasterIcon"
         />
       </div>
       <span
         v-if="currentIncident?.case_label"
         class="bg-primary-light text-black text-[11px] font-bold
                px-1.5 py-0.5 rounded-sm flex-none"
       >
         {{ currentIncident.case_label }}
       </span>
       <span class="flex-1 min-w-0 truncate font-bold text-[13px] text-left">
         {{ currentIncident?.name }}
       </span>
       <font-awesome-icon
         icon="chevron-down"
         class="text-crisiscleanup-grey-900 text-[12px] flex-none"
       />
     </button>
     <button
       type="button"
       class="w-8 h-8 flex-none grid place-items-center rounded
              hover:bg-crisiscleanup-smoke transition"
       :aria-label="$t('nav.more')"
       data-testid="testMobileOverflow"
       @click="showingMoreLinks = true"
     >
       <font-awesome-icon icon="ellipsis-vertical" />
     </button>
   </header>
   ```

3. **Clear the fixed bar** from content:

   ```diff
   - <main>
   + <main class="pt-12 pb-16">
       <slot />
     </main>
   ```

   `pb-16` keeps the existing bottom-tab clearance explicit (currently pages
   rely on intrinsic height — safer to make it declarative now that the top
   has its own clearance).

4. **Scale the DisasterIcon** inside the 28 px tile so the default
   `w-10 h-10` glyph doesn't overflow. Add to the layout's `<style scoped>`
   (same pattern spec 02 used in `Header.vue`):

   ```css
   .incident-tile :deep(.standard-icon),
   .incident-tile :deep(.easter-egg) {
     width: 22px;
     height: 22px;
   }
   .incident-tile :deep(.disaster-icon) {
     display: flex;
     align-items: center;
     justify-content: center;
   }
   ```

5. **Preserve the testid** (`testDisasterIcon`) — e2e tests may depend on
   it. It stays on the icon, just relocated from the floating container to
   the header trigger.

## Reuse

- `DisasterIcon.vue` — unchanged.
- `showIncidentSelectionModal()` — unchanged; already wired to
  `useDialogs().selection` with the incident list.
- `showingMoreLinks` modal block at lines 41–64 — unchanged; the bottom tab
  "More" entry also triggers it. Two entry points are fine.
- Kit trigger recipe (icon tile + yellow pill + name + chev) from
  spec 02 / spec 11.
- Tokens already in the palette: `crisiscleanup-smoke`,
  `crisiscleanup-grey-100`, `crisiscleanup-grey-900`, `primary-light`.

## Verification

- `pnpm dev`, Chrome DevTools responsive mode at **iPhone 12 / 390 px**:
  - Top bar renders as a 48 px white row with smoke tile + yellow pill +
    truncated incident name + chev.
  - Scrolling: bar stays fixed; first row of page content is visible
    immediately under it (no overlap).
  - Tap the bar → existing incident selection dialog opens. Pick a
    different incident → name/pill update in-place.
  - Tap the ⋮ button → "more links" modal opens. Logout works.
- Rotate to landscape on small phones — name truncates cleanly; pill never
  collides with the chev.
- Visit `/dashboard`, `/cases`, `/phone`, any admin page — no content is
  clipped, no per-page `mt-*` elements double up with the new `pt-12`.
- Desktop (≥ md) path untouched — `pnpm dev` at 1440 px still shows the
  full `Header.vue` chrome from spec 02.
- `pnpm lint`, `pnpm typecheck`, `pnpm test:e2e:primary` — clean.
  `testDisasterIcon` selector still resolves.

## Out of scope

- Mobile phone indicator / call pill — mobile UX doesn't expose the agent
  dashboard today; deferred.
- Turning the bottom tab into a full drawer / rethinking "More" — the
  overflow button in the new top bar opens the existing modal; a broader
  nav rework is its own track.
- Mobile-specific incident selection UI (bottom sheet vs. centered modal)
  — keep `selection()` dialog behavior as-is.
- Help / bug icons on the top bar — mobile surface is space-constrained;
  surface them through the overflow modal if demand appears.

## Risks / rollback

- **Risk:** adding `pt-12` globally to the mobile `<main>` may double up
  with pages that already render their own top-offset hero (e.g.
  `src/pages/Dashboard.vue`, `src/pages/Work.vue`). Walk each hotspot
  manually; adjust per-page if needed rather than dropping the header
  clearance.
- **Risk:** `showIncidentSelectionModal` uses a centered dialog via
  `useDialogs().selection` — on iOS Safari the fixed header underlaps the
  modal backdrop. Confirm the backdrop's `z-modal-mask` still wins (it does
  in the current z-scale — `z-header` < `z-modal-mask`).
- **Risk:** e2e specs that scroll to `testDisasterIcon` may have relied on
  it being absolutely-positioned at `(16, 16)`. Update any such specs.
- **Rollback:** revert `src/layouts/Authenticated.vue` only — the change
  is entirely local to the mobile branch; desktop is untouched.
