# 19 — Phone panes foundation

## Intent

The specs 20–32 in this track each refresh one phone content pane
(`CurrentCall` + voicemail, `UpdateStatus`, `ActiveCall`, `PhoneToolBar`,
`Agent`, `CallHistory`, `GeneralStats`, `AgentStats`, `Leaderboard`,
`PhoneDoctor`, `ManualDialer`, `PhoneCmsItems`, `PhoneNews`). Spec 18
already refreshed the chrome around them (sidebar, call banner, agent
toolbar). The content panes themselves are **mixed bag** today: some
render directly from Vuex-ORM queries with zero empty/loading state,
others roll their own skeletons, and none share a "section card"
recipe — every pane invents its own header/padding/bg combination.

This spec codifies the small set of primitives and Tailwind recipes
those 13 follow-up specs will lean on. Four new components, one
`BasePill` variant, and three recipes documented inline. No
`tailwind.config.cjs` changes, no new color / shadow / radius tokens —
everything inherits from the *Global principles* in `00-tracker.md`.

**Scope guard.** Everything in this spec lives under
`src/components/phone/foundation/` or is a one-line addition to
`BasePill.vue`. Nothing here touches non-phone surfaces. When another
app surface eventually needs the same primitive, we lift it into
`src/components/ui/` in a separate PR; the file structure here is
deliberately extraction-friendly (no phone-specific props, no
cross-imports out of `src/components/phone/`).

## Before / After

**New components (all under `src/components/phone/foundation/`)**

| Primitive | File | Purpose |
|---|---|---|
| Empty state | `PaneEmpty.vue` | icon + headline + sub-copy + optional action slot; used when a pane renders a zero-row collection (call history, VM history, leaderboard, etc.) |
| Loading skeleton | `PaneSkeleton.vue` | shimmer blocks with three variants — `line`, `block`, `row` — for text, card, and table loading states |
| Error / fallback | `PaneError.vue` | inline error row with message + optional retry slot; used when an async fetch rejects |
| Disclosure | `PaneDisclosure.vue` | phone-pane-tuned wrapper over the existing `AccordionItem`; tighter spacing, pane-header typography, no chevron tint |

**Modified component**

| File | Change |
|---|---|
| `src/components/BasePill.vue` | add `ai` variant — grey pill with a small sparkle glyph + "AI" / slot content. Reused by any surface that labels AI-derived content (first consumer: spec 20 voicemail summary). |

**Recipes (documented inline, no new files)**

| Recipe | Markup contract |
|---|---|
| Pane card | `bg-white rounded border border-crisiscleanup-grey-100 p-4` on a `bg-crisiscleanup-smoke` page. Interior title is a 12 px uppercase letter-spaced micro-label; content starts 16 px below. **No drop shadow** — the smoke page + 1 px grey border separates cards without the visual weight of stacked shadows. `shadow-crisiscleanup-card` is reserved for focal surfaces (modals, dropdown poppers, the `PaneSkeleton` `block` variant) where a single surface sits alone. |
| Pane grid | `grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3` for multi-column pane layouts (CurrentCall refresh, stats refresh). Panes never nest grids more than one level deep. |
| Micro-callout | Single-line emphasis inside a pane (e.g. "3 prior voicemails"). `h-8 px-3 flex items-center gap-2 bg-crisiscleanup-light-smoke rounded text-[13px]` with a `BasePill` on the right. No card shadow. |

## Files to touch

