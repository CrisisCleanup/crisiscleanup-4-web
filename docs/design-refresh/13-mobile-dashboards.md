# 13 — Mobile dashboards (default / phone / command)

## Intent

Spec 12 put a real top bar on mobile, which made it obvious that the
dashboards themselves were never designed for `mq.mdMinus`. Pages like
`src/pages/dashboards/{DefaultDashboard,PhoneVolunteerDashboard,CommandCenterDashboard}.vue`
and `src/pages/Dashboard.vue` render desktop grids (`grid-cols-4`,
`lg:grid-cols-2`, `md:grid-cols-2`) that collapse to `grid-cols-1` at best,
but still ship with desktop-scale padding (`p-8`, `mt-10`, `gap-10`), 84-rem
`SimpleMap` heights, and KPI tiles that force side-by-side icon+number
layouts on narrow screens. Result: wasted space, overflow, and the new top
bar + bottom tab eating the small screen.

Goal: **make the dashboards readable and scrollable on 390 px without
rewriting them.** Keep desktop unchanged. This is a surface-level pass —
responsive classes, height clamps, and spacing — *not* an IA rethink.

## Before / After

### `src/pages/Dashboard.vue` — Operator dashboard (4 KPI tiles)

| Concern | Current | Target |
|---|---|---|
| Outer row | `grid grid-cols-2 md:grid-cols-4` (mixed) on lines that place 4 tiles | `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4` |
| Inside each tile | `flex flex-row items-center` — icon 50 px + large h3 | stacks vertically under ~480 px: `flex-col sm:flex-row` |
| Tile padding | `p-5` | `p-4 sm:p-5` |
| Percentage span | `text-base` wraps awkwardly on narrow | `text-sm` below `sm`; move to its own line via `flex-col sm:flex-row` |

### `src/pages/dashboards/DefaultDashboard.vue`

| Concern | Current | Target |
|---|---|---|
| Page outer padding | `p-8` everywhere | `p-4 md:p-8` |
| Hero row | `grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6 p-8` | `grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 mt-4 md:mt-6` |
| `SimpleMap` wrapper | `h-84` (336 px) fixed | `h-64 md:h-84` |
| Stats grid | `grid md:grid-cols-4 grid-cols-3 gap-2 mt-10 p-8` (still 3-col on mobile → squished) | `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-6 md:mt-10 p-4 md:p-8` |
| `.stats-card` | `rounded shadow-crisiscleanup-card p-4` (spec 7) | *unchanged* — add `min-w-0` to force truncation, and make the `$X.Xm` number `text-lg md:text-xl` instead of the implicit inherited size |
| Bottom lists | `grid md:grid-cols-2 gap-8 mt-5 p-8` | `grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-4 md:mt-5 p-4 md:p-8` |

### `src/pages/dashboards/PhoneVolunteerDashboard.vue`

| Concern | Current | Target |
|---|---|---|
| "Go to Calls" bar | `flex md:flex-row flex-col w-full p-2 … max-w-6xl` — the `bg-crisiscleanup-light-smoke` strip with CTA + languages | on mobile: stack the CTA full-width (`w-full`), move the languages block to a separate stacked row below; collapse the `mobile` number into the avatar row of the top bar |
| CTA button | default sizing | `w-full md:w-auto` at `md` breakpoint flip |
| News + Stats grid | `grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl` | *unchanged* — grid already collapses; ensure each column gets `min-w-0` + `overflow-hidden` so nested tables don't scroll-bleed |
| `PhoneCmsItems` | `max-h-none` | give it a mobile max-height so it doesn't push stats off-screen: `max-h-64 md:max-h-none` |

### `src/pages/dashboards/CommandCenterDashboard.vue`

| Concern | Current | Target |
|---|---|---|
| Page — check during implementation | TBD | single-column scroll with 16 px padding on `mq.mdMinus`; widgets (`VolunteerChart`, etc.) clamp to `h-64` mobile / existing desktop |

Fill TBD during step 1 audit.

## Files to touch

- `src/pages/Dashboard.vue` — 4 KPI tiles + outer grid breakpoints.
- `src/pages/dashboards/DefaultDashboard.vue` — primary target; most
  "looks crap on mobile" complaints come from this page.
- `src/pages/dashboards/PhoneVolunteerDashboard.vue` — the "Go to Calls"
  bar + news/stats grid.
- `src/pages/dashboards/CommandCenterDashboard.vue` — audit during step 1;
  expect smaller fixes.
