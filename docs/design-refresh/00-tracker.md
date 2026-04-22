# Design Refresh — Tracker

Small, scoped polish pass that tightens the operator app's **top bar, sidebar,
buttons, inputs, pills, and cards** to match the Claude Design handoff bundle.
Keeps the existing visual feel.

Each spec in this folder is a **standalone PR**. Pick one, do it, ship it.

## Status

| # | Spec | Touches | Status |
|---|---|---|---|
| 01 | [App shell](./01-app-shell.md) | `src/layouts/Authenticated.vue` | in-progress (manual verify pending) |
| 02 | [Top bar](./02-top-bar.md) | `src/components/header/Header.vue` | in-progress (manual verify pending) |
| 03 | [Sidebar](./03-sidebar.md) | `src/components/navigation/{NavMenu,NavButton}.vue` | not-started |
| 04 | [Buttons](./04-buttons.md) | `src/components/BaseButton.vue` | in-progress (manual verify pending) |
| 05 | [Inputs & forms](./05-inputs-forms.md) | `src/components/{BaseInput,BaseSelect,BaseRadio}.vue` | in-progress (manual verify pending) |
| 06 | [Pills & badges](./06-pills-badges.md) | new `src/components/BasePill.vue` + grep migration | in-progress (manual verify pending) |
| 07 | [Cards & surfaces](./07-cards-surfaces.md) | audit pass across `src/components/` | in-progress (manual verify pending) |
| 08 | [Table + integrated search toolbar](./08-table.md) | `src/components/Table.vue` + caller migration | not-started |
| 09 | [Input error & hint messaging (bug fix)](./09-input-error-messaging.md) | `src/components/{BaseInput,BaseSelect,BaseRadio}.vue` | in-progress (manual verify pending) |
| 10 | [Typography base (body 15 px)](./10-typography-base.md) | `src/style.css` | in-progress (shipped w/ 01; manual verify pending) |
| 11 | [Select refresh + incident picker trigger](./11-select-incident-picker.md) | `src/components/BaseSelect.vue` + recipe used by spec 02 | shipped |
| 12 | [Mobile top bar](./12-mobile-top-bar.md) | `src/layouts/Authenticated.vue` (mobile branch) | in-progress (manual verify pending) |
| 13 | [Mobile dashboards](./13-mobile-dashboards.md) | `src/pages/Dashboard.vue` + `src/pages/dashboards/*` | in-progress (manual verify pending) |
| 14 | [Chat polish (Spinny + access points)](./14-chat-polish.md) | `src/components/chat/{Chat,ChatMessage}.vue` + `src/components/header/Header.vue` | in-progress (manual verify pending) |
| 15 | [Work utility bar (view toggles, search, filters, sliders)](./15-work-utility-bar.md) | `src/pages/Work.vue` + `src/pages/WorksiteNavigationIcons.vue` + `src/assets/icons/*.svg` + new `src/components/work/WorksiteRefine.vue` | not-started |
| 16 | [Worksite status dropdown refresh](./16-worksite-status-dropdown.md) | `src/components/WorksiteStatusDropdown.vue` | in-progress (manual verify pending) |
| 17a | [Work-type status palette → tokens](./17a-worktype-status-tokens.md) | `tailwind.config.cjs` + `src/style.css` + `src/icons/icons_templates.ts` + `src/filters/index.ts` + `src/hooks/worksite/useWorktypeImages.ts` | in-progress (manual verify pending) |
| 17b | [Flatten work-type icon shadow + radius](./17b-worktype-icon-flatten.md) | `src/icons/icons_templates.ts` + `src/hooks/worksite/useWorktypeImages.ts` + pixi callers + DOM wrappers in `WorksiteFeed.vue` / phone / live | in-progress (manual verify pending) |
| 18 | [Phone overlay (sidebar, call banner, agent toolbar)](./18-phone-overlay.md) | `src/components/phone/{PhoneOverlay,Agent}.vue` | not-started |

Status values: `not-started` → `in-progress` → `review` → `shipped`. Update this
row when opening/merging the PR and link it in the *PR* column if you want.

## Ordering

Recommended execution order is the numbering. **01 first**: it sets the shell
grid (sidebar/header dimensions) that 02–03 align to. Primitives (04–06) are
independent of each other and can parallelize. **07** is an audit pass best
run after primitives land. **08 depends on 06** (table status column uses
`BasePill`) and implicitly benefits from 05/09 (the integrated search input
inherits the focus ring + error placement fixes). **09 is a bug fix** — can
ship independently and should, since the current beside-the-input error
layout is a real regression; it pairs naturally with 05 if grouping.

