# 07 — Cards & surfaces (audit)

## Intent

Audit-pass only. Normalize card-like surfaces (dashboard tiles, modals,
popovers, filter panels) to the kit's single signature:

- **Background:** white on a smoke page, or smoke on a white page.
- **Radius:** 4 px.
- **Shadow:** `shadow-crisiscleanup-card` — this token already exists
  (`tailwind.config.cjs:188`, expands to `0 4px 8px 0 rgba(164,177,184,.6)`).
- **Interior padding:** 16–24 px (`p-4` to `p-5`).

No new components. This is a grep + fix sweep to catch places that drifted
to ad-hoc shadows (`shadow-md`, `shadow-lg`, custom rgba strings) or wrong
radii.

## Before / After

| Surface | Current shadow | Target shadow | Current radius | Target radius | Status |
|---|---|---|---|---|---|
| Dashboard KPI tiles | TBD | `shadow-crisiscleanup-card` | TBD | `rounded` | to-check |
| Modal container | TBD | `shadow-crisiscleanup-card` | TBD | `rounded` | to-check |
| Popover / floating-vue | TBD | `shadow-crisiscleanup-card` | TBD | `rounded` | to-check |
| Cases table row hover | `#fafafa` bg only | *unchanged* | — | — | ok |
| Filter panel | TBD | `shadow-crisiscleanup-card` | TBD | `rounded` | to-check |

Fill the `TBD` cells during the audit (step 1 below) and flip `to-check`
→ `ok` / `fix` as you go.

## Files to touch

Populated by the audit. Expected hotspots:

- `src/pages/Dashboard.vue` and children.
- `src/components/modals/*` / any `Modal.vue`.
- `src/components/phone/PhonePanel.vue` (edge border only — keep; no card
  shadow on the phone rail per kit).
- Any component using `shadow-md` / `shadow-lg` / `shadow-xl` or a bespoke
  `box-shadow: 0 ...` in a `<style>` block.

## Implementation

1. **Audit commands** — capture the inventory:

   ```bash
   # non-standard shadows in src
   grep -rn 'shadow-\(md\|lg\|xl\|2xl\)' src/ | tee /tmp/shadow-audit.txt
   grep -rn 'box-shadow:' src/ | grep -v 'shadow-crisiscleanup-card' | tee -a /tmp/shadow-audit.txt
   # non-4px radii in product chrome (skip pills/avatars)
   grep -rn 'rounded-\(lg\|xl\|2xl\|3xl\)' src/
   # places using the right token (for reference)
   grep -rn 'shadow-crisiscleanup-card' src/
   ```

2. **For each card-like surface** found:
   - Replace the shadow with `shadow-crisiscleanup-card`.
   - Set radius to `rounded` (4 px) unless it's a pill (`rounded-full`) or
     avatar (`rounded-full`).
   - Normalize padding to `p-4` (16 px) for compact cards, `p-5` (20 px)
     for titled cards, `p-6` (24 px) only for modal dialog bodies.

3. **Table in this file** — update the before/after with the concrete
   findings: filename, current shadow, target shadow. Reviewers use it as the
   PR checklist.

4. **Do not** apply a card shadow to:
   - the sidebar (flat dark column, no shadow);
   - the header (bottom border only, no shadow);
   - table rows (hover bg only);
   - form fields (they get the focus-ring glow in spec 05, not a card shadow);
   - the phone panel rail (has a left border, intentionally no shadow —
     `kit.css:121`).

## Reuse

- `shadow-crisiscleanup-card` token — already defined, already used in places.
  Don't redefine.
- `rounded` (`4px`) — tailwind default.

## Verification

- Eyeball every dashboard tile, every modal, every popover on `pnpm dev`.
  They should read as a coherent family at the same elevation.
- Diff the grep output of `shadow-md|shadow-lg|shadow-xl` before/after —
  count should drop toward zero for card-surface contexts (keep shadow-lg
  etc. where intentional, e.g. a lifted autocomplete dropdown, if any).
- `pnpm lint` + `pnpm typecheck`.
- Cross-reference: the Dashboard mockup in `/tmp/ccu-design/.../ui_kits/web_app/Dashboard.jsx`
  uses bare `.card` → `shadow-card` everywhere.

## Out of scope

- Introducing new elevation levels (hover-lift, focus-lift) — not in the
  kit. One signature shadow only.
- Rewriting modal markup (`Modal.vue`) — only its container shadow/radius
  change.
- Light/dark surface tokenization (there's one smoke + one white — document,
  don't generalize).

## Risks / rollback

- **Risk:** some "card" elements may rely on a stronger shadow for affordance
  (e.g. a floating menu over a busy map). Those are not cards — leave them
  with `shadow-lg` or similar and note the exception inline with a one-line
  comment explaining why.
- **Rollback:** per-file reverts; no structural changes, no API changes.
