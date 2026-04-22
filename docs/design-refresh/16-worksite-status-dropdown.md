# 16 — Worksite status dropdown refresh

## Intent

[`src/components/WorksiteStatusDropdown.vue`](../../src/components/WorksiteStatusDropdown.vue)
is the status badge + popover that every worksite row and the case view use to
switch a work type's status. It predates spec 11 (BaseSelect refresh) and
doesn't participate in the design system yet:

- Trigger uses `rounded-lg` (8 px) — violates the refresh's 2–6 px radius rule.
- Background is `${color}3D` — alpha-hex string concat, bypasses tokens.
- Popper panel has no `shadow-crisiscleanup-card`, no explicit radius, no
  refreshed border color. It reads as its own thing rather than a sibling of
  BaseSelect.
- Chev is a default FA `chevron-down` at library size, not the 12 px
  `crisiscleanup-grey-900` chev spec 11 established.
- Option rows use `ColoredCircle` + plain text with no hover/selected/focus
  language — so keyboard focus is invisible even though a `.selected` class
  toggles.

There are also **two real bugs** that ship regardless of the visual work:

1. `nextItem` is registered via `document.addEventListener('keyup', ...)` in
   `onMounted`. The popover is always mounted, so **arrow keys hijack the
   whole page** whenever this dropdown is on screen, not just when the
   popover is open. It's never removed on unmount.
2. The `.selected` class is toggled but has no matching style rule, so there
   is no visible focus indicator during keyboard nav. Screen readers get no
   `role="listbox"` / `aria-selected` either.

This spec **aligns the dropdown with spec 11's language and fixes both bugs
in the same PR.** Depends on spec 17a for tokenized status colors.

## Before / After

### Trigger

| Concern | Current | Target | Source |
|---|---|---|---|
| Radius | `rounded-lg` (8 px) | `rounded` (4 px) | global radii rule |
| Background | `${getColorForStatus(...)}3D` inline style (hex + alpha) | inline style `background-color: color-mix(in srgb, var(--cc-status-fill) 24%, transparent)` with `--cc-status-fill` bound to the resolved token | spec 17a tokens |
| Text color | `color: getColorForStatus(...)` inline | unchanged (inline style against `--cc-status-fill`) | keeps contrast with tinted background |
| Border | none | `border border-crisiscleanup-grey-100` | spec 11 parity |
| Focus ring | none | `focus-visible:shadow-[0_0_0_2px_rgba(254,206,9,.25)]` + `focus-visible:border-primary-light` | spec 11 parity |
| Chev | FA `chevron-down` at default `sm` | FA `chevron-down` at `text-[12px] text-crisiscleanup-grey-900` | spec 11 parity |
| Min-height | implicit (icon drives it) | `min-h-[40px]` when not in `size="sm"` mode | spec 11 parity |
| Trigger element | `<div>` with `badge-holder` class | `<button type="button">` — focusable by default | spec 11 recipe |

### Popper panel

| Concern | Current | Target | Source |
|---|---|---|---|
| Container | `bg-white border outline-none h-84 w-56 overflow-auto` | `bg-white rounded shadow-crisiscleanup-card border border-crisiscleanup-grey-100 mt-1 overflow-auto max-h-72 w-64` | spec 11 parity |
| Row height | implicit `py-1` | `min-h-[36px] px-3 py-2 text-[14px]` | spec 11 parity |
| Hover | `hover:bg-crisiscleanup-light-grey` | `hover:bg-crisiscleanup-smoke` | spec 11 parity (same token as `optionPointed`) |
| Selected state | `.selected` class with no style | `bg-primary-light text-black font-bold` when `currentItem === status.selectionKey` **and** when `status.status === currentWorkType.status` | spec 11 `optionSelected` |
| Option glyph | `ColoredCircle` at `w-4 h-4` with inline `color` | same component, but `:color` reads from the resolved token via `resolveStatusColors` (spec 17a) | spec 17a |
| A11y root | `<div>` | `role="listbox"` + `aria-activedescendant` pointing at the focused row id | WCAG |
| A11y row | `<div class="cursor-pointer">` with `@click` | `<div role="option" :aria-selected="..." :id="..." tabindex="-1">` | WCAG |

### Keyboard behavior

| Key | Current | Target |
|---|---|---|
| ArrowDown / ArrowUp | `keyup` on `document` moves a `currentItem` counter; nothing visible changes | `keydown` on the panel moves focus / `aria-activedescendant`; the matching row gets `bg-crisiscleanup-smoke` + visible focus ring |
| Enter | no handler | commits the currently-focused option (same as click), then calls `hide()` |
| Escape | closes because floating-vue intercepts | unchanged |
| Listener scope | `document` for the lifetime of the component | attached on popover `show`, detached on popover `hide` |

## Files to touch

- `src/components/WorksiteStatusDropdown.vue` — all changes.
- `src/filters/index.ts` — **no change**; consumers already call
  `getColorForStatus` / `getStatusName`. If spec 17a hasn't merged, this spec
  inlines a local `color-mix` fallback that uses the hex value directly and
  adds a `TODO(17a)` comment.