- Do **not** touch `DashboardSelector.vue` or `DashboardPage.vue` — they're
  orchestrators, not the visible dashboards.

## Implementation

1. **Audit pass** (DevTools mobile at **iPhone 12 / 390 px** and
   **iPad / 768 px**):
   - Screenshot each dashboard page.
   - Note every element wider than the viewport, every grid that collapses
     to a single column but keeps desktop gaps, every fixed-height widget
     that eats more than 50% of the mobile viewport.
   - Fill the TBD rows above with the concrete numbers.

2. **Outer spacing** — replace every page-level `p-8` / `mt-10` / `gap-10`
   with `p-4 md:p-8` / `mt-6 md:mt-10` / `gap-6 md:gap-10`. Single-line find
   per file:

   ```bash
   # guide only — review each match
   grep -n "p-8\|mt-10\|gap-10\|gap-8" src/pages/dashboards/DefaultDashboard.vue
   ```

3. **KPI / stat cards** — each tile gets:
   - `flex-col sm:flex-row` so icon + number stack on narrow screens.
   - `min-w-0` on the text column so long percentages truncate instead of
     pushing the icon off-screen.
   - Padding `p-4` base, `sm:p-5`.
   - Number typography: `text-xl sm:text-2xl md:text-3xl` (currently `text-3xl`
     across the board — too loud at 390 px).

4. **Map / chart heights** — any `h-84` (336 px) or larger widget:
   - `h-64 md:h-84` so the map doesn't dominate.
   - Keep `SimpleMap`'s internal aspect logic untouched; just clamp the
     wrapper.

5. **Phone volunteer "Go to Calls" bar** — restructure the strip so on
   `mq.mdMinus`:
   - The CTA is full-width at the top.
   - Mobile phone + languages row sits below it with `flex-wrap gap-2`.
   - Drop the `hidden md:block` "Languages" label on mobile (the tags are
     self-evident); or swap to a single smaller label.

6. **Nested grids** — wherever a grid collapses to `grid-cols-1` at `md-`,
   also drop the column gap to `gap-4` so neighbors don't look marooned.

7. **Overflow guards** — every direct child of a collapsed grid column
   gets `min-w-0` (fixes the classic flex/grid "content forces overflow"
   bug). Spot-check nested tables / long org names.

## Reuse

- Existing `.stats-card` class (spec 7 already re-themed it to `rounded
  shadow-crisiscleanup-card`). Don't re-skin.
- `SimpleMap`, `VolunteerChart`, `GeneralStats`, `PhoneCmsItems` — unchanged
  logic; only their wrapper height/width responds to breakpoint.
- Tailwind responsive prefixes (`sm: md: lg:`) — no new utilities required.

## Verification

- `pnpm dev`, iterate through each dashboard at **390 px**, **768 px**,
  **1440 px**:
  - No element wider than viewport at 390 px (check DevTools "show layout
    shift regions" or just scroll-test horizontally).
  - KPI tiles readable without horizontal scroll.
  - Maps visible but don't dominate the first screen — user can still see
    the stats without scrolling much.
  - Tap-targets ≥ 32 px on mobile (CTAs, tile links).
- Desktop (1440 px) visually unchanged — diff with pre-change screenshots.
- `pnpm lint`, `pnpm typecheck` clean.
- E2E (`pnpm test:e2e:primary`) — no new selectors introduced; existing
  data-testids unchanged.

## Out of scope

- Rethinking which widgets belong on mobile vs. desktop. If the map is
  truly useless at 390 px, that's a separate IA call.
- Bottom-tab nav changes — spec 12 handles that wrapper.
- New components (e.g. a "MobileKpiTile") — reuse existing markup with
  responsive classes instead.
- `AdminDashboard.vue` / `AdminTicketDashboard.vue` / `ZendeskTicketDashboard.vue` —
  admin-only surfaces; out of the general-user mobile scope.

## Risks / rollback

- **Risk:** downsizing number typography (`text-3xl` → `text-xl` on mobile)
  can make KPIs feel lightweight. If screenshots look weak, bump mid-break
  to `text-2xl` or use `clamp()`.
- **Risk:** per-page `p-8` → `p-4 md:p-8` collisions with nested components
  that assume their parent adds `p-8` (unlikely, but audit nested charts
  that expect inner whitespace).
- **Rollback:** per-file reverts. No shared utility added; no component
  signature changed.
