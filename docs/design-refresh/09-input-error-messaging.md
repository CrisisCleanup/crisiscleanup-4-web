# 09 — Input error & hint messaging (fix placement)

## Intent

Fix a real rendering bug: error messages in `BaseInput.vue` render **beside**
the input instead of below (or above) it. This happens because the outer
wrapper is a flex **row** (`flex justify-start items-center` via
`classes.items-center` when `topLabel` is unset — `BaseInput.vue:2,279`), so
the `<label>` error and the `<input>` + icon containers are all siblings in
the same flex line.

Switch the wrapper to a flex **column** that stacks `[label] [input row]
[hint/error]`, and add a proper `errorMessage` / `hint` API so callers can
surface validation errors beyond the built-in "required + empty" check that
exists today (`BaseInput.vue:3-8`). Apply the same fix to `BaseSelect.vue`
and `BaseRadio.vue`.

## Before / After

| Concern | Current | Target |
|---|---|---|
| Wrapper direction | `flex justify-start items-center` (row) when no `topLabel`; `flex-col items-start` only when `topLabel` present (`BaseInput.vue:278-279`) | **always** `flex flex-col gap-1.5` |
| Error label placement | sibling of `<input>` → renders to the **left/right** of the input | **below** the input row |
| Hint placement | no dedicated hint slot; callers compose externally | **below** the input row (above the error if both) |
| Built-in error text | `$t('info.required')` only, shown when `required && isInvalid && !modelValue` | still the default, but replaced by `errorMessage` prop / `error` slot when provided |
| Error prop | none | `errorMessage?: string \| string[]` |
| Hint prop / slot | none | `hint?: string` + `#hint` slot |
| Error color | `text-crisiscleanup-red-100` | `text-crisiscleanup-red-900` (stronger, matches invalid-border color from spec 05) |
| `BaseSelect` | no error markup at all (`BaseSelect.vue:193` only toggles `isInvalid` state) | same stacked layout: select row + hint/error below |
| `BaseRadio` | no error handling | add optional `errorMessage` prop for form-level errors |

## Files to touch

- `src/components/BaseInput.vue` — primary (template restructure + props).
- `src/components/BaseSelect.vue` — add hint/error block below the Multiselect.
- `src/components/BaseRadio.vue` — add optional error rendering.
- Optionally: `src/components/forms/FormField.vue` if such a wrapper exists
  (grep `grep -rln 'FormField' src/components`; if not, skip — don't create a
  new one for this fix).

## Implementation

1. **BaseInput.vue template restructure:**

   ```diff
   <template>
   -  <div class="flex justify-start relative" :class="classes">
   -    <label
   -      v-if="required && isInvalid && !modelValue"
   -      class="text-xs text-crisiscleanup-red-100"
   -    >
   -      {{ $t('info.required') }}
   -    </label>
   -    <label v-if="topLabel" class="text-xs px-1 text-crisiscleanup-dark-300">
   -      {{ topLabel }}
   -    </label>
   -    <component :is="textArea ? 'textarea' : 'input'" ... />
   -    <div v-if="breakGlass ..." class="icon-container ...">...</div>
   -    <div v-if="faIcon" class="icon-container ...">...</div>
   -    <div v-else-if="icon || tooltip" class="icon-container ...">...</div>
   -    <font-awesome-icon v-if="type === 'password'" .../>
   -  </div>
   +  <div class="ccu-field flex flex-col gap-1.5 relative">
   +    <label
   +      v-if="topLabel"
   +      :for="id"
   +      class="text-[11px] font-bold text-black"
   +    >{{ topLabel }}</label>
   +
   +    <div class="ccu-field__row flex items-center" :class="rowClasses">
   +      <component :is="textArea ? 'textarea' : 'input'" :id="id" ... />
   +      <div v-if="breakGlass ..." class="icon-container ...">...</div>
   +      <div v-if="faIcon" class="icon-container ...">...</div>
   +      <div v-else-if="icon || tooltip" class="icon-container ...">...</div>
   +      <font-awesome-icon v-if="type === 'password'" ... />
   +    </div>
   +
   +    <p
   +      v-if="resolvedError"
   +      class="text-[11px] text-crisiscleanup-red-900"
   +      role="alert"
   +     >{{ resolvedError }}</p>
   +    <p
   +      v-else-if="hint"
   +      class="text-[11px] text-crisiscleanup-grey-900"
   +    >{{ hint }}</p>
   +  </div>
   </template>
   ```

2. **Props (add to `BaseInput.vue` `<script>`):**

   ```ts
   hint:         { type: String, default: '' },
   errorMessage: { type: [String, Array] as PropType<string | string[]>, default: '' },
   ```

