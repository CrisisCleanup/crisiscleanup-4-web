# 30 — ManualDialer refresh

## Intent

`ManualDialer.vue` lets a volunteer place an outbound call by typing
a number + country code. Today it's a centered card with:

- Three stacked `<base-text>` lines (title, "hidden caller ID,"
  "no late outbound calls")
- A 6-column grid: 2-col country-code select + 4-col phone input
- A "Dial / Dialing" button (disabled when `dialing`, `!phone`,
  `after10pmEastern`, or `!hasActiveHotline`, unless
  `development_mode`)
- An "or" divider
- A "Remove from queue" outline button

The centered column + `<base-text variant="h2">` run-on copy reads
like an onboarding step rather than a dense tool. Post-refresh it
should look like the other phone panes — micro-label header,
labeled form fields, and a primary/secondary action cluster.

## Before / After

| Concern | Current | Target |
|---|---|---|
| Outer | `<div class="text-center flex flex-col items-center gap-4">` | `<section class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-4">` — pane card recipe |
| Title | `<base-text variant="h2" class="my-2">` | 12 px uppercase micro-label |
| Sub-copy | Two `<base-text>` lines at body size | Consolidate into a single 13 px note: "Your caller ID is hidden. Dialing is blocked after 10 PM Eastern." |
| Country-code + phone grid | `grid-cols-6 gap-1` with `col-span-2` + `col-span-4` | Labeled fields side-by-side: `flex gap-2 items-end`; country code is a 96 px wide select, phone fills the rest |
| Country-code select | `<base-select v-model indicator-icon="caret-down">` with flag + code slot | Same; the 2026-pinned flag/code option slot keeps the visual scan |
| Phone input | `<PhoneNumberInput>` (already spec-05-compliant) | Same; add a matching 12 px micro-label "Phone number" above |
| Dial button | `variant="solid" class="px-5 py-2 my-3 w-full"` | `variant="solid" size="medium"` — spec-04 sizing; `w-full` stays |
| "or" divider | Plain text `{{ $t('phoneDashboard.or') }}` | 1 px horizontal rule with "or" centered: `<div class="flex items-center gap-3 text-[12px] uppercase tracking-[0.04em] text-crisiscleanup-grey-900"><hr class="flex-1 border-crisiscleanup-grey-100" /><span>or</span><hr class="flex-1 border-crisiscleanup-grey-100" /></div>` |
| Remove button | `variant="outline" class="px-5 py-2 my-3 w-full"` | `variant="outline" size="medium"` — same full-width behaviour via `w-full` |
| After-10 PM state | Disabled with no visible reason | Add a `<PaneError>` above the form when `after10pmEastern && !can('development_mode')`, title "Dialing is disabled after 10 PM Eastern" with no retry — users understand the time-window |
| No active hotline state | Disabled with no visible reason | Similar — `<PaneError>` "No active hotline" |

## Files to touch

- **EDIT:** `src/components/phone/ManualDialer.vue` — template + import adjustments.
- **NO** model / hook changes.

## Implementation