- **NEW:** `src/components/phone/foundation/PaneEmpty.vue`
- **NEW:** `src/components/phone/foundation/PaneSkeleton.vue`
- **NEW:** `src/components/phone/foundation/PaneError.vue`
- **NEW:** `src/components/phone/foundation/PaneDisclosure.vue`
- **EDIT:** `src/components/BasePill.vue` — add `'ai'` to the `BasePillVariant` union; add a `.ccu-pill--ai` rule.
- **EDIT:** `docs/design-refresh/00-tracker.md` — append row 19 plus rows 20–32 (status `not-started`), and delete the "Phone **content panes** … individual panes are follow-ups." bullet from *Out of scope* (lines ~96–99) since this track now covers them.
- **NEW (tests):** `test/unit/components/phone/foundation/PaneEmpty.test.ts`,
  `test/unit/components/phone/foundation/PaneSkeleton.test.ts`,
  `test/unit/components/phone/foundation/PaneError.test.ts`,
  `test/unit/components/phone/foundation/PaneDisclosure.test.ts`.

No call-site migrations in this spec — each downstream spec (20–32)
adopts the primitives it needs. Keeping this spec call-site-free means
it lands as a pure addition with zero risk of breaking a live pane.

## Implementation

### 1. `PaneEmpty.vue`

```vue
<template>
  <div
    class="flex flex-col items-center justify-center text-center gap-2 py-8 px-4 text-crisiscleanup-grey-900"
    role="status"
  >
    <component
      :is="icon"
      v-if="icon"
      class="w-8 h-8 opacity-60"
      aria-hidden="true"
    />
    <p class="text-[15px] font-semibold text-black">{{ title }}</p>
    <p v-if="description" class="text-[13px] leading-snug max-w-xs">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Component } from 'vue';

defineProps<{
  title: string;
  description?: string;
  icon?: Component;
}>();
</script>
```

**Props:** `title` (required, short headline), `description` (optional
sub-copy), `icon` (optional Vue component — bespoke `ccu-icon` if the
pane has one, otherwise omit). **Slots:** `action` for an optional
button (e.g. "Start a call" from `CallHistory` empty).

### 2. `PaneSkeleton.vue`

```vue
<template>
  <div
    v-if="variant === 'line'"
    :class="['animate-pulse bg-crisiscleanup-light-smoke rounded', widthClass, heightClass]"
    aria-hidden="true"
  />
  <div
    v-else-if="variant === 'block'"
    class="animate-pulse bg-white rounded shadow-crisiscleanup-card p-4 flex flex-col gap-2"
    aria-hidden="true"
  >
    <div class="h-3 w-1/3 bg-crisiscleanup-light-smoke rounded" />
    <div class="h-3 w-5/6 bg-crisiscleanup-light-smoke rounded" />
    <div class="h-3 w-3/4 bg-crisiscleanup-light-smoke rounded" />
  </div>
  <div
    v-else
    class="animate-pulse flex items-center gap-3 h-10 px-3 border-b border-crisiscleanup-grey-100"
    aria-hidden="true"
  >
    <div class="h-3 flex-1 bg-crisiscleanup-light-smoke rounded" />
    <div class="h-3 w-16 bg-crisiscleanup-light-smoke rounded" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'line' | 'block' | 'row';
    width?: 'full' | '3/4' | '1/2' | '1/3';
    height?: 'sm' | 'md' | 'lg';
  }>(),
  { variant: 'line', width: 'full', height: 'md' },
);

const widthClass = computed(
  () =>
    ({ full: 'w-full', '3/4': 'w-3/4', '1/2': 'w-1/2', '1/3': 'w-1/3' })[
      props.width
    ],
);
const heightClass = computed(
  () => ({ sm: 'h-2', md: 'h-3', lg: 'h-4' })[props.height],
);
</script>
```

`animate-pulse` is allowed here only. The tracker bans `animate-pulse`
as a signal (spec 18 strips it from the call banner) — on skeletons it
reads as a loading shimmer, which is its textbook use.

The `block` variant intentionally keeps `shadow-crisiscleanup-card`
(not the `border` treatment the rest of the track uses) because a
skeleton stands alone on its first render, before the real pane card
has mounted — a lone card with a border looks like an empty box, but
a lone card with the signature shadow reads as "content is loading
here." When real content arrives and replaces the skeleton, it's the
bordered pane card from the recipe.

### 3. `PaneError.vue`