3. **Computeds:**

   ```ts
   const resolvedError = computed(() => {
     const custom = Array.isArray(props.errorMessage)
       ? props.errorMessage[0]
       : props.errorMessage;
     if (custom) return custom;
     if (props.required && isInvalid.value && !props.modelValue) {
       return t('info.required');
     }
     return '';
   });
   ```

   Move the old `classes` computed's invalid-border behavior onto a new
   `rowClasses`:

   ```ts
   const rowClasses = computed(() => ({
     'border border-crisiscleanup-red-900': Boolean(resolvedError.value),
     'border border-crisiscleanup-grey-100': !resolvedError.value && !!props.topLabel,
   }));
   ```

   Delete the old `classes` ref (nothing else consumes it after the template
   change).

4. **BaseSelect.vue:** wrap the Multiselect + add the same hint/error block.

   ```html
   <div class="ccu-field flex flex-col gap-1.5">
     <label v-if="topLabel" :for="id" class="text-[11px] font-bold text-black">{{ topLabel }}</label>
     <Multiselect ... />
     <p v-if="resolvedError" class="text-[11px] text-crisiscleanup-red-900" role="alert">{{ resolvedError }}</p>
     <p v-else-if="hint" class="text-[11px] text-crisiscleanup-grey-900">{{ hint }}</p>
   </div>
   ```

   Add the same `hint` + `errorMessage` props and `resolvedError` computed
   (without the "required + empty" builtin — Multiselect doesn't participate
   in native validity).

5. **BaseRadio.vue:** add an optional `errorMessage` prop; render below the
   radio group (not each item). Current file is tiny; augmentation is small.

6. **Migration** — callers that relied on the old behavior:

   ```bash
   grep -rn 'required' src/**/*.vue | grep -i 'base-input' | head
   ```

   The built-in "required + empty" message still works, so most callers need
   no change. Optionally, pass richer errors from validators:

   ```diff
   - <base-input v-model="email" required :placeholder="$t('form.email')" />
   + <base-input
   +   v-model="email"
   +   required
   +   :placeholder="$t('form.email')"
   +   :error-message="emailError"
   +   :hint="$t('form.email_hint')"
   + />
   ```

## Reuse

- Focus-ring and invalid-border styling from spec 05 — this spec depends on
  spec 05 having landed (or ship them together) so the `red-900` invalid
  border color matches the red-900 error text introduced here.
- i18n key `info.required` — already exists; no new translations required
  unless you add new ones for specific fields.

## Verification

Before/after test on any form page (e.g. `/login`):

1. `pnpm dev`, open `/login`.
2. Click submit with empty fields → error text appears **below** each input,
   not beside it. Red border on the input row.
3. With `errorMessage` passed from a validator → same placement, custom text
   wins over the built-in "required" message.
4. Clear the error state → hint (if provided) appears in the same slot in
   grey.
5. Keyboard tab order: label → input → next field. Focus ring from spec 05
   still draws correctly (not broken by the new wrapper).
6. `role="alert"` on the error paragraph → screen readers announce it when it
   appears.
7. `pnpm typecheck` — prop types on new `errorMessage`/`hint` are typed.
8. `pnpm lint` — no new violations.
9. `pnpm test:e2e:primary` — selectors like `data-testid="testBreakGlassButton"`
   still resolve (they're on the icon, unchanged).

## Out of scope

- Form-level error aggregation (e.g. a summary banner at the top of a form).
  If we want one, it's a separate `FormErrorSummary` component.
- Per-field validation rule library — use whatever callers pass in; this spec
  is about *presentation*.
- Async validation states (spinners on fields while validating).
- Touching the `breakGlass` behavior — that prop continues to work as-is.

## Risks / rollback

- **Risk:** callers that relied on the error label sitting **inline** with
  the input (unlikely but possible) will see a visual shift. Audit by
  screenshotting `/login`, `/admin/*` forms before/after.
- **Risk:** a11y — adding `role="alert"` on a paragraph that mounts
  conditionally is correct but chatty. Fine for form errors; don't spread it
  to hints.
- **Risk:** `BaseSelect` has no `isInvalid` integration today
  (`BaseSelect.vue:193` just stores the ref). Surfacing a visual error state
  requires callers to pass `errorMessage` — no behavior regresses from
  today because today there's no error rendering at all.
- **Rollback:** each file's diff is self-contained. Reverting
  `BaseInput.vue` restores the beside-the-input layout; the new props are
  additive and cause no runtime error if left unused.
