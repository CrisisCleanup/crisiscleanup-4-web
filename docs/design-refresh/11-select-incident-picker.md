# 11 — Select refresh + Incident picker trigger

## Intent

Two linked problems:

1. **BaseSelect looks dated.** It renders `@vueform/multiselect` with mostly
   the library's default "tailwind" theme — tall 48 px rows, dark-grey
   selected-option background (`bg-crisiscleanup-dark-200`), generic chev, no
   focus ring, no card-shadow on the dropdown panel. Every filter, status
   picker, and form select in the app inherits this look.
2. **The design's incident picker** (`kit.css:45-53`, `Header.jsx:7-15`) is
   the template for what a "great" CrisisCleanup select should feel like: a
   bordered row at ~40 px, yellow code pill inline with an icon tile and the
   name, a subtle chev, opens a proper card-styled panel. Spec 02 already
   restructures this in the header; this spec makes the **trigger pattern
   reusable** (any rich-picker surface) and **normalizes BaseSelect's own
   look** to the same family.

Ship this alongside or after spec 05 (inputs) so both share the same focus
ring, border color, and radius.

## Before / After

### BaseSelect (generic)

| Concern | Current | Target | Source |
|---|---|---|---|
| Outer `containerClasses` default | `border relative mx-auto w-full flex items-center justify-end cursor-pointer bg-white text-base leading-snug outline-none` | `border border-[#c0c0c0] rounded bg-white text-[14px] leading-snug outline-none transition focus-within:border-primary-light focus-within:shadow-[0_0_0_2px_rgba(254,206,9,.25)]` | `kit.css:101-107` |
| `wrapperClasses` min-height | `min-h-[theme(spacing.12)]` (48 px) | `min-h-[40px]` | `kit.css:101-103` (9 px + 14 px + 9 px + borders ≈ 40) |
| Padding | mixed — single-label uses `pl-3.5 pr-16` | `px-2.5 py-0` on wrapper; inner search input padding `py-2 px-1` | matches new BaseInput |
| Invalid state | `isInvalid && !modelValue` → `'invalid'` class (no visible styling wired up) | `border-crisiscleanup-red-900` + focus ring stays red | spec 09 integration |
| `optionSelected` class | `text-white bg-crisiscleanup-dark-200` | `bg-primary-light text-black font-bold` | kit selected = yellow accent |
| `optionPointed` (hover) | `text-gray-800 bg-crisiscleanup-dark-100` | `bg-crisiscleanup-smoke text-black` | `kit.css:87` row hover analogue |
| `optionSelectedPointed` | `text-white bg-crisiscleanup-dark-200 opacity-90` | `bg-primary-light text-black font-bold` (same as selected; don't fade) | n/a |
| Dropdown panel | default library styling | `bg-white rounded shadow-crisiscleanup-card border border-crisiscleanup-grey-100 mt-1 overflow-hidden` | kit card signature |
| Option row height | library default (~40 px) | `min-h-[36px] px-3 py-2 text-[14px]` | `CasesTable.jsx` dropdowns feel |
| Caret / chev | `indicatorIcon = 'sort'` | 12 px grey-900 chev-down (FA `chevron-down` at `text-[12px]`) | `kit.css:53` |
| Placeholder | `text-crisiscleanup-dark-400` | `text-crisiscleanup-dark-300` (slightly lighter; match BaseInput placeholder) | `BaseInput.vue` |
| Multi-select tag | `text-xs bg-white py-0.5 pl-2 rounded mr-1 mb-1 ... border border-crisiscleanup-dark-100` | `text-[11px] font-bold bg-crisiscleanup-smoke text-black py-0.5 px-2 rounded-full mr-1 mb-1 border border-crisiscleanup-grey-100` — soft chip | pill family |
| Tag remove "x" | default multiselect icon | small FA `times` at `text-[10px] opacity-60 hover:opacity-100` | clean affordance |

### Incident picker trigger pattern (reusable)

New shared pattern — *not* a new component; a **slot recipe** callers use
when they want the rich trigger look. Document it here; spec 02 uses it in
the header, and anywhere else that needs a "picker that reads as content"
(e.g. the org switcher, a disaster-type filter on reports).

Markup recipe (copy-paste):

```html
<!-- Target: rich bordered trigger (NOT a raw <select>) -->
<button
  type="button"
  class="ccu-picker flex items-center gap-2.5 px-3 py-1.5 rounded
         border border-crisiscleanup-grey-100 bg-white
         min-w-[320px] cursor-pointer
         hover:border-crisiscleanup-grey-500
         focus-visible:border-primary-light
         focus-visible:shadow-[0_0_0_2px_rgba(254,206,9,.25)]
         transition"
>
  <!-- 36 px icon tile -->
  <div class="w-9 h-9 flex-none grid place-items-center
              rounded bg-crisiscleanup-smoke">
    <DisasterIcon :icon="incident.icon" class="w-7 h-7" />
  </div>

  <!-- code pill (yellow) -->
  <BasePill variant="incident">{{ incident.code }}</BasePill>

  <!-- name grows -->
  <span class="flex-1 font-bold text-[13px] truncate">
    {{ incident.name }}
  </span>

  <!-- chev -->
  <font-awesome-icon
    icon="chevron-down"
    class="text-crisiscleanup-grey-900 text-[12px]"
  />
</button>
```

Key rules:

- The trigger is a `<button>`, not a `<div>`, so it's focusable by default.
- `min-w-[320px]` is a **minimum**, not a max — let the name grow the row.
- The inner icon tile is `bg-crisiscleanup-smoke` with a 4 px radius — it
  visually echoes the dropdown cards so the picker reads as a compact
  preview of the selected row.
- Keyboard: wire `@click` to open a floating panel; inside the panel, reuse
  the refreshed BaseSelect or a `BaseListbox` — whichever the caller already
  has. This spec doesn't mandate the panel implementation, only the trigger's
  look.

Reference the pill `incident` variant from spec 06. If spec 06 isn't merged
yet, inline the pill classes: `bg-primary-light text-black text-[11px]
font-bold px-1.5 py-0.5 rounded-sm`.

## Files to touch

- `src/components/BaseSelect.vue`
  - `containerClasses` / `wrapperClasses` defaults.
  - `multiSelectClasses` computed (option, tag, placeholder classes).
  - `indicatorIcon` default → custom FA chev (override the slot).
  - `<style>` block (lines 399–415): replace the minimal overrides with a
    full refresh targeting `@vueform/multiselect`'s classes.
- **No changes** to the library itself or the theme import at
  `BaseSelect.vue:397` — override via specificity, don't eject the theme.
- `src/components/header/Header.vue` — adopts the trigger recipe per
  spec 02 (already scheduled). This spec only adds the recipe to the
  playbook; no new files here.
- Optional: extract the recipe into a `BasePickerTrigger.vue` once a second
  surface needs it. Don't pre-build — YAGNI.

## Implementation

1. **Re-theme BaseSelect defaults** — swap the two classes strings:

   ```diff
   - default:
   -   'border relative mx-auto w-full flex items-center justify-end cursor-pointer bg-white text-base leading-snug outline-none',
   + default:
   +   'relative mx-auto w-full flex items-center justify-end cursor-pointer bg-white text-[14px] leading-snug outline-none rounded border border-[#c0c0c0] transition focus-within:border-primary-light focus-within:shadow-[0_0_0_2px_rgba(254,206,9,.25)]',
   ```

   ```diff
   - default:
   -   'relative mx-auto w-full flex items-center justify-end box-border cursor-pointer outline-none min-h-[theme(spacing.12)]',
   + default:
   +   'relative mx-auto w-full flex items-center justify-end box-border cursor-pointer outline-none min-h-[40px]',
   ```

2. **Option styling** in `multiSelectClasses` computed:

   ```diff
   - optionSelected: 'text-white bg-crisiscleanup-dark-200',
   - optionPointed: 'text-gray-800 bg-crisiscleanup-dark-100',
   - optionSelectedPointed:
   -   'text-white bg-crisiscleanup-dark-200 opacity-90',
   + optionSelected: 'bg-primary-light text-black font-bold',
   + optionPointed: 'bg-crisiscleanup-smoke text-black',
   + optionSelectedPointed: 'bg-primary-light text-black font-bold',
   ```

3. **Global overrides** in `<style>` — extend the existing bottom block:

   ```css
   /* Dropdown panel as a card */
   .multiselect-dropdown {
     @apply z-header bg-white rounded shadow-crisiscleanup-card
            border border-crisiscleanup-grey-100 mt-1 overflow-hidden;
   }

   /* Option rows */
   .multiselect-option {
     @apply min-h-[36px] px-3 py-2 text-[14px];
   }

   .multiselect-placeholder {
     @apply text-crisiscleanup-dark-300;
   }

   /* Tag chips (multi) */
   .multiselect-tag {
     @apply text-[11px] font-bold bg-crisiscleanup-smoke text-black
            py-0.5 px-2 rounded-full mr-1 mb-1
            border border-crisiscleanup-grey-100;
   }
   .multiselect-tag-remove {
     @apply opacity-60 hover:opacity-100 ml-1;
   }

   /* Invalid (wired from `isInvalid && !modelValue` class 'invalid') */
   .form-select.invalid {
     @apply border-crisiscleanup-red-900;
   }
   .form-select.invalid:focus-within {
     box-shadow: 0 0 0 2px rgba(206, 0, 0, 0.2);
   }

   /* Caret: library renders .multiselect-caret — scope it */
   .multiselect-caret {
     color: theme('colors.crisiscleanup-grey.900');
     width: 12px !important; height: 12px !important;
   }
   ```

   These target the real class names shipped by `@vueform/multiselect` — keep
   them in an unscoped `<style>` (the file already uses one), because
   scoped styles won't reach the library's DOM.

4. **Replace the "sort" indicator** — either:
   - keep `indicatorIcon="sort"` but style via `.multiselect-caret` CSS, or
   - override the library's `caret` slot at the BaseSelect template level:

   ```vue
   <template #caret>
     <font-awesome-icon
       icon="chevron-down"
       class="text-crisiscleanup-grey-900 text-[12px] mr-3"
     />
   </template>
   ```

   Prefer the slot override if the library supports it (check
   `@vueform/multiselect` docs); it's cleaner than fighting the default icon.

5. **Document the incident-picker trigger recipe** as a copy-paste block at
   the top of `BaseSelect.vue` in a `<!-- usage -->` comment, *or* add a
   Storybook-ish section to `docs/design-refresh/` (skip unless there's
   already a docs site). Simpler: leave the recipe in this spec file and
   let spec 02 be the first consumer.

## Reuse

- All tokens already exist: `primary-light`, `crisiscleanup-grey-100/500/900`,
  `crisiscleanup-smoke`, `crisiscleanup-red-900`, `shadow-crisiscleanup-card`.
- `BasePill variant="incident"` from spec 06 — the yellow code pill.
- `DisasterIcon.vue` — unchanged, wrapped in the 36 px tile.
- `@vueform/multiselect` slot API — use it; don't fork the library.

## Verification

- `pnpm dev` → visit any page with a filter dropdown (`/cases`,
  `/phone` call filter, any admin list). The select renders with 4 px radius,
  grey-100 border, yellow focus ring on click/tab. Dropdown panel opens as a
  shadow-card with white bg and 4 px radius.
- Hover an option → smoke background, text stays black (no white-on-dark
  inversion).
- Select an option → yellow primary-light background, black text, bold weight.
- Multi-select: tags appear as soft smoke chips with a clean "×" affordance.
- Tab into the select → focus ring visible. Tab out → ring clears.
- Invalid state (pass an `errorMessage` from spec 09, or trigger
  `required && !modelValue`) → border flips to red-900; error text renders
  below the select per spec 09.
- **Incident picker** (after spec 02 ships): the trigger in the header
  matches the recipe — icon tile + yellow code pill + name + chev — and
  clicking it opens the panel.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` — clean.

## Out of scope

- Replacing `@vueform/multiselect` with another library.
- Building `BasePickerTrigger.vue` as a shared component (wait for a second
  consumer).
- Virtualized / async option loading UX beyond what the library already
  offers (the `isAsync` plumbing stays as-is).
- The floating-label mode (`floatLabel` prop) — kept working; this spec
  doesn't change its positioning math.

## Risks / rollback

- **Risk:** overriding library CSS without `!important` can lose to the
  theme's specificity. Test each rule; add `!important` sparingly only where
  the theme's selector beats ours (check with DevTools).
- **Risk:** the `optionSelected` yellow background drops contrast for the
  check-mark glyph (if the library shows one). Verify WCAG AA on sample
  options; fall back to bold-only if contrast fails.
- **Risk:** the `shadow-crisiscleanup-card` on the dropdown panel can clip
  on short viewports near the screen bottom. If `openDirection="top"` is
  forced, the shadow flips naturally — confirm manually.
- **Rollback:** this spec is pure cosmetic; revert the template class
  strings and the `<style>` additions to restore the current look. No API
  changes, no prop removals.
