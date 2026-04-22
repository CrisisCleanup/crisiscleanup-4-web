# 17b — Flatten work-type icon shadow + radius

## Intent

Every work-type icon in [`src/icons/icons_templates.ts`](../../src/icons/icons_templates.ts)
bakes iOS-era visual debt into its SVG:

- A `feOffset` + `feGaussianBlur` + `feColorMatrix` filter chain on the
  outer shape produces a soft, 50%-opacity black drop shadow. This visually
  competes with the refresh's single-signature `shadow-crisiscleanup-card`
  elevation — anywhere a marker appears inside a DOM card, you see **two
  shadows**.
- The inner plus / camera badges use `rx="2"` rounded corners, which reads
  smaller than the refresh's 4 px default.
- The outer shapes carry a thick white stroke (`stroke="#FFF"`) layered with
  a thin `strokeColor`-driven stroke to produce a halo effect against the
  map. That halo is part of the icon's legibility on the pixi overlay, so
  it stays — but the baked drop shadow underneath can go.

This spec **strips the baked shadow filters from the ~44 templates and
rounds inner badges to 4 px**, letting CSS handle elevation in DOM contexts
and leaving the pixi-overlay markers with a flatter silhouette that still
reads on busy map tiles thanks to the white halo. Depends on spec 17a
(tokens) so the flattened templates pick up the refreshed palette cleanly.

## Before / After

### SVG-level changes

| Concern | Current | Target | Source |
|---|---|---|---|
| Outer drop shadow | Per-icon `<filter id="xxx__a">` + `<use xlink:href="...__b" fill="#000" filter="url(#xxx__a)" />` | Deleted. The outer shape keeps its `#FFF` halo stroke. | refresh signature shadow lives on the marker container in DOM, not in the SVG |
| Plus-badge shadow | `<filter id="plus_filter">` + same `<use>` layer | Deleted. | same |
| Plus-badge outer radius | `<rect ... rx="2"/>` (applied in `<defs>`) | `<rect ... rx="4"/>` | 4 px default radius |
| Plus-badge inner radius | `<rect ... rx="2"/>` on the white fill and the white stroke | `<rect ... rx="4"/>` | same |
| Camera / multiple insets | unchanged coordinate transforms | unchanged | indicator positioning stays correct once the `<use>`-for-shadow layer is gone |
| Outer halo stroke | `<path stroke="#FFF" d="..."/>` second layer | unchanged | this is the legibility halo, keep it |
| Color placeholders | `{{fillColor}}`, `{{strokeColor}}`, `{{strokeWidth}}` | unchanged | spec 17a already tokenizes the values fed in here |

### DOM-level changes (where markers render as HTML)

| Surface | Current | Target |
|---|---|---|
| `WorksiteFeed.vue` `<div v-html="getWorktypeSVG(...)">` | No wrapper elevation | `class="shadow-crisiscleanup-card rounded"` on the wrapper, padding so the shadow has room |
| `WorksiteStatusDropdown.vue` trigger SVG | No wrapper elevation (the trigger carries its own chrome from spec 16) | unchanged — trigger already owns the shadow now |
| `CurrentCall.vue` / `ActiveCall.vue` / `EventCard.vue` | Loose SVG | `class="shadow-crisiscleanup-card rounded-full"` on a small circular wrapper (44 × 44) to replace the baked shadow |
| `DefaultDashboard.vue` / `Dashboard.vue` / `Survivors.vue` | Loose SVG in a table cell | No wrapper — these appear on neutral surfaces where the baked shadow was noise; they look cleaner flat |
| `useRenderedMarkers.ts` / `useLiveMap.ts` / `useWorksiteMap.ts` (pixi-overlay markers) | Baked shadow hid overlap between clustered markers | **Keep a lighter baked shadow.** See implementation step 4 — we don't render pixi markers with CSS shadows, so the compromise is a single shared, lighter shadow pattern used only by the pixi path |

## Files to touch

- `src/icons/icons_templates.ts` — template-string edits. ~44 templates
  each carry the same two-filter pattern; a scripted regex edit will do.
- `src/hooks/worksite/useWorktypeImages.ts` — optional second argument
  `variant: 'flat' | 'elevated'` on `getWorktypeSVG` / `getBasicWorktypeSVG`
  so pixi callers can re-inject a minimal shadow. Default `'flat'`.
- `src/filters/index.ts` — `getWorkTypeImage` adopts the same `variant`
  argument, default `'flat'`.
