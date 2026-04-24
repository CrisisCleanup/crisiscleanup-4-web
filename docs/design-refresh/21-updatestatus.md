# 21 — UpdateStatus refresh

## Intent

`UpdateStatus.vue` is the call-completion form the volunteer fills
before hanging up — three status columns (**Answered**, **No
Answer**, **Skipped**), a notes textarea, and a Complete / Cancel
button pair. It's a mirror of the CurrentCall drift: two-layer card
nesting (`bg-white rounded-lg shadow-sm p-6` outer wrapping a
`rounded-md` inner grid), coloured-dot column markers, and per-item
styling that leans on `hover:scale-105 hover:shadow-md` + per-status
`rgba(color + '40')` tints that were hand-authored. Nothing here
matches the kit's flat-surface language.

This spec is a layout / token pass. It does not change the status
taxonomy (the three columns and their 15 status values stay), doesn't
touch the `onCompleteCall` / `onCancel` emit contract, and doesn't
refactor the `sortedValues` object (that data shape is consumed by
e2e tests and by the backend status ids).

## Before / After

| Concern | Current | Target |
|---|---|---|
| Outer wrapper | `<form class="bg-white rounded-lg shadow-sm p-6 w-full">` | `<form class="w-full flex flex-col gap-4">` — no card; children carry their own cards |
| Column grid | `grid grid-cols-1 md:grid-cols-3 gap-6 status-wrapper` with `max-height: 24rem; overflow-y: auto` + scoped scrollbar CSS | `grid grid-cols-1 md:grid-cols-3 gap-4` inside a single pane card (`bg-white rounded border border-crisiscleanup-grey-100 p-4`); **no max-height, no scroll** — the list is 15 items total and fits at every viewport |
| Column heading | coloured dot (`#15d671` / `#FAB92E` / `#F0F032`) + `font-semibold text-gray-700 text-sm uppercase tracking-wide` | 12 px uppercase letter-spaced micro-label (`text-[12px] tracking-[0.04em] font-semibold text-crisiscleanup-grey-900`). **No dot.** |
| Status chip | `px-3 py-2.5 rounded-md` with per-section `background: {color}40` (25 % opacity), `hover:scale-105 hover:shadow-md`, selected = `ring-2 ring-offset-2 ring-gray-600 shadow-md scale-105 font-medium` | `h-9 px-3 rounded border` row, neutral surface — `border-crisiscleanup-grey-100 bg-white hover:bg-crisiscleanup-smoke`, selected = `border-primary bg-primary-light font-semibold`. No scale, no ring. The per-state colour survives as a **2 px left border** on each chip, keyed to the three states: answered = `border-l-phone-outbound-dark`, no-answer = `border-l-[#FAB92E]` (amber — closest kit match), skipped = `border-l-crisiscleanup-grey-900` (neutral). |
| Notes textarea | `border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500` + scoped resize-none | `<base-textarea>` once available, or — since `BaseInput` exists post-spec 05 but there's no textarea wrapper — inline with the kit recipe: `border border-crisiscleanup-grey-100 rounded px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary resize-y min-h-[96px]`. 15 px body, 300 ms transition only |
| Notes label | `text-sm font-medium text-gray-700` | Micro-label recipe: 12 px uppercase letter-spaced |
| Buttons row | `mt-6 flex flex-wrap gap-3` with per-button `px-6 py-2.5 shadow-sm hover:shadow-md` | Pane card footer: `flex flex-wrap gap-2 justify-end`; Complete is `variant="solid" size="medium"`, Cancel is `variant="outline" size="medium"`. Drop the inline `px-6 py-2.5 shadow-sm hover:shadow-md` — the BaseButton variants from spec 04 already own sizing and elevation |
| Scoped `<style>` | 23 lines of webkit scrollbar CSS | **Remove** — no scroll container post-refresh |
| Emit contract | `onCompleteCall({ status, notes })`, `onCancel({ status, notes })` | **Unchanged** |
| `emitter.on('phone:clear_call')` reset | Keep verbatim | **Unchanged** |

