# 10 — Typography base (global body size)

## Intent

The compact 15 px body size is the single biggest reason the design kit reads
"cleaner" than the current app. Tokens exist
(`tailwind.config.cjs:41-49` defines `fontSize.body = .9375rem`, `bodysm`,
`bodyxsm`, `h1–h4`), but `src/style.css` applies them nowhere globally, so
`<body>` falls back to the browser/Tailwind default of 16 px and every
unqualified `<p>` / `<div>` / `<span>` renders one step too large.

Fix: set `<html>` / `<body>` to the existing `fontSize.body` token and
`fontFamily.sans` token in the base layer. Everything downstream inherits.

## Status

**Applied in the same PR as spec 01.** `src/style.css` now has a `@layer base`
rule. This file documents the change and follow-up audit.

## Before / After

| Concern | Before | After | Source |
|---|---|---|---|
| `<body>` font-size | Tailwind/browser default (16 px) | `theme('fontSize.body')` = `.9375rem` (15 px) | `colors_and_type.css:151-159` |
| `<body>` font-family | set per-component (many places) or inherited from Tailwind `--default-font-family` | `theme('fontFamily.sans')` = `Nunito Sans` | same |
| `<body>` line-height | Tailwind default `1.5` | `1.45` | same |
| Font smoothing | none | `-webkit-font-smoothing: antialiased` | same |

## Files touched

- `src/style.css` — added a `@layer base` block with the rule above. **Only
  file changed in this spec.**

## What the change looks like

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html,
  body {
    font-family: theme('fontFamily.sans');
    font-size: theme('fontSize.body');
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
  }
}
```

## Follow-up audit (not required for this spec to ship)

With body at 15 px, some call-sites that hardcode `text-base` (16 px),
`text-lg` (18 px), or `text-sm` (14 px) will now feel off-tempo. Triage as
drift surfaces, don't chase it preemptively:

```bash
# hits that may want to become text-body, text-bodysm, or an h* class
grep -rn --include='*.vue' --include='*.ts' -E "\btext-(base|lg|xl|2xl|sm|xs)\b" src/ | wc -l
```

Replace per-file as you encounter mis-fits:

- `text-base` → remove (inherit body) or `text-body` if explicit.
- `text-lg` → usually wants `text-h2` (16 px) or `text-h1` (20 px).
- `text-sm` → usually wants `text-bodysm` (~13 px).
- `text-xs` → usually wants `text-bodyxsm` (~10 px), *especially* for
  micro-labels on tables/pills which the kit treats as `h4` (uppercase 12 px
  700 letter-spaced).

Don't convert utility classes blindly; check that the callsite actually wants
the kit semantics.

## Reuse

- Existing tokens: `fontSize.{h1,h2,h3,h4,body,bodysm,bodyxsm}`,
  `fontFamily.{sans,display}`, `fontWeight.{h1..h4,body,bodysm}` — all already
  in `tailwind.config.cjs`. **No token changes.**

## Verification

- `pnpm dev`; compare any page (`/dashboard`, `/cases`) side-by-side with
  `/Users/tobi/Downloads/Crisis Cleanup Operator App.html`. Body copy now
  matches weight.
- Zoom to 100% in Chrome / Firefox and measure a representative paragraph in
  DevTools → `font-size: 15px`.
- `pnpm lint` / `pnpm typecheck` — no changes touch TS/Vue logic.
- Spot-check dense surfaces: cases table rows, phone panel event log, modal
  bodies, admin forms. Line-height 1.45 keeps them readable without hugging.

## Out of scope

- Heading audit across pages (wait for the follow-up grep above to surface
  concrete files).
- Display font (`Montserrat`) is still opt-in via `text-display` /
  `font-display` utilities; no pages need it switched on automatically.
- Dark-mode type overrides (none needed; kit doesn't change type in dark).
- Responsive type scaling — kit stays the same at desktop + mobile; no media
  query needed.

## Risks / rollback

- **Risk:** any component that hardcoded 16 px-specific layout (icon +
  text alignment with magic pixel values) may visually drift. These are best
  caught by walking the app at 1440 and 390 widths post-change.
- **Risk:** a `<button>` inside a form inherits the new body size unless
  reset. Most browsers reset button font to `inherit` when `@tailwind base`
  runs, so this should be fine — confirm by looking at any `<button>` in a
  page and checking it renders at 15 px (or whatever the component's own
  `text-h4`/`text-bodysm` override says).
- **Rollback:** delete the `@layer base` block. Two-line revert.