No other files. This is a single-component refresh by design.

## Implementation

1. **Convert trigger to a `<button>`** and re-shape its classes:

   ```diff
   - <div
   -   class="badge-holder rounded-lg"
   -   data-testid="testCurrentWorkTypeStatusDiv"
   -   :class="size === 'sm' ? 'px-1' : 'px-2'"
   -   :style="dropdownStyle"
   - >
   + <button
   +   type="button"
   +   class="badge-holder rounded border border-crisiscleanup-grey-100
   +          transition focus-visible:border-primary-light
   +          focus-visible:shadow-[0_0_0_2px_rgba(254,206,9,.25)]"
   +   data-testid="testCurrentWorkTypeStatusDiv"
   +   :class="[
   +     size === 'sm' ? 'px-1 min-h-[28px]' : 'px-2 min-h-[40px]',
   +   ]"
   +   :style="triggerStyle"
   + >
   ```

2. **Replace `dropdownStyle` computed** with `triggerStyle` that writes a
   CSS variable for the fill color and uses `color-mix` for the 24% tint:

   ```ts
   const triggerStyle = computed(() => {
     const fill = getColorForStatus(
       props.currentWorkType.status,
       Boolean(props.currentWorkType.claimed_by),
     );
     return {
       '--cc-status-fill': fill,
       color: fill,
       backgroundColor:
         'color-mix(in srgb, var(--cc-status-fill) 24%, transparent)',
     };
   });
   ```

   This preserves the old look pixel-for-pixel (24% alpha of the fill) while
   routing through a CSS var that spec 17a can swap for a token-backed
   resolver without touching this file again.

3. **Refresh the chev** — swap the current `font-awesome-icon` to:

   ```html
   <font-awesome-icon
     icon="chevron-down"
     class="ml-1 text-[12px] text-crisiscleanup-grey-900"
     :alt="$t('actions.select_status')"
   />
   ```

4. **Rewrite the popper panel** wrapper + rows:

   ```diff
   - <div
   -   class="bg-white border outline-none h-84 w-56 overflow-auto tooltip-content"
   -   @keyup="nextItem"
   - >
   + <div
   +   ref="panelRef"
   +   role="listbox"
   +   tabindex="-1"
   +   :aria-activedescendant="`status-opt-${currentItem}`"
   +   class="bg-white rounded shadow-crisiscleanup-card border border-crisiscleanup-grey-100
   +          mt-1 overflow-auto outline-none max-h-72 w-64 tooltip-content"
   +   @keydown="onPanelKeydown"
   + >
     <div
       v-for="status in displayStatuses"
       :key="`${status.id}`"
   +   :id="`status-opt-${status.selectionKey}`"
   +   role="option"
   +   :aria-selected="status.status === currentWorkType.status"
       :data-testid="`testStatus${status.id}Div`"
   -   class="cursor-pointer py-1 hover:bg-crisiscleanup-light-grey"
   -   :class="{ selected: currentItem === status.selectionKey }"
   +   class="cursor-pointer min-h-[36px] px-3 py-2 text-[14px] flex items-center
   +          transition-colors hover:bg-crisiscleanup-smoke"
   +   :class="rowClass(status)"
     >
   ```

   With:

   ```ts
   function rowClass(status) {
     const isSelected = status.status === props.currentWorkType.status;
     const isFocused = currentItem.value === status.selectionKey;
     return [
       isSelected && 'bg-primary-light text-black font-bold',
       isFocused && !isSelected && 'bg-crisiscleanup-smoke',
       isFocused && 'ring-1 ring-primary-light',
     ];
   }
   ```

5. **Fix the keyboard listener** — replace the `document`-level listener:

   ```diff
   - function nextItem(e) {
   -   if (e.keyCode === 38 && currentItem.value > 1) { currentItem.value -= 1; }
   -   else if (e.keyCode === 40 && currentItem.value < displayStatuses.value.length) { currentItem.value += 1; }
   - }
   - onMounted(() => {
   -   document.addEventListener('keyup', nextItem);
   -   nextTick(() => setSVGStyles());
   - });
   + function onPanelKeydown(e: KeyboardEvent) {
   +   if (e.key === 'ArrowDown') {
   +     e.preventDefault();
   +     currentItem.value = Math.min(
   +       currentItem.value + 1,
   +       displayStatuses.value.length,
   +     );
   +   } else if (e.key === 'ArrowUp') {
   +     e.preventDefault();
   +     currentItem.value = Math.max(currentItem.value - 1, 1);
   +   } else if (e.key === 'Enter' || e.key === ' ') {
   +     e.preventDefault();
   +     const picked = displayStatuses.value.find(
   +       (s) => s.selectionKey === currentItem.value,
   +     );
   +     if (picked) {
   +       emit('input', picked.status);
   +       // floating-vue's `hide()` comes from the popper slot prop — see
   +       // template wiring below.
   +       closePanel();
   +     }
   +   }
   + }
   ```

   Route `closePanel` from the popper's `hide` slot prop so the listener
   has a reference without reaching into the global DOM. The listener lives
   on `panelRef`; no `document.addEventListener` anywhere.

