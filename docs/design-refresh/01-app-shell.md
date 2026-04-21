# 01 — App shell (sidebar width + header height)

## Intent

Tighten the desktop app shell to `96px sidebar / 64px header` to match the
design kit. Today's grid is `125px / 65px` — the sidebar reads visually heavy
for an icon+label rail, and the extra horizontal space squeezes dense tables
on 1280–1440 px screens.

## Before / After

| Dimension | Current | Target | Source of truth |
|---|---|---|---|
| Desktop sidebar column | `125px` | `96px` | `kit.css:6-15` |
| Desktop header row | `65px` | `64px` | `kit.css:6-15` |
| Mobile slide-over sidebar | `150px` | `150px` (unchanged) | n/a |
| Grid template areas | `"sidebar header" / "sidebar main"` | *unchanged* | n/a |

## Files to touch

- `src/layouts/Authenticated.vue` — only the `<style>` block around
  **lines 609–620** (the `@media (min-width: 768px)` grid rule).

## Implementation

1. Edit `src/layouts/Authenticated.vue` → `@media (min-width: 768px) .layout`:

   ```diff
   - grid-template-columns: 125px 1fr;
   - grid-template-rows: 65px 1fr;
   + grid-template-columns: 96px 1fr;
   + grid-template-rows: 64px 1fr;
   ```

2. Leave mobile (`.sidebar.slide-over`, `.navbar @media max-width:1223px`)
   untouched — the slide-over at 150 px is fine.

3. Do **not** adjust the logo `width="133" height="53"` in `NavMenu.vue` yet —
   spec 03 handles logo scaling to fit the narrower rail.

## Reuse

- Tailwind's native `w-24` equals 96 px if you prefer an explicit token over
  a bare `96px`. Either is fine; inline px is simpler and matches the existing
  style of this file.

## Verification

- `pnpm dev`, open `/dashboard`, `/cases`, `/phone`, `/admin` at 1440 and
  1280 widths. No horizontal scroll, no clipped content. Sidebar icons + labels
  still legible at the new width (they are; spec 03 shrinks the icon).
- Toggle responsive mode to 390 px (iPhone) → mobile slide-over behaves
  identically.
- `pnpm test:e2e:primary` if auth/setup is wired in your env.

## Out of scope

- Nav item padding / icon size (spec 03).
- Header internals (spec 02).
- Logo dimensions (spec 03 resizes to fit 96 px).

## Risks / rollback

- **Risk:** nav labels (e.g. "My Organization") may wrap to three lines at
  96 px with the current 33 px icon. Spec 03 shrinks the icon and the label
  font, which resolves this. If shipping 01 *before* 03, either short-term
  shrink labels in `routes.ts` or ship 01+03 in one PR. **Recommended: bundle
  01 + 03.**
- **Rollback:** single-file revert; no migration, no data changes.