```vue
<template>
  <div
    class="flex items-start gap-3 p-3 rounded border border-crisiscleanup-red-700 bg-[#FCD9DA]"
    role="alert"
  >
    <ccu-icon
      type="attention-red"
      size="medium"
      alt=""
      aria-hidden="true"
      class="flex-none"
    />
    <div class="flex-1 min-w-0 text-[13px] text-crisiscleanup-red-900">
      <p class="font-semibold">{{ title }}</p>
      <p v-if="description" class="opacity-90">{{ description }}</p>
    </div>
    <div v-if="$slots.action" class="flex-none">
      <slot name="action" />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string;
  description?: string;
}>();
</script>
```

Reuses the existing `attention-red.svg` glyph (already shipped in
`src/assets/icons/`) — no Lucide dependency. The `#FCD9DA` background
matches `BasePill` variant `urgent` for visual consistency; don't
tokenize it yet, spec 06 left it inline for the same reason.

### 4. `PaneDisclosure.vue`

`AccordionItem` already exposes `classes` (outer), `buttonClasses`
(header), and `bodyClasses` (body) string props plus a `name` slot
for custom header markup — confirmed by reading
`src/components/accordion/AccordionItem.vue:54-66, 9-11`. No changes
to `AccordionItem` are needed. Markup:

```vue
<template>
  <AccordionItem
    :name="name"
    :start-open="startOpen"
    icon-position="right"
    classes="border-b border-crisiscleanup-grey-100 last:border-b-0"
    :button-classes="BUTTON_CLASSES"
    body-classes="px-3 py-2"
  >
    <template #name>
      <span class="flex items-center gap-2 min-w-0 flex-1">
        <slot name="title">{{ title ?? name }}</slot>
        <BasePill
          v-if="count !== undefined && count > 0"
          variant="dark"
          class="ml-auto"
        >
          {{ count }}
        </BasePill>
      </span>
    </template>
    <slot />
  </AccordionItem>
</template>

<script lang="ts" setup>
import AccordionItem from '@/components/accordion/AccordionItem.vue';
import BasePill from '@/components/BasePill.vue';

const BUTTON_CLASSES =
  'w-full h-10 px-3 flex items-center justify-between gap-2 bg-white hover:bg-crisiscleanup-smoke focus:outline-none text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900 transition';

defineProps<{
  name: string;
  title?: string;
  startOpen?: boolean;
  count?: number;
}>();
</script>
```

**Slot naming note.** `AccordionItem`'s custom-header slot is named
`name` (matching its `name` prop fallback). `PaneDisclosure` exposes
its own header slot as `title` so downstream authors don't have to
know about the `name` / name-slot collision. The `name` prop on
`PaneDisclosure` is forwarded 1:1 to `AccordionItem` for the accordion
key.

Downstream panes use `<PaneDisclosure>` everywhere instead of touching
`AccordionItem` directly, so the pane typography / border rhythm
stays consistent.

### 5. `BasePill` — new `ai` variant

In `src/components/BasePill.vue`:

```diff
 export type BasePillVariant =
   | 'open'
   | 'claimed'
   | 'in-progress'
   | 'completed'
   | 'urgent'
   | 'new'
   | 'dark'
   | 'incident'
+  | 'ai';
```

```diff
 .ccu-pill--incident {
   @apply bg-primary-light text-black;
 }
+.ccu-pill--ai {
+  @apply bg-crisiscleanup-grey-100 text-crisiscleanup-grey-900 uppercase;
+  letter-spacing: 0.04em;
+  font-size: 10px;
+  padding: 2px 8px;
+  border-radius: 9999px;
+}
```

Usage expectation:
`<BasePill variant="ai">{{ $t('~~AI-generated') }}</BasePill>`.
Spec 20 is the first consumer; this spec does not add the key itself.

The `ai` variant mirrors the `new` variant's "attention badge"
language (compact, uppercase, 10 px, tracked) rather than the status
pill recipe, because it signals *provenance* not *status* — it sits
next to content, not in a status column.

