# 17a — Work-type status palette → tokens

## Intent

The 20-entry `colors` record in [`src/icons/icons_templates.ts`](../../src/icons/icons_templates.ts)
is the canonical source of truth for every work-type status color in the app —
map markers, the worksite legend, `WorksiteStatusDropdown`, `getColorForStatus`,
`getColorForWorkType`. Its hex values were hand-picked years ago and don't
participate in the design system:

- Legacy reds/yellows/greens don't line up with the refreshed
  `crisiscleanup-red-*` / `crisiscleanup-yellow-*` / `crisiscleanup-green-*`
  ramps already in [`tailwind.config.cjs`](../../tailwind.config.cjs).
- Because the palette lives in a TS literal imported by `filters/index.ts`,
  consumers can't compose it with Tailwind utilities. The status dropdown
  resorts to `${color}3D` alpha-hex concatenation; the work-type icon pipeline
  resorts to `replaceAll('{{fillColor}}', ...)` over an SVG string.
- There's no dark-mode hook, no invalid/disabled variant, and no way to
  override per-incident.

This spec **moves the palette to design tokens and stops other code from
hard-coding `#…` hexes for status colors.** No visual change on its own — it
unblocks spec 16 (status dropdown refresh) and spec 17b (flatten work-type
icon shadow/radius) from landing without re-introducing the legacy hexes.

## Before / After

### Color definitions

| Concern | Current | Target | Source |
|---|---|---|---|
| Palette location | 138-line object literal at the top of `src/icons/icons_templates.ts` | `theme.extend.colors['cc-status']` in `tailwind.config.cjs` **plus** matching `--cc-status-*` CSS vars on `:root` in `src/style.css` | tokens track the refreshed ramps |
| Key shape | `${status}_${claimed \| unclaimed}` (20 keys) | Same key shape, preserved — token names: `cc-status-<status>-<claimed\|unclaimed>-{fill,stroke}` | keeps `getColorForStatus` signature identical |
| Unknown fallback | Object-key miss → `colors.open_assigned_unclaimed` in two places, silent failure in a third | Single `resolveStatusColors(status, claimed)` helper that returns `{ fill, stroke }` from the token map with an explicit fallback | one path, one log if miss |
| Alpha / tint access | Ad-hoc: `${fillColor}3D` string concat in `WorksiteStatusDropdown.vue:144` | `color-mix(in srgb, var(--cc-status-fill) 24%, transparent)` driven from the same CSS var | token-native tint |
| Consumers | 4 files import `colors` from `icons_templates.ts` | 0 files import the palette directly; all go through `resolveStatusColors` or the `--cc-status-*` CSS var | blocks re-introduction of legacy hexes |

### Concrete hex → token mapping (proposed)

For each status × claimed combination the current hex maps to an existing
ramp step. **Proposed mapping** — verify each against the kit reference during
implementation; adjust a step up/down where the eye disagrees:

| status key | current fill | proposed token | current stroke | proposed stroke token |
|---|---|---|---|---|
| `open_unassigned_unclaimed` | `#d0021b` | `crisiscleanup-red-900` | `#e30001` | `crisiscleanup-red-800` |
| `open_unassigned_claimed` | `#fab92e` | `crisiscleanup-yellow-700` | `#f79820` | `crisiscleanup-yellow-800` |
| `open_assigned_unclaimed` | `#d0021b` | `crisiscleanup-red-900` | `#e30001` | `crisiscleanup-red-800` |
| `open_assigned_claimed` | `#f0f032` | `crisiscleanup-yellow-200` | `#85863f` | `crisiscleanup-yellow-900` |
| `open_partially-completed_unclaimed` | `#d0021b` | `crisiscleanup-red-900` | `#e30001` | `crisiscleanup-red-800` |
| `open_partially-completed_claimed` | `#0054bb` | `crisiscleanup-dashboard-blue` | `#0054bb` | `crisiscleanup-dashboard-blue` |
| `open_needs-follow-up_unclaimed` | `#d0021b` | `crisiscleanup-red-900` | `#e30001` | `crisiscleanup-red-800` |
| `open_needs-follow-up_claimed` | `#ea51eb` | **new** `cc-status-follow-up` = `#ea51eb` | `#e018e1` | **new** `cc-status-follow-up-dark` = `#e018e1` |
| `open_unresponsive_*` | `#7F7F7F` / `#5d5d5d` | `crisiscleanup-dark-300` / `crisiscleanup-dark-400` | same | same |
| `closed_completed_*` | `#0FA355` | `crisiscleanup-phone-green` | `#09a34f` | `crisiscleanup-phone-green` |
| `closed_incomplete_*` / `closed_done-by-others_*` / `closed_no-help-wanted_*` / `closed_partially-completed_*` / `closed_duplicate_claimed` | `#82D78C` | **new** `cc-status-soft-green` = `#82D78C` | same | same |
| `closed_out-of-scope_*` / `closed_marked-for-deletion_*` / `closed_rejected_*` / `closed_duplicate_unclaimed` | `#7F7F7F` / `#5d5d5d` | `crisiscleanup-dark-300` / `crisiscleanup-dark-400` | same | same |
| `need_unfilled_unclaimed` | `#d0021b` | `crisiscleanup-red-900` | `#e30001` | `crisiscleanup-red-800` |
| `need_unfilled_claimed` | `#fab92e` | `crisiscleanup-yellow-700` | `#f79820` | `crisiscleanup-yellow-800` |
| `need_filled_*` | `#82D78C` | `cc-status-soft-green` | same | same |
| `need_overdue_unclaimed` | `#d0021b` | `crisiscleanup-red-900` | `#e30001` | `crisiscleanup-red-800` |
| `need_overdue_claimed` | `#ea51eb` | `cc-status-follow-up` | `#e018e1` | `cc-status-follow-up-dark` |