## Files to touch

- **EDIT:** `src/components/phone/UpdateStatus.vue` — template swap + scoped style removal.
- **NO model changes.**
- **NO i18n key changes** — every string already exists under
  `phoneState.*`, `phoneStatus.*`, `phoneDashboard.*`, `actions.*`.
- **EDIT (tests):** if `test/unit/components/phone/UpdateStatus.test.ts`
  exists, update selectors that still hit `ring-2` class assertions
  or scroll-wrapper classes. If it doesn't exist yet, add one that
  asserts: (a) the 15 status chips render, (b) clicking a chip sets
  `status`, (c) `onCompleteCall` emits `{ status, notes }` with the
  current state. No new e2e.

## Implementation

### 1. New template

```vue
<template>
  <form class="w-full flex flex-col gap-4" @submit.prevent>
    <!-- Status grid pane -->
    <section
      class="bg-white rounded border border-crisiscleanup-grey-100 p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
      data-testid="testStatusSelectorDiv"
    >
      <div
        v-for="(section, key) in sortedValues"
        :key="key"
        class="flex flex-col gap-2 min-w-0"
      >
        <h3 class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
          {{ section.name }}
        </h3>
        <ul class="flex flex-col gap-1.5">
          <li v-for="item in section.values" :key="item.value">
            <button
              type="button"
              :data-testid="`testStatusOption_${item.value}`"
              :aria-pressed="item.value === status"
              class="w-full h-9 px-3 flex items-center gap-2 text-left text-[13px] rounded border bg-white transition"
              :class="[
                leftBorderClass(key),
                item.value === status
                  ? 'border-primary bg-primary-light font-semibold text-black'
                  : 'border-crisiscleanup-grey-100 hover:bg-crisiscleanup-smoke text-black',
              ]"
              @click="status = item.value"
            >
              {{ item.name_t }}
            </button>
          </li>
        </ul>
      </div>
    </section>

    <!-- Notes pane -->
    <section class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-2">
      <label
        for="update-status-notes"
        class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900"
      >
        {{ $t('phoneDashboard.notes') }}
      </label>
      <textarea
        id="update-status-notes"
        v-model="callNotes"
        data-testid="testCallNoteTextarea"
        rows="4"
        class="w-full border border-crisiscleanup-grey-100 rounded px-3 py-2 text-[15px] leading-snug resize-y min-h-[96px] focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary transition"
        :placeholder="$t('phoneDashboard.notes_placeholder')"
      />
    </section>

    <!-- Actions -->
    <div class="flex flex-wrap gap-2 justify-end">
      <base-button
        v-if="allowCancel"
        size="medium"
        variant="outline"
        :alt="$t('actions.cancel')"
        :action="() => $emit('onCancel', { status, notes: callNotes })"
        data-testid="testCancelUpdateStatusButton"
      >
        {{ $t('actions.cancel') }}
      </base-button>
      <base-button
        size="medium"
        variant="solid"
        :disabled="status === null"
        :alt="$t('phoneDashboard.complete_call')"
        :action="() => $emit('onCompleteCall', { status, notes: callNotes })"
        data-testid="testCompleteCallButton"
      >
        {{ $t('phoneDashboard.complete_call') }}
      </base-button>
    </div>
  </form>
</template>
```

### 2. Script additions

```ts
function leftBorderClass(key: keyof typeof sortedValues) {
  if (key === 'answered') return 'border-l-4 border-l-phone-outbound-dark';
  if (key === 'noAnswer') return 'border-l-4 border-l-[#FAB92E]';
  return 'border-l-4 border-l-crisiscleanup-grey-900';
}
```

The `#FAB92E` amber survives inline because there's no nearest-kit
token for it — keep the hex, match the colour from the current
implementation. If you'd rather tokenise it, add `crisiscleanup-amber:
#FAB92E` to `tailwind.config.cjs` in a separate follow-up.

Drop the `color` field from each section in `sortedValues` (no
longer rendered). Keep `name` and `values`.