- `src/hooks/worksite/useRenderedMarkers.ts` — pass `variant: 'elevated'`
  so map markers keep a soft shadow. One-line change.
- `src/hooks/worksite/useLiveMap.ts` — pass `variant: 'elevated'` at the
  three call sites that feed the pixi pipeline.
- `src/components/WorksiteFeed.vue` — add `shadow-crisiscleanup-card
  rounded` to the wrapper around the injected SVG; bump wrapper padding so
  the shadow doesn't clip.
- `src/components/phone/CurrentCall.vue` / `ActiveCall.vue` /
  `src/components/live/EventCard.vue` — wrap the SVG in a small circular
  elevation container (CSS-only; no SVG changes).
- `src/components/WorksiteLegend.vue` — audit; the legend should **not**
  show the baked shadow, so it benefits for free once templates flatten.

## Implementation

1. **Write a script / sed pass** to strip the two filter patterns from every
   template literal. Two patterns per icon:

   - The outer `<filter id="<name>__a">…</filter>` block inside `<defs>`.
   - The `<use fill="#000" filter="url(#<name>__a)" xlink:href="#<name>__b"/>`
     consumer line.

   And for `plus`:

   - The `<filter id="plus_filter">…</filter>` block.
   - The `<use fill="#000" filter="url(#plus_filter)" xlink:href="#plus_rect"/>`
     consumer.

   The shapes end up rendering with only the `{{fillColor}}`-stroked path
   plus the `#FFF` halo. Verify **zero** `feGaussianBlur` occurrences remain
   in `icons_templates.ts` afterward.

2. **Swap `rx="2"` → `rx="4"`** inside the `plus` template and anywhere the
   plus-badge shape is inlined (e.g. the `animal_services__d` rect that
   also says `rx="2"`). Global regex over the file — check for false
   positives in viewBox / width/height attributes (those use no `rx`).

3. **Add an `elevated` variant.** In `icons_templates.ts`:

   ```ts
   const LIGHT_DROP_SHADOW = `
     <filter id="cc-shadow">
       <feOffset dy="1" in="SourceAlpha" result="o"/>
       <feGaussianBlur in="o" stdDeviation="1" result="b"/>
       <feColorMatrix in="b"
         values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 0"/>
       <feMerge><feMergeNode in="SourceGraphic"/></feMerge>
     </filter>`;
   ```

   Not used inside the templates themselves. Callers that need elevation
   compose it at render time — see step 4.

4. **Compose the elevated variant at render time** in `useWorktypeImages`:

   ```ts
   const getWorktypeSVG = (
     worktype: any,
     size = 53,
     variant: 'flat' | 'elevated' = 'flat',
   ) => {
     const template = templates[worktype.work_type] || templates.unknown;
     const { fillColor, strokeColor } = getWorktypeColors(worktype);
     let svg = template
       .replaceAll('{{fillColor}}', fillColor)
       .replaceAll('{{strokeWidth}}', SVG_STROKE_WIDTH.toString())
       .replaceAll('{{strokeColor}}', strokeColor)
       .replaceAll(/(width="[1-9]+")/g, `width="${size}"`)
       .replaceAll(/(height="[1-9]+")/g, `height="${size}"`);

     if (variant === 'elevated') {
       svg = injectElevationFilter(svg);
     }
     return svg;
   };
   ```

   `injectElevationFilter` inserts the filter into the first `<defs>`
   (or creates one after `<svg ...>` if absent) and wraps the first
   top-level `<g>` in `filter="url(#cc-shadow)"`. Keep it a small,
   well-tested helper at the top of `useWorktypeImages.ts`.

5. **Wire the pixi callers** — one-line diff at each:

   ```diff
   - templates[workType?.work_type] || templates.unknown;
   + // Pixi-overlay renders don't inherit CSS shadow — ask for elevated.
   + getWorktypeSVG(workType, size, 'elevated');
   ```

   `useRenderedMarkers.ts` and `useLiveMap.ts` currently build the SVG
   string inline via `template.replaceAll(...)`. Refactor those call sites
   to call `getWorktypeSVG` / `getBasicWorktypeSVG` instead — keeps the
   pipeline in one place and lets them opt into `'elevated'` without
   duplicating the shadow-injection code.