```vue
<template>
  <section
    class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-4"
    data-testid="testManualDialer"
  >
    <header class="flex flex-col gap-1">
      <h2
        class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900"
        data-testid="testManualDialerContent"
      >
        {{ $t('phoneDashboard.manual_dialer') }}
      </h2>
      <p class="text-[13px] text-crisiscleanup-grey-900">
        {{ $t('phoneDashboard.manual_dialer_note') }}
      </p>
    </header>

    <PaneError
      v-if="!hasActiveHotline && !can('development_mode')"
      :title="$t('phoneDashboard.no_active_hotline')"
      :description="$t('phoneDashboard.no_active_hotline_hint')"
    />
    <PaneError
      v-else-if="after10pmEastern && !can('development_mode')"
      :title="$t('phoneDashboard.after_hours_block')"
    />

    <div class="flex flex-col gap-2">
      <div class="grid grid-cols-[96px_1fr] gap-2">
        <div class="flex flex-col gap-1">
          <label class="text-[11px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
            {{ $t('phoneDashboard.code') }}
          </label>
          <base-select
            v-model="selectedCountryCode"
            data-testid="testCountryCodeSelect"
            :options="countryCodes"
            indicator-icon="caret-down"
            item-key="code"
            label="code"
            :placeholder="$t('phoneDashboard.code')"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <font-awesome-icon :icon="option.icon" class="w-5 h-3.5" />
                <span class="text-[13px]">{{ option.code }}</span>
              </div>
            </template>
          </base-select>
        </div>
        <div class="flex flex-col gap-1 min-w-0">
          <label class="text-[11px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
            {{ $t('phoneDashboard.phone_number') }}
          </label>
          <PhoneNumberInput
            v-model="phone"
            data-testid="testPhoneNumberTextInput"
            size="large"
            :placeholder="$t('phoneDashboard.phone_number')"
          />
        </div>
      </div>
      <base-button
        variant="solid"
        size="medium"
        class="w-full"
        data-testid="testDialingButton"
        :disabled="dialDisabled"
        :text="dialing ? $t('phoneDashboard.dialing') : $t('phoneDashboard.dial')"
        @click="handleDial"
      />
    </div>

    <div class="flex items-center gap-3 text-[12px] uppercase tracking-[0.04em] text-crisiscleanup-grey-900">
      <hr class="flex-1 border-crisiscleanup-grey-100" />
      <span>{{ $t('phoneDashboard.or') }}</span>
      <hr class="flex-1 border-crisiscleanup-grey-100" />
    </div>

    <base-button
      variant="outline"
      size="medium"
      class="w-full"
      data-testid="testDialHiddenCallerIdButton"
      :text="$t('phoneDashboard.remove_from_queue')"
      @click="removeNumberFromQueue"
    />
  </section>
</template>
```

Add a `dialDisabled` computed so the binding reads clean:

```ts
const dialDisabled = computed(() =>
  (props.dialing || !phone.value || after10pmEastern.value || !hasActiveHotline.value) &&
  !$can('development_mode'),
);
```

### New i18n keys

| Key | English copy |
|---|---|
| `phoneDashboard.manual_dialer_note` | "Your caller ID is hidden. Dialing is blocked after 10 PM Eastern." |
| `phoneDashboard.no_active_hotline` | "No active hotline" |
| `phoneDashboard.no_active_hotline_hint` | "A hotline must be live on at least one incident to dial out." |
| `phoneDashboard.after_hours_block` | "Dialing is disabled after 10 PM Eastern" |

Drop the `phoneDashboard.manual_dial_hidden_caller_id` and
`phoneDashboard.no_late_outbound_calls` keys from the template —
they're superseded by `manual_dialer_note`. Leave the keys in the
locale bundle (harmless dead data; other surfaces might reuse).

## Reuse

- Spec 19 `PaneError` for the disabled reasons.
- `PhoneNumberInput`, `BaseSelect`, `BaseButton` — unchanged.
- `useActiveHotlines`, `useAcl`, `moment` — unchanged.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `pnpm dev`:
  - Before 10 PM Eastern, with an active hotline: Dial button
    enabled; clicking emits `onDial` with `${code}${phone}`.
  - Turn the clock past 10 PM (or mock `moment`): `PaneError`
    appears, button disabled, "Remove from queue" still enabled
    (intentional — queue management isn't time-gated).
  - With no active hotline: other `PaneError` appears.
  - In `development_mode`: both blocks bypass.

## Out of scope

- Adding more country codes. The array is currently 1 entry (`+1`)
  and that's a product decision.
- SMS shortcuts, speed-dial lists — not in the product today.
- `PhoneNumberInput` internal changes.

## Risks / rollback

- **Risk — dropping the two sub-copy lines into one string.** If
  copy review wants them on separate visual lines, wrap in
  `<br />` or split the string on the FE side. Trivial to reverse.
- **Risk — `remove_from_queue` gate.** Today the remove button is
  always enabled; keeping it enabled during after-hours is
  intentional per the current behaviour. If ops wants to gate it,
  add `:disabled="!phone"` in a follow-up.
- **Rollback.** Revert single file.