### 3. Placeholder copy

Add one new i18n key:

| Key | English copy |
|---|---|
| `phoneDashboard.notes_placeholder` | "Add any context the next volunteer should know." |

The current placeholder reuses the label ("Notes") — that's fine
accessibility-wise but unhelpful as guidance. Use the new key;
fall back to the English literal until sync per spec 15's pattern.

### 4. Disabled state for Complete

`:disabled="status === null"` — prevents the volunteer from
submitting a completion without picking a status. Today the form
submits with `status: null` which is treated as "no update" by the
backend (confirmed by the default value). Disabling is a correctness
win; if ops reports they relied on the null-submit to skip a status
update, swap to a tooltip "Pick a status first" instead.

### 5. Scrollbar removal

Delete the entire `<style scoped lang="postcss">` block. The
`max-height: 24rem` was only there because the old wrapper was
nested inside the right-rail sidebar, which no longer applies. The
grid is 15 items total and fits at 1440 px and 390 px without
scrolling.

## Reuse

- `BaseButton` — `variant="solid"` + `variant="outline"` + `size="medium"`, all from spec 04.
- `phone-outbound-dark` Tailwind token for the answered left-border.
- `primary` / `primary-light` for the selected state (matches spec 18's sidebar tab and spec 20's case-card selected state).
- `crisiscleanup-smoke` for hover, `crisiscleanup-grey-100` for divider borders.
- `PhoneStatus` Vuex-ORM model — unchanged.
- `useEmitter` + `phone:clear_call` — unchanged.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` — clean.
- `pnpm dev`, on-call, open the completion form:
  - Three columns: Answered / No Answer / Skipped. Each chip is a
    36 px tall row with a 4 px left-border colour stripe and
    neutral-white surface. Hover is smoke; selected is yellow
    (`primary-light`) with a yellow border and bold text.
  - Notes textarea has a 2-ring focus glow (primary) when focused;
    15 px body text; resizes vertically.
  - Complete Call is disabled until a status is picked (greyed).
  - Picking "Answered — added" → Complete Call → confirm the emit
    fires `{ status: 1, notes: '...' }`.
  - Cancel (when `allowCancel` is true) still emits `onCancel` with
    the current status/notes.
- **1440 px** and **390 px**: both render. At 390 px the grid
  collapses to one column stacked vertically.
- `pnpm exec vitest run test/unit/components/phone/UpdateStatus.test.ts`
  — new assertions (see Files to touch) pass.

## Out of scope

- **Status taxonomy changes.** The 15 entries are a product decision;
  adding / renaming / reordering is a separate discussion.
- **Backend integration.** `onCompleteCall` payload shape is
  unchanged; `PhoneOutbound.updateStatus` wiring stays as-is.
- **Notes rich-text / mentions.** Plain textarea; no mention picker
  or markdown support.
- **Keyboard shortcuts** (e.g. number-key to pick a status). Easy
  win if requested, but out of scope here.
- **A "save draft" affordance.** `phone:clear_call` wipes the notes
  when the volunteer moves to the next call — intentional per
  existing behaviour.

## Risks / rollback

- **Risk — disabled Complete button breaking a workflow.** If ops
  relies on submitting a null status (there's a low-confidence
  chance they do), the disable gates that path. Mitigation: flip
  `:disabled` to a warning tooltip instead. Watch for the first
  bug report post-merge.
- **Risk — `sortedValues` object drop of `color`.** E2E selectors
  shouldn't reference inline styles, but grep to confirm:
  `rg -n 'sortedValues.*color|background:\s*#15d671|#FAB92E|#F0F032' test/`.
- **Risk — left-border hex literal for amber.** If design review
  wants it tokenised, add `crisiscleanup-amber` to
  `tailwind.config.cjs` in a follow-up; the hex is isolated to a
  single helper function so the refactor is a one-liner.
- **Rollback.** Revert `UpdateStatus.vue` — no shared components
  touched, no model or hook changes.