6. **Focus the panel on open** — floating-vue `show` event handler:

   ```ts
   function onPopoverShow() {
     nextTick(() => panelRef.value?.focus());
     const current = displayStatuses.value.find(
       (s) => s.status === props.currentWorkType.status,
     );
     currentItem.value = current?.selectionKey ?? 1;
   }
   ```

   Wire `@apply-show="onPopoverShow"` on `<v-popover>`.

7. **Drop `onMounted(() => document.addEventListener(...))` + its cleanup.**
   `nextTick(() => setSVGStyles())` stays.

8. **Delete the empty `<style>` block** (`.status-dropdown {}`). Keep
   `.badge-holder` scoped styles.

9. **Stay on `ColoredCircle`** for option glyphs — no work-type SVG change in
   this spec. (Spec 17b handles the injected `v-html` image.)

## Reuse

- Tokens: `primary-light`, `crisiscleanup-grey-100`, `crisiscleanup-smoke`,
  `shadow-crisiscleanup-card` — all from spec 11 / refresh foundations.
- Spec 17a's `resolveStatusColors` — once merged, replace `getColorForStatus`
  calls in `triggerStyle` with a call that returns both fill and stroke,
  enabling a refined border treatment. If 17a hasn't merged, ship with the
  existing `getColorForStatus` and a `TODO(17a)` comment.
- `@vueform/multiselect` **not** used here — this is a bespoke popover.
  We mirror spec 11's classes rather than importing BaseSelect, because the
  trigger needs to render a work-type SVG, which BaseSelect doesn't know how
  to slot.
- floating-vue's `show` / `hide` events and `hide()` popper slot prop —
  already available, just previously unused.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` clean.
- `pnpm dev` → `/cases` → click the status badge on a row. Trigger shows
  4 px radius, grey-100 border, same tinted background as before. Tab onto
  the trigger → yellow focus ring appears.
- Click to open → panel renders as a shadow-card with 4 px radius and
  grey-100 border. 36 px rows. Current status row is highlighted
  `bg-primary-light` + bold.
- Hover a different row → smoke background, text stays black.
- With panel open, press ArrowDown repeatedly → focus advances one row per
  press, smoke-highlighted. Page arrow-scroll is no longer stolen.
- Press Enter → the focused row's status is committed, panel closes.
- With panel open, focus is on the panel (tab index), `role="listbox"` +
  `aria-activedescendant` move with arrow keys. Verify in the accessibility
  tree via DevTools.
- Close the popover, press ArrowDown elsewhere on the page → scroll works
  normally (confirms the global listener is gone).
- 390 px width: trigger still compact at `min-h-[28px]` when `size="sm"` is
  passed.
- Run the existing `test/unit/components/WorksiteStatusDropdown*` tests if
  any exist; if not, add one that asserts arrow-key navigation moves
  `currentItem`, Enter emits `input`, and no global listener is registered
  (spy on `document.addEventListener`).

## Out of scope

- The work-type SVG image inside the trigger (stays on `v-html` +
  `getWorktypeSVG` — spec 17b's territory).
- Making `BaseSelect` render work-type glyphs so this component could fold
  into it — would need a slot for trigger content; not worth it for one
  consumer.
- Replacing `floating-vue`'s `v-popover` with `BaseSelect`'s dropdown — the
  visual language aligns; the widget stays bespoke.
- The recurrence / `need_*` status filtering in `displayStatuses` — kept
  as-is.
- `size` prop — surface stays the same (empty string or `'sm'`).

## Risks / rollback

- **Risk:** `color-mix(in srgb, …)` isn't supported in the older Safari
  versions the app still nominally claims. Mitigated: the fallback is the
  legacy `${fill}3D` hex concat — keep it as the `background-color` value
  and overlay `color-mix` via a feature-query wrapper:

  ```css
  @supports (background-color: color-mix(in srgb, red 20%, transparent)) {
    .badge-holder { background-color: color-mix(...); }
  }
  ```

  Or simpler: just keep emitting the hex-alpha string for `backgroundColor`
  inline. Same look, same browser matrix. Pick this as the default and skip
  `color-mix` until 17a makes it worth the swap.

- **Risk:** floating-vue's `@apply-show` event name has changed across
  versions. If it doesn't fire, substitute the `show` event (both are on
  the component in v5+). Confirm at implementation time.

- **Risk:** `role="listbox"` plus `aria-activedescendant` confuses some
  screen readers if the active descendant id isn't present in the DOM
  (e.g. during filtering). `displayStatuses` is static per incident phase,
  so this is low-risk, but worth checking with VoiceOver.

- **Risk:** the `.selected` → `bg-primary-light` selected-option color
  overlaps with `triggerStyle`'s yellow tint for `open_unassigned_claimed`
  / `need_unfilled_claimed` (both yellow). Visually fine — the row uses a
  brighter primary-light, the trigger uses the 24% tint — but spot-check
  WCAG contrast between `#fece09` and black.

- **Rollback:** revert the file. No database, no API, no prop changes.
  The trigger's `:style` key name changed from `dropdownStyle` to
  `triggerStyle` — pure rename.
