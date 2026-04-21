# 06 — Pills & badges

## Intent

Introduce **`BasePill.vue`** — a single component that renders the kit's
status-pill taxonomy (`open`, `claimed`, `in-progress`, `completed`, `urgent`,
plus utility variants `new` and `dark`). Today the codebase has:

- `Badge.vue` — a fixed-height circle for numeric counters (fine, keep).
- `Tag.vue` — a closeable user/filter tag (fine, keep).
- No unified status-pill component; status visuals are scattered inline spans.

This spec does **not** replace `Badge` or `Tag`. They serve different roles.

## Before / After

**New component: `src/components/BasePill.vue`**

| Variant | Background | Text | Dot | Usage |
|---|---|---|---|---|
| `open` | `crisiscleanup-phone-inbound-light` (#C9EBF5) | `phone-inbound-dark` (#05A4D2) | `phone-inbound-dark` | cases newly reported |
| `claimed` | `#FFF4C2` (custom — add as `claimed-light` if you prefer token-purity) | `#7A5A00` | `#d79e00` | cases claimed, not started |
| `in-progress` | `phone-outbound-light` (#C6F0CF) | `phone-outbound-dark` (#419954) | `phone-outbound-dark` | active work |
| `completed` | `#E3E3E3` | `#444` | `#777` | done |
| `urgent` | `#FCD9DA` | `crisiscleanup-red-900` | `crisiscleanup-red-900` | flagged priority |
| `new` | `crisiscleanup-red-700` (#DA1B1C) | white | — (no dot, small square) | the "New" feature marker (already used in `NavButton.vue:14-17`) |
| `dark` | black | white | — | role chips, e.g. "Phone Agent" |
| `incident` | `primary-light` | black | — | incident label in contexts |

**Recipe** (for the non-`new` variants):

```
inline-flex items-center gap-1.5 px-2.5 py-[3px]
rounded-full text-[11px] font-bold leading-[1.4] whitespace-nowrap
```

**Reference:** `kit.css:90-96`, `preview/badges.html`.

## Files to touch

- **NEW:** `src/components/BasePill.vue`.
- Optional: `src/main.ts` to globally register if desired (follow the existing
  global-register pattern used for `Badge`/`Tag` — grep `app.component(` in
  main.ts).
- Call-site migrations (separate commit inside the same PR):
  - `src/components/navigation/NavButton.vue:10-18` — the "New" badge already
    matches the `new` variant recipe; swap to `<BasePill variant="new">`.
  - Grep for inline status rendering:
    ```bash
    grep -rn 'rounded-full' src/ | grep -iE 'status|open|claimed|complete|urgent|progress' | head
    ```

## Implementation

1. Draft `BasePill.vue`:

   ```vue
   <template>
     <span :class="['ccu-pill', `ccu-pill--${variant}`]">
       <span v-if="showDot && !isSquareVariant" class="ccu-pill__dot" />
       <slot />
     </span>
   </template>

   <script lang="ts" setup>
   type Variant =
     | 'open' | 'claimed' | 'in-progress' | 'completed' | 'urgent'
     | 'new'  | 'dark'    | 'incident';

   const props = withDefaults(
     defineProps<{ variant?: Variant; showDot?: boolean }>(),
     { variant: 'dark', showDot: true },
   );
   const isSquareVariant = computed(() => props.variant === 'new');
   </script>

   <style scoped>
   .ccu-pill {
     @apply inline-flex items-center gap-1.5 px-2.5 rounded-full
            text-[11px] font-bold leading-[1.4] whitespace-nowrap;
     padding-top: 3px;
     padding-bottom: 3px;
   }
   .ccu-pill__dot {
     width: 6px; height: 6px; border-radius: 50%;
     background: currentColor; opacity: 0.85;
   }
   .ccu-pill--open       { @apply bg-crisiscleanup-phone-inbound-light  text-crisiscleanup-phone-inbound-dark; }
   .ccu-pill--in-progress{ @apply bg-crisiscleanup-phone-outbound-light text-crisiscleanup-phone-outbound-dark; }
   .ccu-pill--urgent     { background: #FCD9DA; @apply text-crisiscleanup-red-900; }
   .ccu-pill--claimed    { background: #FFF4C2; color: #7A5A00; }
   .ccu-pill--completed  { background: #E3E3E3; color: #444; }
   .ccu-pill--dark       { background: #000; color: #fff; }
   .ccu-pill--incident   { @apply bg-primary-light text-black; }
   .ccu-pill--new {
     @apply bg-crisiscleanup-red-700 text-white uppercase;
     border-radius: 3px;
     padding: 2px 8px;
     font-size: 10px;
     letter-spacing: 0.04em;
   }
   </style>
   </vue>
   ```

2. Add two tailwind color families if you don't want the hex literals for
   `claimed`/`completed`:
   - `claimed-light: #FFF4C2`, `claimed-dark: #7A5A00`.
   - Skip for now — the hexes are low-risk and quoted from the kit verbatim.
   *(Reminder: no `tailwind.config.cjs` changes in this track unless you
   decide to commit the tokens.)*

3. Global-register in `src/main.ts` (optional): `app.component('BasePill', BasePill)`.
   Follow whichever pattern is already used for `<badge>` vs explicit imports.

4. Migrate the `NavButton` "New" badge:

   ```diff
   - <badge
   -   v-if="route.newBadge"
   -   data-testid="testNewBadgeIcon"
   -   width="2rem"
   -   height="1rem"
   -   class="text-white bg-crisiscleanup-red-700 mx-1 absolute -top-0.5 -right-8 p-3"
   -   :title="$t('info.new_badge')"
   - >{{ $t('info.new') }}</badge>
   + <BasePill
   +   v-if="route.newBadge"
   +   variant="new"
   +   data-testid="testNewBadgeIcon"
   +   class="absolute -top-0.5 -right-8"
   +   :title="$t('info.new_badge')"
   + >{{ $t('info.new') }}</BasePill>
   ```

5. Audit status-ish usages (grep from the table above); convert the ones that
   clearly map to a variant. Leave truly custom ones alone — the pill set is
   purposefully small.

## Reuse

- Tokens: `crisiscleanup-phone-{inbound,outbound}-{light,dark}`,
  `crisiscleanup-red-{700,900}`, `primary-light` — all already defined.
- `Badge.vue` (counters) and `Tag.vue` (closeable) — keep, don't replace.

## Verification

- `pnpm dev` → `/cases` → status column renders pills in each variant.
- Dashboard "New" nav badge appears as before (no layout shift).
- `pnpm typecheck` — `Variant` union tightens misuse.
- `pnpm lint` — clean.
- Screenshot `/tmp/ccu-design/.../preview/badges.html` in a browser; visually
  compare.

## Out of scope

- Removing `Badge.vue` or `Tag.vue` — different roles, keep.
- Animated pulsing dot (reserved for the phone indicator in spec 02).
- Priority "flag" icon on cases rows (separate visual, not in the pill set).
- i18n of variant names — variants are style keys, not UI text.

## Risks / rollback

- **Risk:** `NavButton` migration may alter e2e selectors. The spec keeps
  `data-testid="testNewBadgeIcon"` identical.
- **Risk:** palette drift if teams start inventing new variants. Document the
  closed variant list in the component's top comment; reject new variants in
  review.
- **Rollback:** deleting `BasePill.vue` and reverting the `NavButton` diff
  leaves the app exactly as before.
