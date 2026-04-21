# 02 — Top bar

## Intent

Restructure the header so the incident picker reads as a single bordered
control (disaster icon + yellow code pill + incident name + chev), tighten
padding to a 64 px row, and align the right-side phone indicator, help/bug
icons, and user menu to the kit recipe. Keeps all existing logic — refactors
the wrappers only.

## Before / After

| Element | Current (`Header.vue`) | Target (`kit.css` / `Header.jsx`) |
|---|---|---|
| Outer padding | ad-hoc grid cells | `h-full px-[18px] flex items-center justify-between` |
| Incident picker | `BaseSelect` with `container-classes`/`select-classes` overrides, lines 15–44 | bordered row: `border rounded min-w-[320px] px-3 py-1.5 gap-2.5` |
| Incident disaster icon | separate `DisasterIcon` `w-10 h-10` | 36×36 tile, `bg-crisiscleanup-smoke rounded grid place-items-center` |
| Incident code | inline in select label | yellow pill: `bg-primary-light text-black text-[11px] font-bold px-1.5 py-0.5 rounded-sm` |
| Incident name | inside select | `flex-1 font-bold text-[13px]` |
| Phone indicator | `PhoneIndicator.vue` | same, styled as a green pill — see `kit.css:55-56` |
| Help / bug icons | none | two 22 px icon buttons, `opacity-60 hover:opacity-100 cursor-pointer` |
| User menu | `UserProfileMenu.vue` | same, wrapped in a 34 px avatar (`bg-primary-dark text-white font-bold`) + name (13 px/700) + org (11 px/grey-900) + chev; hover `bg-crisiscleanup-smoke rounded` |

## Files to touch

- `src/components/header/Header.vue` — primary.
- `src/components/header/UserProfileMenu.vue` — avatar + name/org markup
  (see kit `.avatar` and `.user-menu` rules).
- `src/components/phone/PhoneIndicator.vue` — reshape as a pill if it isn't
  already; use existing `phone-outbound-light` / `phone-outbound-dark` tokens.

Do **not** rewrite `DisasterIcon.vue` internals — just wrap it in the 36 px
tile.

## Implementation

1. **Header.vue root:** replace the current grid with
   `class="flex items-center justify-between h-full px-[18px] bg-white border-b border-crisiscleanup-grey-100"`.
   Left group: incident picker + an "Add Incident" outline-sm button (see
   spec 04 for the button spec). Right group: phone indicator + help/bug
   icons + user menu.

2. **Incident picker:** keep `BaseSelect` as the hidden mechanism; render a
   custom trigger slot with the composed `[icon][code pill][name][chev]` row
   (exact classes in the table above). Pattern to copy verbatim: `kit.css:45-53`.

3. **Phone indicator pill** (`PhoneIndicator.vue`):
   ```
   inline-flex items-center gap-2.5 px-3 py-1.5 rounded
   bg-crisiscleanup-phone-outbound-light text-crisiscleanup-phone-outbound-dark
   text-xs font-bold cursor-pointer
   ```
   With a dot: `w-2 h-2 rounded-full bg-crisiscleanup-phone-outbound-dark
   shadow-[0_0_0_4px_rgba(65,153,84,.25)]`.

4. **Help / bug icons:** use `assets/icons/help.svg` and `assets/icons/bug-report.svg`
   (already in `src/assets/icons/`). 22 px, `filter: invert(.6)` on hover →
   `invert(.0)` for subtle emphasis. Wrap each in a button with `aria-label`.

5. **User menu / avatar:** 34 px circle; initials logic likely already in
   `UserProfileMenu.vue` — just restyle container.

6. **Verify 64 px row** stays tight: if any child forces taller, set the
   header inner to `h-16` explicitly and `overflow: hidden` on the row.

## Reuse

- `DisasterIcon.vue` — wrap, don't rewrite.
- `BaseSelect.vue` — keep as data mechanism; style trigger only (spec 05 adds
  base focus ring you'll inherit).
- `PhoneIndicator.vue`, `UserProfileMenu.vue` — refactor their templates, keep
  the logic/hooks.
- Existing tokens: `crisiscleanup-phone-outbound-{light,dark}`, `primary-dark`,
  `crisiscleanup-smoke`, `crisiscleanup-grey-100/900`.

## Verification

- `pnpm dev` → log in → `/dashboard`. Header matches the prototype at
  `/Users/tobi/Downloads/Crisis Cleanup Operator App.html` visually.
- Hover each element: phone pill keeps pulsing dot, help/bug emphasize, user
  menu gets smoke hover bg.
- Click incident picker → menu still opens, selection still dispatches.
- Mobile (≤768 px): header collapses as today (hamburger on left). No
  regressions to `src/layouts/Authenticated.vue` mobile.
- `pnpm typecheck`, `pnpm lint`.

## Out of scope

- Sidebar (spec 03).
- Base button radius / focus styling (spec 04) — the "Add Incident" button
  inherits those once spec 04 ships.
- Notifications dropdown (if present) — not in the design kit.

## Risks / rollback

- **Risk:** the custom trigger slot may diverge from `BaseSelect`'s assumed
  markup; keep the hidden select accessible so screen readers still work.
  Preserve any `data-testid` attributes used by e2e (`testCurrentIncident*`
  if present).
- **Rollback:** revert `Header.vue`; `UserProfileMenu.vue` and
  `PhoneIndicator.vue` changes are cosmetic and revertable independently.
