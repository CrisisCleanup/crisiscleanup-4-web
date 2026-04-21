# 04 — Buttons (BaseButton)

## Intent

Three focused changes to `BaseButton.vue`:

1. Add the **4 px border-radius** that the design kit uses (current buttons
   are square — `BaseButton.vue:191-196` has no radius).
2. Replace the blanket `outline: 0` with a proper `:focus-visible` ring so
   keyboard users can tell what's focused (today's rule kills the focus ring
   entirely — a real a11y bug, not a nit).
3. Promote `danger` to a first-class variant at the CSS layer so callers stop
   relying on the deprecated `type="danger"` prop.

Sizes already match the kit (24/32/50 min-heights, 15/20/34 padding). Don't
retune them.

## Before / After

| Concern | Current | Target | Source |
|---|---|---|---|
| Radius | none | `4px` on base `button` rule | `kit.css:63` |
| Focus | `outline: 0` everywhere | `:focus-visible` → 2 px `primary-light` ring, 2 px offset | a11y baseline |
| Danger variant | only via deprecated `type="danger"` | `button.danger { bg-red-900 border-red-900 text-white }` | `kit.css:73`, `buttons.html:17` |
| Sizes | sm 24 / md 32 / lg 50 min-height | *unchanged* | `BaseButton.vue:278-294` matches `kit.css:64-66` |
| Variants | `solid` / `outline` / `outline-dark` / `text` | *unchanged* + new `danger` | n/a |

## Files to touch

- `src/components/BaseButton.vue` — `<style>` block (lines 190–299) and the
  deprecated `type` prop + `.primary` / `.link` / `.danger` (deprecated block
  lines 202–210 + 137–141 in `<script>`).

## Implementation

1. Add base radius:

   ```diff
   button {
     @apply font-sans;
     cursor: pointer;
   -  outline: 0;
   +  border-radius: 4px;
     transition: all 300ms ease;
   }
   -
   - button:focus {
   -   outline: 0;
   - }
   ```

2. Add focus-visible ring (new rule):

   ```css
   button:focus-visible {
     outline: 2px solid theme('colors.primary.light');
     outline-offset: 2px;
   }
   ```

3. First-class `danger` variant:

   ```css
   button.danger {
     @apply bg-crisiscleanup-red-900 border border-crisiscleanup-red-900 text-white;
   }
   button.danger:hover {
     @apply brightness-95;
   }
   button.danger.disabled {
     @apply bg-crisiscleanup-dark-200 border-crisiscleanup-dark-200 text-gray-100;
   }
   ```

4. Delete the deprecated legacy block once call-sites migrate:

   ```diff
   - /** ----- DEPRECATED ----- */
   - .primary { @apply bg-primary-light; }
   - .link    { @apply text-primary-dark underline underline-offset-2; }
   - /** ----- DEPRECATED ----- */
   ```

   And in `<script>` `styles` computed, drop:

   ```diff
   - primary: props.type === 'primary',
   - danger:  props.type === 'danger',
   - warning: props.type === 'warning',
   - link:    props.type === 'link',
   - bare:    props.type === 'bare',
   ```

   *Keep the `type` prop declaration* for backward compatibility *until* you've
   finished the grep migration below — then drop it too.

5. **Call-site migration** (a grep-and-replace chore, easy to split out):

   ```bash
   # current deprecated usages
   grep -rn 'type="primary"' src/ | wc -l   # → replace with variant="solid"
   grep -rn 'type="danger"'  src/ | wc -l   # → replace with variant="danger"
   grep -rn 'type="link"'    src/ | wc -l   # → replace with variant="text" + custom class
   grep -rn 'type="warning"' src/ | wc -l   # → replace with variant="solid" + yellow explicit
   grep -rn 'type="bare"'    src/ | wc -l   # → replace with variant="text"
   ```

   For each match, swap `type="x"` → the mapped `variant="y"`.

## Reuse

- Token names only — no new utilities.
- `theme()` in postcss works (already used elsewhere in this file).

## Verification

- `pnpm dev` → log in → look at any button (e.g. modal Cancel/OK).
  Buttons have 4 px corners, keyboard focus shows a yellow ring.
- Tab through `/login` → each form control's focus ring is visible.
- Any page with a destructive action (e.g. Unclaim / Delete): `variant="danger"`
  renders red.
- `pnpm lint` — will catch any missed `type="..."` typo if prop is removed.
- `pnpm typecheck` — clean.
- `pnpm test` — existing tests pass (no component test currently exists for
  `BaseButton`; don't add one just for styling).

## Out of scope

- Icon-only button variant (use existing `icon` / `ccuIcon` props; kit
  doesn't define a separate one).
- Loading spinner styling (already handled by `<spinner>` child).
- A `danger-outline` variant — not in the kit; skip until requested.

## Risks / rollback

- **Risk:** removing `outline: 0` may surface unexpected default browser
  outlines on `:focus` (not `:focus-visible`) — the `:focus-visible` rule
  replaces it, but old Safari versions (<15.4) fall back to `:focus`. The app's
  `engines` allows modern browsers; acceptable.
- **Risk:** dropping `type` prop is a breaking change. **Do the call-site
  migration in the same PR** or split into two PRs (styling first, prop
  removal second) with a deprecation console warning between.
- **Rollback:** per-commit revert; sizes and variants are unchanged so callers
  that already use `variant="..."` are unaffected.