**Pill variant usage convention** (applies to all phone panes, specs 20–32):

| Purpose | Variant | Why |
|---|---|---|
| Emphasis counts ("N calls", "N voicemails") | `dark` | High-contrast count chip, reads as a number badge. |
| Age / recency tags ("N days") | `incident` | Yellow is the app's accent; reserve it for *one* chip per surface. |
| AI-derived content marker | `ai` | Spec 19's light-grey badge. |
| Informational/source tags ("Inbound", "Callback", "Auto") | `open` for inbound-adjacent, `completed` for neutral | Softer palettes; avoids stacking yellow/black on every row. |
| Status / work-type chips | existing status variants (`claimed`, `in-progress`, `urgent`, `new`) | Unchanged from spec 06. |

Rule of thumb: **one `incident` (yellow) pill per pane**, max. If a row
already has a yellow chip, subsequent chips on that row should be
`open` / `completed` / `ai` — not another yellow.

### 6. Recipes (inline doc, no code)

Downstream spec authors reference these recipes directly in their
"Files to touch" sections instead of re-deriving them. Keep the
wording of the markup contracts identical to the table above so
a reviewer can grep for consistency.

- **Pane card** (see Before/After table).
- **Pane grid** (see Before/After table).
- **Micro-callout** (see Before/After table).

### 7. i18n key convention

New phone-pane strings go under the existing `phoneDashboard.*`
namespace (already widely used — grep count > 40 in src/). **Do not**
introduce a parallel `phone.voicemail.*` / `phone.history.*` hierarchy
— the backend i18n service returns a flat key space and splitting it
produces stale-key fallbacks (spec 15 hit this).

Non-phone strings reused inside phone panes (e.g. `actions.retry`,
`info.ai_generated`) stay under their current namespaces.

### 8. Tests

Each new component gets a single Vitest file asserting:
1. Renders the required props (title for Empty/Error, name for
   Disclosure, variant for Skeleton).
2. Renders the optional slot (`action` for Empty/Error) when provided.
3. Applies the documented variant classes (Skeleton variants produce
   distinct root-class fingerprints; Disclosure exposes the
   AccordionItem surface).

Use `mount` from `@vue/test-utils` directly (the pattern in
`test/unit/components/phone/PhoneDoctor.test.ts`). Stub `ccu-icon`
and `FontAwesomeIcon` via `commonComponentStubs` from
`test/helpers.ts`. No Playwright coverage in this spec — the
primitives have no page-level behavior until spec 20 lands; spec 20
picks up the e2e.

### 9. Tracker update

In `docs/design-refresh/00-tracker.md`:

1. Append rows 19–32 to the status table (one per upcoming spec, all
   `not-started` initially).
2. Delete the *Out of scope* bullet "Phone **content panes**
   (`Leaderboard`, `GeneralStats`, `PhoneDoctor`, `PhoneCmsItems`,
   etc.) and the `CurrentCall` related-cases pane — spec 18 refreshes
   the phone *chrome* (sidebar, call banner, agent toolbar) only; the
   individual panes are follow-ups." — the new rows supersede it.
3. Add to *Ordering*: "**Phone-panes subtrack (19–32):** ship 19 first
   (foundational primitives), then 20 (CurrentCall + voicemail) which
   is the broadest consumer of 19. 21–32 are independent of each
   other and can parallelize once 19 ships."

## Reuse

- `BasePill` — extended, not replaced. The `ai` variant is the only
  addition; every other variant stays untouched.
- `AccordionItem` (`src/components/accordion/AccordionItem.vue`) —
  `PaneDisclosure` wraps it. If its props don't support per-slot
  class overrides yet, add them in this spec (one edit) and document
  in the accordion component; the existing consumers pass defaults
  and won't regress.
- `ccu-icon` + `src/assets/icons/attention-red.svg` — reused verbatim
  for `PaneError`.
