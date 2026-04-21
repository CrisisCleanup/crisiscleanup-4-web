# 05 — Inputs & forms

## Intent

Give `BaseInput`, `BaseSelect`, and native form controls the kit's clean look:
**4 px radius, uniform grey border, yellow focus ring**. Today the inputs are
square (`border-radius: 0` — `BaseInput.vue:384,393,398`) with no focus
state, which looks visually louder and is an a11y regression for keyboard
users.

## Before / After

| Concern | Current | Target | Source |
|---|---|---|---|
| Input radius | `border-radius: 0` explicit | `4px` | `kit.css:101-103` |
| Input border | `@apply border` → theme default | `1px solid #c0c0c0` | `form-fields.html:9` |
| Input focus | none (just `outline: none`) | `border-color: primary-light` + `box-shadow: 0 0 0 2px rgba(254,206,9,.25)` | `kit.css:105-107` |
| Invalid state | `border border-crisiscleanup-red-100` | `border-crisiscleanup-red-900` + red hint | `form-fields.html:12-13` |
| Padding (default) | height-based sizes | `9px 10px` on the inner input | `kit.css:101-103` |
| Text size | 14 px-ish | `14px` explicit | `kit.css:102` |
| Label | component-defined | 11–12 px / `font-bold` above input, 6 px gap | `form-fields.html:8` |
| Hint | component-defined | 11 px `crisiscleanup-grey-900` | `form-fields.html:11` |
| Checkbox | native default | `accent-color: var(--cc-primary-dark)` | `form-fields.html:15` |
| BaseSelect trigger | Multiselect raw | match BaseInput: 4 px radius, grey border, yellow focus ring | inferred |

## Files to touch

- `src/components/BaseInput.vue` — `<style>` around lines 380–442 and the
  label/hint markup in `<template>`.
- `src/components/BaseSelect.vue` — pass focus-ring classes through to the
  `multiselect__tags` wrapper.
- `src/components/BaseRadio.vue` — confirm `accent-color` or custom pseudo
  currently uses `primary-dark`; update if not.
- A global checkbox rule isn't needed — `accent-color` via a shared layer
  rule on `src/style.css` works.

## Implementation

1. **BaseInput.vue** — remove the zero-radius and add a shared input rule:

   ```diff
   input {
     outline: none;
     width: var(--width);
     height: var(--height);
   - border-radius: 0;
   - @apply border;
   + border-radius: 4px;
   + border: 1px solid #c0c0c0;
     -webkit-appearance: none;
     opacity: 1;
   + padding: 9px 10px;
   + transition: border-color 200ms ease, box-shadow 200ms ease;
   }

   textarea {
     outline: none;
   - @apply border;
   - border-radius: 0;
   + border: 1px solid #c0c0c0;
   + border-radius: 4px;
   + padding: 9px 10px;
   }

   input:not([type='radio']):not([type='checkbox']) {
     -webkit-appearance: none;
   - border-radius: 0;
   + border-radius: 4px;
   }

   + input:focus,
   + textarea:focus {
   +   border-color: theme('colors.primary.light');
   +   box-shadow: 0 0 0 2px rgba(254, 206, 9, 0.25);
   + }
   ```

2. **Invalid state** — strengthen to `red-900`:

   ```diff
   textarea.invalid {
   -  @apply border border-crisiscleanup-red-100;
   +  @apply border border-crisiscleanup-red-900;
   }
   ```

   Add the same for `input.invalid` if it doesn't exist.

3. **Label + hint markup** — confirm `<template>` renders:

   ```html
   <label class="text-[11px] font-bold text-black mb-1.5">{{ label }}</label>
   <input ... />
   <p v-if="hint" class="text-[11px] text-crisiscleanup-grey-900 mt-1">{{ hint }}</p>
   <p v-if="errorMessage" class="text-[11px] text-crisiscleanup-red-900 mt-1">{{ errorMessage }}</p>
   ```

   Adapt to whatever slots/props `BaseInput` already exposes — don't break
   consumer API.

4. **Checkbox accent** — add to `src/style.css`:

   ```css
   input[type='checkbox'] {
     accent-color: theme('colors.primary.DEFAULT');
   }
   ```

   If `primary.DEFAULT` isn't defined, use `theme('colors.primary.dark')` (matches
   `form-fields.html:15`).

5. **BaseSelect.vue** — on the outer `.multiselect__tags` wrapper add:

   ```
   rounded border border-[#c0c0c0] transition
   focus-within:border-primary-light
   focus-within:shadow-[0_0_0_2px_rgba(254,206,9,.25)]
   ```

   This inherits the new input ring without touching the Multiselect internals.

6. **BaseRadio.vue** — ensure the `::after` filled-dot color uses
   `primary-dark` (current repo may already do this; verify only).

## Reuse

- Existing size presets (`xlarge` / `large` / `medium` / `small`) — untouched.
- `icon-container` rule — keep; but align its border-radius to `4px 0 0 4px`
  when it sits on the *left* of the input and `0 4px 4px 0` on the right,
  so the composite control doesn't have one square side. Today all corners
  are square; this is a visual consequence of step 1.
- Token names `crisiscleanup-red-900`, `crisiscleanup-grey-900`, `primary.light`,
  `primary.dark` — all already in `tailwind.config.cjs`.

## Verification

- `pnpm dev` → `/login`. Email / password inputs show 4 px corners and yellow
  focus ring when clicked or tabbed into.
- Trigger a form error (empty required field) → border flips to `red-900`,
  hint turns red.
- Any page with a `BaseSelect` (e.g. filter dropdowns on `/cases`): opening
  and focusing shows the same yellow ring on the trigger.
- Native `<input type="checkbox">` anywhere — checked color is primary
  yellow/orange, not browser default blue.
- `pnpm lint` + `pnpm typecheck` clean.

## Out of scope

- Multiselect list item styling (panel, tags inside) — kit doesn't mockup.
- Datepicker (`@vuepic/vue-datepicker`) visuals — theme override is a separate
  task.
- Inline validation UX changes beyond the color swap.

## Risks / rollback

- **Risk:** `icon-container` compound controls look mismatched if only the
  input gets corners. Address in the same commit by tweaking the container's
  `border-radius` to match the composite (step 6 of Reuse).
- **Risk:** `padding: 9px 10px` may shift vertical rhythm inside dense forms.
  If any form breaks layout, fall back to sized classes keeping the new padding
  but removing the explicit `height: 60px/50px/...` on that class (the padding
  + line-height will compute a slightly smaller but acceptable height).
- **Rollback:** single-file revert for `BaseInput.vue`; `BaseSelect.vue` and
  `src/style.css` changes are independently revertable.