Two status colors have no existing ramp step and need new tokens:
`cc-status-follow-up` (magenta for needs-follow-up claimed / need-overdue
claimed) and `cc-status-soft-green` (muted green for the "closed without full
resolution" family). Both are kept as single-value tokens — not full ramps —
since no caller needs shades.

## Files to touch

- `tailwind.config.cjs` — add the two new single-value tokens; no ramp changes.
- `src/style.css` — add a `:root` block of `--cc-status-*-{fill,stroke}` CSS
  custom properties, one per of the 20 status keys. Values reference the
  Tailwind tokens via literal hex (runtime CSS can't call `theme()`); keep a
  short comment pointing at `tailwind.config.cjs` for the source of truth.
- `src/icons/icons_templates.ts` — **keep the `colors` export** for now (too
  many callers to migrate in one PR) but rewrite its values to read from the
  CSS vars at import time via a tiny helper. Export a new `resolveStatusColors`
  function that both the runtime SVG templating and future token consumers
  call.
- `src/filters/index.ts` — `getColorForStatus` and `getColorForWorkType` route
  through `resolveStatusColors` instead of indexing `iconColors` directly.
  Signature unchanged.
- `src/hooks/worksite/useWorktypeImages.ts` — `getWorktypeColors` routes
  through `resolveStatusColors`.
- No template-string edits inside `icons_templates.ts` (the `{{fillColor}}` /
  `{{strokeColor}}` placeholders still work — that's 17b's problem, not this
  spec's).

## Implementation

1. **Add tokens** in `tailwind.config.cjs` under `theme.extend.colors`:

   ```js
   'cc-status-follow-up':      '#ea51eb',
   'cc-status-follow-up-dark': '#e018e1',
   'cc-status-soft-green':     '#82D78C',
   ```

2. **Emit CSS vars** — append a `:root` block in `src/style.css`:

   ```css
   :root {
     /* Status palette — keep in sync with
        src/icons/icons_templates.ts::colors and tailwind.config.cjs */
     --cc-status-open-unassigned-unclaimed-fill: theme('colors.crisiscleanup-red.900');
     --cc-status-open-unassigned-unclaimed-stroke: theme('colors.crisiscleanup-red.800');
     /* … 19 more pairs … */
   }
   ```

   Use the PostCSS `theme()` helper (already in the pipeline via
   `postcss.config.ts`) so tokens resolve at build time.

3. **Add `resolveStatusColors`** in `src/icons/icons_templates.ts`:

   ```ts
   export function resolveStatusColors(
     status: string,
     claimed: boolean,
   ): { fill: string; stroke: string } {
     const key = `${status}_${claimed ? 'claimed' : 'unclaimed'}`;
     const entry = colors[key] ?? colors.open_unassigned_unclaimed;
     return { fill: entry.fillColor, stroke: entry.strokeColor };
   }
   ```

   Rewrite the 20-entry `colors` literal so each entry's values are
   `getComputedStyle(document.documentElement).getPropertyValue(...)` —
   **no**, scrap that. Just keep the values as hex literals that match the
   CSS-var values byte-for-byte, and add a single lint-style `// keep in
   sync with src/style.css --cc-status-*` comment at the top of the block.
   Trying to late-bind the values at runtime means the markers can't render
   before the stylesheet parses; the duplication is cheap and testable.

4. **Route consumers through the helper:**

   ```diff
   - const colorsKey = `${workType.status}_${workType.claimed_by ? 'claimed' : 'unclaimed'}`;
   - const colors = iconColors[colorsKey];
   - return colors.fillColor;
   + return resolveStatusColors(workType.status, Boolean(workType.claimed_by)).fill;
   ```

   Apply the same shape to `getColorForStatus`, `getColorForWorkType`,
   `useWorktypeImages.getWorktypeColors`, and `useWorktypeImages.getWorktypeSVG`.

5. **Write a unit test** at `test/unit/icons/resolveStatusColors.test.ts`:

   - Every known status × claimed combination returns non-empty `fill` and
     `stroke`.
   - Unknown status falls back to `open_unassigned_unclaimed`.
   - Every returned hex appears byte-for-byte in `src/style.css` (regex-grep
     the file content at test time — guards against drift).

6. **Regex-check the repo** for any remaining direct `iconColors[...]` access
   outside `icons_templates.ts` itself — replace with `resolveStatusColors`.

## Reuse

- Existing ramps: `crisiscleanup-red-*`, `crisiscleanup-yellow-*`,
  `crisiscleanup-green-*`, `crisiscleanup-dark-*`, `crisiscleanup-phone-green`,
  `crisiscleanup-dashboard-blue`.
- Existing PostCSS `theme()` helper — no new tooling.
- Vitest setup already loads `src/style.css` indirectly through
  `test/setupTests.ts`; the sync-check test can read the file via Node's
  `fs`.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm test` clean.
- `pnpm dev` → pull up `/cases` and the map with markers. **No visual
  change** (tokens resolve to the same hex values). Spot-check a handful of
  statuses (unclaimed red, claimed yellow, follow-up magenta, closed green).
- Open the status dropdown on a case — badge background is still the same
  24%-alpha tint of the fill color. (Spec 16 will replace the alpha-hex concat
  with `color-mix` + the new CSS var; this spec leaves it alone.)
- `getColorForStatus('bogus_value')` in a REPL returns the unassigned fallback
  fill hex.

## Out of scope

- Changing any hex value — this spec moves the palette, it does not re-color
  anything. Any color shift ships in a separate PR.
- Dark mode — tokens are authored so a `html.dark` override would work, but
  no dark-mode rules ship here.
- Migrating `getWorkTypeImage` / `getWorktypeSVG` off the string-template
  pipeline (spec 17b).
- Touching `WorksiteStatusDropdown.vue` (spec 16).
- Consolidating the three icon stores under `unplugin-icons` (separate track).

## Risks / rollback

- **Risk:** CSS-var values and `icons_templates.ts` hex values drift over
  time. Mitigated by the sync-check unit test in step 5.
- **Risk:** a caller holds onto the old `iconColors` import for a value
  outside the 20-key table. The palette has no other entries, so re-index
  attempts silently fall back — same as today. If step 6 turns up one,
  migrate it in this PR.
- **Risk:** `theme()` inside CSS custom properties doesn't compose with
  Tailwind's `@apply` in every build context. If PostCSS barks, inline the
  hex literal and rely on the unit test to keep the two in sync.
- **Rollback:** revert the four touched files. No data model, no API, no
  component surface changes.
