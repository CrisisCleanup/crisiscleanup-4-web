# 24 — Agent content polish

## Intent

Spec 18 already redesigns `Agent.vue`'s **layout** — three clusters
(status + mobile / languages / call-taking + extras + hangup) with
vertical dividers, a `BasePill` in place of the disabled "On Call"
button, and 32×32 hover tiles for the icon actions. That's the
chrome work.

This spec covers the **content inside the toolbar** that spec 18
didn't need to touch:

1. **`PhoneIndicator.vue`** — the bespoke status indicator left
   untouched because spec 18 said "verify its surface works on
   `bg-white` (currently renders fine)." Verify isn't a refresh;
   this spec does the actual visual polish if anything is out of
   line.
2. **`LanguageTag.vue`** — the tag component rendered for each of
   the agent's spoken languages. Same thing: specs 18 doesn't edit
   it, but the new toolbar surface changes the context it appears
   in.
3. **The `allowedCallsString` pill wording** — spec 18 uses
   `<BasePill variant="primary">{{ allowedCallsString }}</BasePill>`
   to replace the plain `{{ allowedCallsString }}` text. The copy
   today is `inbound_outbound` → "Inbound and Outbound" — long for
   a pill. This spec trims.
4. **Hover copy** on the three `ccu-icon` tiles (edit, help,
   hangup). Spec 18 adds `aria-label`s but relies on existing
   `$t('actions.edit')` etc., which don't explain *what* edit does.

Shipping this spec gives specs 18 + 24 a coherent **Agent** surface
without stacking on 18 further.

## Before / After

| Concern | Current | Target |
|---|---|---|
| `PhoneIndicator` visual | Bespoke colored circle (verify on light surface) | `w-2 h-2 rounded-full` dot in a 24×24 hit target; uses `phone-inbound-dark` when taking calls inbound-capable, `phone-outbound-dark` when outbound-capable, `crisiscleanup-grey-900` when away. One signal per state. |
| `LanguageTag` render | Looks like `Tag.vue` output (unverified — read file to confirm) — may carry a close button or a bespoke chip style | Closed-pill (non-closeable) at the toolbar site; re-use `BasePill variant="incident"` inline for language labels. Keep `LanguageTag.vue` itself for other mount points that do want the close button. |
| `allowedCallsString` copy | `phoneDashboard.inbound_outbound` = "Inbound and Outbound" (per current codebase) | Shorten: `phoneDashboard.inbound_outbound_short` = "Both". Keep the long form on the drop-down option labels (`BaseSelect` in spec 18). |
| Icon hover labels | `$t('actions.edit')` = "Edit", `$t('phoneDashboard.not_playing_nice_alt')` for help, `$t('actions.hangup')` = "Hang up" | Context-specific: `$t('phoneDashboard.edit_languages')`, keep `not_playing_nice_alt` (already specific), keep `actions.hangup` (already specific). Only `edit_languages` is new. |

## Files to touch

- **EDIT:** `src/components/phone/PhoneIndicator.vue` — token/state palette.
- **EDIT:** `src/components/phone/Agent.vue` — swap `<LanguageTag>` for inline `<BasePill variant="incident">` and the `allowedCallsString` pill copy.
- **EDIT:** `src/locales/en-us.json` — add `phoneDashboard.inbound_outbound_short` ("Both") and `phoneDashboard.edit_languages` ("Edit spoken languages"). If the repo streams locales from the backend, coordinate per spec 15's pattern.
- **EDIT (tests):** update whatever unit test covers `PhoneIndicator.vue` / `Agent.vue` if they assert on the pre-refresh palette. No new e2e — this is cosmetic.

## Implementation

### 1. `PhoneIndicator.vue`

Target markup (rewrite unless it's already close):

```vue
<template>
  <span
    class="w-6 h-6 grid place-items-center flex-none"
    :aria-label="ariaLabel"
    role="img"
  >
    <span
      class="w-2 h-2 rounded-full"
      :class="dotClass"
    />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import useConnectFirst from '@/hooks/useConnectFirst';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { isTakingCalls, isOnCall, isOutboundCall } = useConnectFirst();

const dotClass = computed(() => {
  if (!isTakingCalls.value) return 'bg-crisiscleanup-grey-900';
  if (isOnCall.value && isOutboundCall.value) return 'bg-phone-outbound-dark';
  return 'bg-phone-inbound-dark';
});
const ariaLabel = computed(() => {
  if (!isTakingCalls.value) return t('phoneDashboard.agent_away');
  return t('phoneDashboard.agent_taking_calls');
});
</script>
```

Two new i18n keys — `phoneDashboard.agent_away` ("Not taking calls")
and `phoneDashboard.agent_taking_calls` ("Taking calls"). The visual
dot is the signal; the aria-label gives screen readers the same
state.

If the existing `PhoneIndicator.vue` already does this with a
different palette or richer animation, only change the palette to
the three tokens above — don't regress other behaviour.

### 2. `LanguageTag` → inline pill in Agent

In `Agent.vue`'s centre cluster (spec 18's "languages" block),
replace:

```diff
- <template v-for="l in languages" :key="`l_${l?.id ?? 'x'}`">
-   <div v-if="l?.id" class="flex flex-col tag-container">
-     <LanguageTag class="tag-item mx-0.5" :language-id="l.id" />
-   </div>
- </template>
+ <template v-for="l in languages" :key="`l_${l?.id ?? 'x'}`">
+   <BasePill
+     v-if="l?.id"
+     variant="incident"
+     class="shrink-0"
+   >
+     {{ languageLabel(l.id) }}
+   </BasePill>
+ </template>
```

With a small helper (co-located in `Agent.vue` or lifted from an
existing language-lookup util — grep `Language` model / lookup first):

```ts
import Language from '@/models/Language';
function languageLabel(id: number) {
  const lang = Language.find(id) as Language | null;
  return lang?.name_t ?? String(id);
}
```

`LanguageTag.vue` itself stays in the codebase for any consumer that
wants the close button. Don't delete it.

### 3. `allowedCallsString` shortening

In `Agent.vue`:

```diff
 const allowedCallsString = computed(() => {
   switch (props.allowedCallType) {
     case AllowedCallType.BOTH:
-      return t('phoneDashboard.inbound_outbound');
+      return t('phoneDashboard.inbound_outbound_short');
     case AllowedCallType.INBOUND_ONLY:
       return t('phoneDashboard.inbound_only');
     case AllowedCallType.OUTBOUND_ONLY:
       return t('phoneDashboard.outbound_only');
     default:
-      return t('phoneDashboard.inbound_outbound');
+      return t('phoneDashboard.inbound_outbound_short');
   }
 });
```

The drop-down options (in `BaseSelect` per spec 18) keep the long
form — the user needs the full explanation *before* they pick; the
toolbar pill communicates the *current* state where shorter reads
better.

### 4. New i18n keys

| Key | English copy |
|---|---|
| `phoneDashboard.inbound_outbound_short` | "Both" |
| `phoneDashboard.edit_languages` | "Edit spoken languages" |
| `phoneDashboard.agent_away` | "Not taking calls" |
| `phoneDashboard.agent_taking_calls` | "Taking calls" |

In `Agent.vue`, change the edit-icon button's `aria-label` from
`$t('actions.edit')` to `$t('phoneDashboard.edit_languages')`.

## Reuse

- `BasePill` (spec 06) — `variant="incident"` (light yellow) for language chips, matches the incident-context colour family.
- `useConnectFirst` — unchanged; `PhoneIndicator` re-subscribes to three refs already exposed.
- `Language` Vuex-ORM model — unchanged; looked up via `.find(id)`.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` — clean.
- `pnpm dev` at `/incident/:id/phone`:
  - Offline state (not taking calls): indicator dot is neutral grey.
  - Taking calls, idle: dot is inbound-dark (#05A4D2).
  - On an outbound call: dot switches to outbound-dark (#419954).
  - Languages cluster renders language chips as light-yellow pills, no close buttons, wrapping gracefully when the agent speaks 4+ languages.
  - "Both" appears in the small pill next to the indicator when allowed-call-type is `BOTH`. The drop-down still reads "Inbound and Outbound" / "Inbound only" / "Outbound only".
  - Edit icon tooltip / screen-reader label is "Edit spoken languages."
- Screen reader pass (VoiceOver, NVDA): tabbing to the indicator announces "Taking calls" / "Not taking calls."

## Out of scope

- Changing how an agent's languages are persisted. The model and the `EditAgentModal` stay as-is.
- Adding a pulsing animation to `PhoneIndicator`. The tracker forbids non-motion cosmetic loops; the color signal is the state.
- Adding a new status (e.g. "break") — product decision.
- Fully deleting `LanguageTag.vue`. Other consumers (e.g. filter panels) still use it with the close button; a separate audit/cleanup spec can decide.

## Risks / rollback

- **Risk — `Language.find(id)` reactivity.** Vuex-ORM models reactively update, but on a cold load the agent's languages can resolve before the Language collection is populated; the helper returns `String(id)` until the name arrives. That's a one-frame flash of "1" / "2"; acceptable. If it's visually noisy, add a `computed` `Language.query().find(…)` with a `v-if` guard.
- **Risk — `LanguageTag.vue` orphan.** If the audit shows no other consumer, the component becomes dead weight. Leaving it is safe (100 lines of unused code in a long-lived repo is not a fire); deleting it belongs to a cleanup spec, not this one.
- **Rollback.** Revert the two-to-three file diff; no model, hook, or routing changes.
