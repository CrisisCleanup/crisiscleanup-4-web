# 29 — PhoneDoctor refresh

## Intent

`PhoneDoctor.vue` is the phone-connectivity diagnostic surface — it
lets volunteers run test calls, consult carrier-specific
remediation, and walk through six expandable troubleshooting
sections (call-issues checklist, voicemail issues, no-call issues,
"not playing nicely," press-1 issues, premature hangup, "nothing
worked"). It's the largest file in the phone tree (~1100 lines) and
carries a lot of state:

- `testCallConnected`, `phoneAccessToken`, step statuses, selected
  carrier, 4 or 5 boolean "showing*Issues" refs
- Axios calls to `/cms?tags=phone-doctor`, `/phone_agents/me`
- WebSocket availability check, `PhoneTestService` integration
- Role self-grant logic (`UserRole.api().post(/user_roles)` if the
  user isn't already a Phone Agent)

**This spec does NOT refactor the logic.** Spec 18 explicitly flags
"Phone doctor rework — `PhoneDoctor.vue` is 1100 lines of
diagnostics and has its own `h-204` layout. This spec only ensures
the pane hosts cleanly in the refreshed content column." Spec 29
inherits that line. We do the surface polish — pane recipe, section
cards, step-status pills, micro-labels, checklist primitives — and
call out a follow-up for a deeper refactor when product has budget.

## Before / After

### Overall layout

| Concern | Current | Target |
|---|---|---|
| Root | Bespoke layout with fixed `h-204` and nested panels | `<section class="w-full flex flex-col gap-4">` — each troubleshooting subsection is its own pane card; no wrapper card |
| Title | None in-component | Header pane: 12 px micro-label "Phone doctor" + `<LaStethoscope>` glyph at right |
| Step groups | Scattered flex containers for each of the 6 "showing*Issues" | Each group wrapped in a `<PaneDisclosure>` (spec 19) that starts closed except for the top checklist |

### Step-status rendering

| Concern | Current | Target |
|---|---|---|
| Step status | Strings `'pending' \| 'running' \| 'success' \| 'error'` rendered as text / icons ad hoc | `<BasePill>` mapping: pending → `dark`, running → `claimed`, success → `open`, error → `urgent`. The `STEP_STATUS` const keeps its values; add a local `stepVariant(status)` helper |
| Step row | Bespoke flex rows | `<li class="flex items-center gap-3 h-10 border-b border-crisiscleanup-grey-100 last:border-b-0">` with the step label on the left (13 px) and the pill on the right |

### Test-call section

| Concern | Current | Target |
|---|---|---|
| "Start test call" button | `base-button variant="solid"` with inline classes | Same button, no inline size overrides (spec 04 size="medium" handles it) |
| "Connected" confirmation | ad-hoc `div` with green text | `<BasePill variant="open">` + 15 px copy |
| Phone number entry | `BaseInput` for mobile number with validation | `BaseInput` per spec 05/09 — already refreshed in those specs |

### Carrier remediation dropdown

| Concern | Current | Target |
|---|---|---|
| Dropdown label | Inline text | Micro-label above the `<base-select>` |
| Content body | `v-html` of the selected CMS item | Unchanged; wrapped in a prose-style container: `class="prose prose-sm max-w-none"` (if `@tailwindcss/typography` is available — grep `prose` in `tailwind.config.cjs`). If not, `class="text-[15px] leading-relaxed"` |

### Troubleshooting checklist (top group)

| Concern | Current | Target |
|---|---|---|
| Item | Plain `<div>` with title + description | Accordion item via `<PaneDisclosure>`; title is 13 px semibold, description inside the body at 15 px |
| Icons | None | Optional left-icon slot (16×16, `ccu-icon`) — keep null unless design supplies icons |

## Files to touch

- **EDIT:** `src/components/phone/PhoneDoctor.vue` — template pass only; keep all script / state unchanged except the local `stepVariant(status)` helper.
- **NO new files.** (A future deep-refactor spec can split this into 6 sub-components; out of scope here.)
- **NO changes** to `PhoneTestService`, `UserRole`, or the CMS endpoint.

## Implementation

### 1. Add `stepVariant` helper

```ts
const STEP_VARIANT: Record<string, BasePillVariant> = {
  pending: 'dark',
  running: 'claimed',
  success: 'open',
  error: 'urgent',
};
function stepVariant(status: string) {
  return STEP_VARIANT[status] ?? 'dark';
}
```

### 2. Wrap the 6 issues groups

Each of the 6 refs (`showingVoicemailIssues`,
`showingNoCallIssues`, `showingNotPlayingNicelyIssues`,
`showingPressOneIssues`, `showingPrematureHangupIssues`, plus the
top checklist which is always visible) becomes a `PaneDisclosure`:

```vue
<PaneDisclosure
  name="vm-issues"
  :title="$t('phoneDoctor.voicemail_issues')"
  :start-open="showingVoicemailIssues"
  @toggle="showingVoicemailIssues = $event"
>
  <!-- existing internal markup -->
</PaneDisclosure>
```

If `PaneDisclosure` doesn't emit a `toggle` event (spec 19 doesn't
define one — `AccordionItem` manages state internally), drop the
`showing*Issues` refs and rely on the accordion's internal state
entirely. The refs exist today only to toggle visibility; they
carry no other semantics.

### 3. Top checklist as accordion

The `callIssuesTroubleshootingChecklist` array becomes a list of
nested `PaneDisclosure`s inside a single parent disclosure:

```vue
<PaneDisclosure :title="$t('phoneDoctor.call_issues_checklist')" start-open>
  <PaneDisclosure
    v-for="item in callIssuesTroubleshootingChecklist"
    :key="item.title"
    :name="item.title"
    :title="item.title"
    :start-open="false"
  >
    <p class="text-[15px] leading-relaxed whitespace-pre-line">
      {{ item.description }}
    </p>
  </PaneDisclosure>
</PaneDisclosure>
```

### 4. Test-call section

Keep the existing buttons and step rendering; wrap in a pane card:

```vue
<section class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3">
  <header class="flex items-center gap-2">
    <LaStethoscope class="w-5 h-5 flex-none" aria-hidden="true" />
    <h3 class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
      {{ $t('phoneDoctor.test_call') }}
    </h3>
    <BasePill v-if="testCallConnected" variant="open" class="ml-auto">
      {{ $t('phoneDoctor.connected') }}
    </BasePill>
  </header>
  <ul class="flex flex-col">
    <li
      v-for="step in steps"
      :key="step.id"
      class="flex items-center gap-3 h-10 border-b border-crisiscleanup-grey-100 last:border-b-0"
    >
      <span class="flex-1 text-[13px] text-black">{{ step.label }}</span>
      <BasePill :variant="stepVariant(step.status)">
        {{ $t(`phoneDoctor.step_status_${step.status}`) }}
      </BasePill>
    </li>
  </ul>
  <base-button
    variant="solid"
    size="medium"
    :disabled="!currentUser || testCallConnected"
    :action="startTest"
    :text="$t('phoneDoctor.start_test_call')"
  />
</section>
```

The existing `steps` array shape isn't visible in the reading I
did — keep whatever the current implementation uses; only the
render changes.

### 5. Carrier remediation pane

```vue
<section class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3">
  <label class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
    {{ $t('phoneDoctor.your_carrier') }}
  </label>
  <base-select
    v-model="selectedCarrier"
    :options="dropdownItems"
    item-key="id"
    label="title"
    class="w-full max-w-md"
    :placeholder="$t('phoneDoctor.select_carrier')"
  />
  <div
    v-if="carrierRemediation"
    class="text-[15px] leading-relaxed"
    v-html="carrierRemediation"
  />
</section>
```

### 6. Role self-grant flow

Unchanged. The existing `checkAgentRole` function keeps firing on
mount (or wherever it fires today). No surface work there.

### 7. i18n keys

If any of the copy below isn't already present, add:

| Key | English copy |
|---|---|
| `phoneDoctor.call_issues_checklist` | "Call issues checklist" |
| `phoneDoctor.test_call` | "Test call" |
| `phoneDoctor.connected` | "Connected" |
| `phoneDoctor.your_carrier` | "Your carrier" |
| `phoneDoctor.select_carrier` | "Select carrier" |
| `phoneDoctor.step_status_pending` | "Pending" |
| `phoneDoctor.step_status_running` | "Running" |
| `phoneDoctor.step_status_success` | "Done" |
| `phoneDoctor.step_status_error` | "Error" |
| `phoneDoctor.start_test_call` | "Start test call" |
| `phoneDoctor.voicemail_issues` | "Voicemail issues" |
| `phoneDoctor.no_call_issues` | "Not receiving calls" |
| `phoneDoctor.not_playing_nicely_issues` | "Not playing nicely" |
| `phoneDoctor.press_one_issues` | "Press-1 issues" |
| `phoneDoctor.premature_hangup_issues` | "Call ends too soon" |
| `phoneDoctor.nothing_worked` | "Nothing worked" |

Many of these already exist under `phoneDoctor.*` with different
casings — audit the file before adding duplicates.

## Reuse

- Spec 19: `PaneDisclosure`.
- Spec 06: `BasePill` for step status + language/carrier chips.
- `base-select`, `base-button`, `BaseInput` (all post-specs-04/05/11).
- `PhoneTestService`, `UserRole`, `Language` model — unchanged.
- `LaStethoscope` from `~icons/la/stethoscope` — already imported.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `pnpm dev`, open Phone Doctor tab:
  - Top "Call issues checklist" is expanded by default; four sub-items
    collapsed, expandable one at a time or many.
  - Test-call card: "Start test call" kicks off the stepper; each
    step shows a pill that transitions pending → running → success.
    If a step errors, the pill goes red.
  - Carrier dropdown populates from `/cms?tags=phone-doctor`; picking
    a carrier reveals the remediation HTML.
  - The 5 secondary issue groups are closed accordions; opening one
    reveals its internal markup (unchanged).
- Mobile (390 px): each pane stacks vertically; test-call stepper is
  still legible with pills on the right.

## Out of scope

- **Splitting `PhoneDoctor.vue` into sub-components.** 1100 lines is
  a smell; decomposition belongs to a dedicated refactor spec with
  product signoff on which pieces stay together.
- **Test-call flow logic.** The 6–8 step pipeline, websocket checks,
  agent-role grants — all unchanged.
- **CMS content editing.** The carrier remediation body is authored
  in the CMS; this spec only renders it.
- **Improving accessibility beyond what `PaneDisclosure` provides.**
  The native `<button>` accordion headers with proper `aria-expanded`
  is good enough for this pass.

## Risks / rollback

- **Risk — accordion internal state vs. `showing*Issues` refs.** If
  any external code reads those refs (grep first), replacing the
  conditional `v-if`s with accordion-internal state breaks that
  reader. Mitigation: keep the refs and pass their values into
  `start-open`; accordion then owns further toggling while the ref
  reflects the last-known state on mount.
- **Risk — step-status i18n keys.** If the existing copy already
  uses slightly different keys (e.g. `phoneDoctor.status.pending`
  rather than `phoneDoctor.step_status_pending`), reuse the
  existing path. Grep first; don't duplicate.
- **Risk — `v-html` XSS.** Carrier remediation comes from the CMS
  and is `v-html`'d today. This spec doesn't change that threat
  model; a follow-up hardening spec can sanitize.
- **Rollback.** Revert the single file; the component is
  self-contained.
