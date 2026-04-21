# 03 — Sidebar (NavMenu + NavButton)

## Intent

Fit the nav rail into the tighter 96 px column (spec 01), shrink the stacked
icon+label to the kit proportions, and keep the existing **right-edge 5 px
yellow active bar** (already implemented correctly in `NavButton.vue:98-107`
— do not change it). Refresh the logo block and footer so they breathe at the
narrower width.

## Before / After

| Element | Current | Target | Reference |
|---|---|---|---|
| Nav item padding | `px-2 py-2.5` | `px-1.5 py-3` (≈ `6px / 12px`) | `kit.css:23-28` |
| Icon size | `CcuIcon size="xl"` (33 px) | `size="lg"` (≈ 28 px); render at 28×28 | `kit.css:35` |
| Label | `mt-1 text-center` default size | 11 px, `leading-[1.2]`, `text-center`, max 2 lines | `kit.css:23-28` |
| Gap icon→label | default | 4 px | `kit.css:24` |
| Divider | `border-b border-crisiscleanup-dark-400` | *unchanged* | `kit.css:26` |
| Active bg | `bg-crisiscleanup-dark-500` + 5 px right-edge yellow | *unchanged* ✓ | `kit.css:30-34` |
| Active icon recolor | `filter-primary` class | *unchanged* ✓ | `kit.css:37` |
| Hover | `bg-crisiscleanup-dark-500 transition` | *unchanged* ✓ | `kit.css:29` |
| Logo block | `py-4 px-2` with 53 px tall logo | `py-3.5 px-4`, logo ≈ 44–46 px tall | `kit.css:21-22` |
| Footer | `PoweredByAws` / `PoweredByRingCentral` at `pt-4 pb-12 px-4` | same components, compact 10 px text `pt-3.5 pb-6 px-2.5` | `kit.css:38-41` |

## Files to touch

- `src/components/navigation/NavButton.vue`
- `src/components/navigation/NavMenu.vue`
- `src/components/PoweredByAws.vue` / `PoweredByRingCentral.vue` — only if
  their padding/type needs to tighten to match.

## Implementation

1. **NavButton.vue `<style>`:**

   ```diff
   .menu-item {
   -  @apply px-2 py-2.5 border-b border-crisiscleanup-dark-400;
   +  @apply px-1.5 py-3 border-b border-crisiscleanup-dark-400;
   }

   .menu-text {
   -  line-height: 15px;
   +  font-size: 11px;
   +  line-height: 1.2;
     color: white;
     text-decoration: none !important;
   }
   ```

   Inner flex column: keep `flex flex-col items-center relative`; add `gap-1`
   (4 px) so the icon→label gap matches kit.

2. **NavButton.vue `<template>`:** change the icon size.

   ```diff
   - <ccu-icon ... size="xl" v-bind="iconProps" :linked="true" />
   + <ccu-icon ... size="lg" v-bind="iconProps" :linked="true" />
   ```

   Also update the fallback in `iconProps` computed (line 56) from `size: 'xl'`
   → `size: 'lg'`.

3. **NavMenu.vue logo block:**

   ```diff
   - <div class="logo flex justify-center px-2 py-4 border-b border-crisiscleanup-dark-400">
   + <div class="logo flex justify-center px-4 py-3.5 border-b border-crisiscleanup-dark-400">
       <img
         :src="portal?.logo_url || logo"
         :alt="..."
   -     width="133" height="53"
   -     style="height: 53px; width: auto"
   +     width="80" height="46"
   +     style="height: 46px; width: auto"
         data-testid="testCrisiscleanupLogoIcon"
       />
     </div>
   ```

4. **Footer:** keep `PoweredByAws` / `PoweredByRingCentral` components; tighten
   their padding wrapper if needed:

   ```diff
   - <PoweredByAws v-else class="pt-4 pb-12 px-4" type="square" />
   + <PoweredByAws v-else class="pt-3.5 pb-6 px-2.5" type="square" />
   ```

## Reuse

- Existing `filter-primary` utility — handles the active yellow icon recolor,
  no new CSS needed.
- Existing `CcuIcon` component — only changing the `size` prop.
- `theme('colors.crisiscleanup-dark.500')` / `theme('colors.primary.light')` —
  already referenced correctly.

## Verification

- `pnpm dev` → sidebar renders at 96 px (spec 01) with all 8 nav items fitting
  above the fold at 1080 px viewport height.
- Active state: yellow right-edge bar + yellow icon + dark-500 bg.
- Hover state on non-active item: dark-500 bg only, icon stays white.
- Labels like "My Organization" wrap to two lines cleanly; no truncation.
- Logo is readable, centered, not cropped.
- E2E: `testDashboardLink`, `testCasesLink`, etc. — keep existing `data-testid`s;
  no selector changes needed. `pnpm test:e2e:list | grep -i nav` to enumerate.

## Out of scope

- Grid column width (spec 01).
- Mobile slide-over behavior (kept at 150 px).
- `PewPewNavBar.vue` (separate feature; not in the kit).

## Risks / rollback

- **Risk:** `CcuIcon size="lg"` may not exist as a defined token; check
  `src/constants/index.ts` for `ICON_SIZES`. If `lg` maps to something wrong,
  use a custom class or inline `w-7 h-7` on the icon.
- **Risk:** the `filter-primary` utility depends on the active icon still
  being a white SVG — confirm after spec 02's help/bug icons are added (they
  live in header, not sidebar, so unaffected).
- **Rollback:** per-file revert; no state / data changes.