**Worksite-icon subtrack (16, 17a, 17b):** ship in the order **17a → 16 →
17b**. 17a is a safe token-move with no visual change — it unblocks 16 from
reintroducing hex literals and lets 17b's flattened templates pick up the
refreshed palette without a second migration. 16 depends on spec 11
(BaseSelect refresh) for the trigger/popper language — spec 11 is shipped, so
16 is unblocked. 17b is the only spec in this subtrack that changes what
markers look like on the map; land it last so regressions are attributable.

## Global principles

Lifted from the bundle README's *Visual Foundations*. Every spec inherits these.

- **Radii:** 2–6 px only. Default is 4 px (`rounded`). Full-round (`rounded-full`)
  for pills and avatars only. No 8+ px radii in product chrome.
- **Shadows:** one signature — `shadow-crisiscleanup-card`
  (`0 4px 8px 0 rgba(164,177,184,.6)`). Don't invent new shadow sizes.
- **Motion:** `transition: all 300ms ease` everywhere. No springs, no bounce,
  no scale-transforms on press.
- **Color:** primary is `#FECE09` (yellow) solid with black text. No gradients
  in app chrome. No glassmorphism, no backdrop-filter.
- **Type scale:** compact — h1 20 px, h2 16 px, body 15 px, h4 (micro label)
  12 px uppercase letter-spaced. Nunito Sans everywhere; Montserrat for display
  only.
- **Icons:** white-fill SVGs on dark sidebar; `filter: invert(1)` (or the
  `filter-primary` utility) on light surfaces. Never substitute Lucide /
  Heroicons — use the bespoke `src/assets/icons` set.
- **No emoji** in product UI.

## Reference material

- **Canonical bundle:** `/tmp/ccu-design/crisiscleanup-design-system/`
  (ephemeral — extracted from a tarball. If you close the session, re-extract
  from the Anthropic design URL the user shared or copy somewhere durable.)
  - `project/README.md` — full Visual Foundations writeup.
  - `project/colors_and_type.css` — every color + type token with `--cc-*` names.
  - `project/ui_kits/web_app/kit.css` — the CSS that drives the kit prototype.
    **This is the file to grep when in doubt about a value.**
  - `project/preview/{buttons,badges,form-fields,nav-item}.html` — isolated
    previews per primitive.
- **Reference prototype (single file):**
  `/Users/tobi/Downloads/Crisis Cleanup Operator App.html` — open in a browser
  to click through the target look.
- **In-repo source of truth for tokens:** `tailwind.config.cjs`. Tokens already
  match the bundle; **no spec in this set modifies the tailwind config**.

## Out of scope (for this whole track)

- Token changes in `tailwind.config.cjs` (already match the bundle).
- Map visuals (`src/components/WorkTypeMap.vue`, pixi overlay).
- Phone **content panes** (`Leaderboard`, `GeneralStats`, `PhoneDoctor`,
  `PhoneCmsItems`, etc.) and the `CurrentCall` related-cases pane —
  spec 18 refreshes the phone *chrome* (sidebar, call banner, agent
  toolbar) only; the individual panes are follow-ups.
- `src/maintenance/` and `src/external/**` (vendored).
- Dark mode (configured but not active; audit is a separate track).
- Framework / dependency upgrades.

## Per-spec template

Every implementation spec follows the same shape so reviewers can scan:

```markdown
# <Title>
## Intent
## Before / After      — diff table
## Files to touch
## Implementation      — ordered steps
## Reuse               — existing utilities/components
## Verification
## Out of scope
## Risks / rollback
```

## Verification (applies to every spec)

1. `pnpm lint` and `pnpm typecheck` clean.
2. `pnpm test` — no regressions.
3. `pnpm dev`, walk affected surfaces at **1440 px** and **390 px** widths in
   Chrome + Firefox.
4. Spot-check `/login`, `/dashboard`, `/cases`, `/phone`, any modal (e.g.
   Terms acceptance) — the chrome changes ripple everywhere.

Visual regression snapshots aren't currently wired up. If you add them, record
baselines after spec 01 ships (shell dimensions change everything downstream).