6. **Wrap DOM consumers that need elevation** — add a small wrapper class
   at call sites that used to rely on the baked shadow for visual
   separation:

   ```html
   <!-- WorksiteFeed.vue -->
   - <div v-html="getWorktypeSVG(workType, 24)"></div>
   + <div
   +   class="inline-flex items-center justify-center p-0.5
   +          rounded-full shadow-crisiscleanup-card"
   +   v-html="getWorktypeSVG(workType, 24)"
   + ></div>
   ```

   Repeat for `CurrentCall.vue`, `ActiveCall.vue`, `EventCard.vue`. Do
   **not** wrap the dropdown trigger's SVG (spec 16's trigger already
   carries the card shadow); do not wrap the three dashboard surfaces
   where a flat look reads cleaner.

7. **Regression-guard the dashboards.** `DefaultDashboard.vue`,
   `Dashboard.vue`, `Survivors.vue` all `v-html` a work-type image in
   table cells. After flattening, the cell reads cleaner — verify in dev.
   If a designer disagrees, drop a `shadow-crisiscleanup-card` on the
   cell's wrapper, not a re-bake of the SVG shadow.

8. **Snapshot verification.** Not visual-regression test infra, just
   eyes: before/after screenshots of (a) the case list row badge,
   (b) a map at zoom 12 with 50+ markers, (c) the legend, (d) the
   worksite feed, (e) the active call indicator.

## Reuse

- `shadow-crisiscleanup-card` — the refresh's one signature.
- Tokens from spec 17a — values flow through unchanged.
- `getWorktypeSVG` / `getBasicWorktypeSVG` pipeline stays; just gains a
  variant.
- No new dependencies. No new files.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm test` clean.
- `grep feGaussianBlur src/icons/icons_templates.ts` → **0 matches.**
- `grep 'rx="2"' src/icons/icons_templates.ts` → 0 matches inside badge
  rects. (Allow `rx` attributes on other shapes if they legitimately want
  2 px; spot-check.)
- `pnpm dev` → visit the map at high density. Markers sit flatter,
  cluster spacing reads cleaner, the `#FFF` halo still separates adjacent
  pins. Individual markers still carry a subtle shadow (from the
  `elevated` variant) so they pop off the tiles.
- `/cases` row badges look flat-then-elevated-by-the-row — i.e. the SVG
  itself is flat, and the row hover/elevation carries the depth.
- Worksite feed shows each badge inside a shadow-card bubble that
  matches the rest of the feed's card language.
- Worksite legend shows flat chips — no more double-shadow.
- Case dropdown trigger (spec 16) keeps its own border + focus-ring,
  unchanged by this spec.
- Performance: run `useRenderedMarkers` through the map with
  `performance.now()` around the template build loop before and after.
  Stripping filters reduces SVG bytes ~20% per template; no expected
  slowdown.

## Out of scope

- Replacing the string-template pipeline with SFC components or
  `unplugin-icons` unification — separate track.
- Consolidating the 44 work-type SVGs with the `disaster_icons` /
  `assets/icons` sets.
- Reworking the pixi-overlay sprite cache (`useRenderedMarkers` already
  caches; shadow change doesn't invalidate cache keys since the SVG
  source string is what's keyed).
- Changing the halo stroke color or width.
- `plus`-badge content (the "+" glyph and its positioning) — only the
  radius and drop shadow change.

## Risks / rollback

- **Risk:** pixi-overlay markers without any shadow vanish against
  light map tiles. Mitigated by the `elevated` variant carrying a
  lighter filter-based shadow — lighter than the original (25% vs
  50% opacity, stdDeviation 1 vs 2, offset dy=1 vs 2). Spot-check on
  CartoDB Positron + Mapbox Streets tiles.
- **Risk:** the `injectElevationFilter` helper breaks on templates that
  don't have a `<defs>` block or have a non-trivial first top-level
  `<g>`. Mitigate by unit-testing it against every template string (one
  fixture per key); adjust the insertion rule if any icon surprises.
- **Risk:** Safari's SVG filter performance tanks at >500 markers on a
  pan. If so, move the pixi path to **no** SVG filter and rely on a
  client-side bitmap pass (Pixi displacement / glow). That's a separate
  spec — this one stops at SVG-level flattening.
- **Risk:** baseline hashes in `useRenderedMarkers`' sprite cache change
  for every key, forcing a one-time cache miss on deploy. Acceptable;
  the cache repopulates as the user pans.
- **Rollback:** revert `icons_templates.ts`, `useWorktypeImages.ts`, and
  the six consumer files. No data model, no API changes. The
  `variant` argument is additive and defaults to the pre-spec
  behavior on the pixi path (`'elevated'`).