- `crisiscleanup-smoke` (page), `crisiscleanup-grey-100` (card border),
  `shadow-crisiscleanup-card` (reserved for `PaneSkeleton` block + modals/poppers),
  `crisiscleanup-light-smoke`, `crisiscleanup-grey-{100,900}`,
  `crisiscleanup-red-{700,900}`, `primary-light` — all live in
  `tailwind.config.cjs`. Zero new tokens.
- No new i18n keys — each primitive accepts its copy via props, so
  downstream specs supply their own keys.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` — clean.
- `pnpm exec vitest run test/unit/components/phone/foundation/` — the
  four new test files pass.
- `pnpm dev` at `/phone` — **no visual change** yet. Foundation pane
  primitives aren't wired into any pane in this spec. Verify by
  diffing the `/phone` route at 1440 px and 390 px against `master`:
  the only difference is the presence of the new component files
  in dev-tools' "Components" tree (unmounted).
- Mount each primitive in a Storybook-less smoke test by dropping
  them into a throwaway dev page (e.g. `/dashboard?_foundation=1`
  behind a query flag — optional; only if you want a quick visual
  before spec 20). This isn't required to merge.

## Out of scope

- **Wiring primitives into any pane.** `CurrentCall`, `CallHistory`,
  `Leaderboard`, etc., adopt the primitives in their own specs
  (20–32). This spec is a pure addition.
- **`tailwind.config.cjs`** — no token changes. Every color, shadow,
  and radius used here is already defined.
- **A global "AI content" disclosure banner** — the `ai` BasePill
  variant labels content inline; full page-level disclosures (e.g.
  "This section contains AI-generated summaries") are a product
  decision for later.
- **Animation primitives beyond `animate-pulse` on skeletons.** The
  tracker's 300 ms linear transition is the only motion in product
  chrome. No spring, bounce, or scale.
- **Dark-mode variants.** Dark mode is a separate track per
  `00-tracker.md`. Primitives here use light-mode tokens only.
- **Cross-app `ui/` extraction.** If, after spec 20 lands, it's
  obvious a non-phone surface (e.g. the CMS admin) wants the same
  `PaneEmpty`, a separate PR lifts the component to
  `src/components/ui/EmptyState.vue` and re-exports from the phone
  path for back-compat. Not in this spec.
- **Accessibility audit of existing phone panes.** The primitives
  here ship with `role="status"` / `role="alert"` / `aria-hidden`
  where obvious; deep a11y work on legacy pane markup belongs to
  the per-pane specs.

## Risks / rollback

- **Risk — `BasePill` variant sprawl.** Spec 06's rationale was a
  closed variant list. Adding `ai` expands that list by one.
  Mitigation: document the full variant list in a top-of-file comment
  in `BasePill.vue` and require a foundation-spec-level change (i.e.,
  a new spec in this track) to add another. No ad-hoc additions.
- **Risk — skeleton contrast on `bg-crisiscleanup-smoke`.** The
  `PaneSkeleton` uses `bg-crisiscleanup-light-smoke` (#F2F3F4) shimmer
  blocks. On a pane-card with `bg-white` parent, that reads fine. On
  the page background (also smoke / light-smoke), shimmer contrast is
  too low — downstream specs must mount skeletons inside a pane card,
  not loose on the page. Document in each spec that needs it.
- **Risk — `role="status"` / `role="alert"` over-triggering screen
  readers.** `PaneEmpty` uses `role="status"` (polite) which is
  appropriate for a zero-row view. `PaneError` uses `role="alert"`
  (assertive) — correct for fetch failures but may be noisy if a
  pane re-fetches frequently. If consumers see SR spam, they can
  override via the `role` attribute prop (add as a `role?: string`
  prop in a follow-up spec only if it actually bites).
- **Rollback.** All four new files + the `BasePill.vue` diff + the
  tracker edit. No call sites changed, no tests changed outside the
  four new files. `git revert` the commit; app behavior is
  bit-identical.
