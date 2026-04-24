# 20 — CurrentCall refresh + voicemail panel

## Intent

`CurrentCall.vue` is the pane volunteers land on the moment a call
connects. It carries three content regions today — **Suggested
Script**, **Existing Cases**, **FAQ** — each dressed with a
`bg-gray-50 rounded-lg p-4` outer card, a `bg-white rounded-md
shadow-sm` inner card, and a coloured indicator dot (blue / purple /
green) beside the column title. The result reads like three
separately-designed widgets stapled together; nothing in the kit uses
coloured dots as category markers, and the two-layer card nesting
(outer grey, inner white with its own shadow) doesn't match the
single-signature surface from spec 07.

At the same time, the backend is now returning four new fields on
`PhoneOutboundSerializer`: `vm_transcription` (existing but never
surfaced on the FE), `vm_summary` (AI-generated one-paragraph summary),
`caller_vm_count` (count of all voicemails from the caller), and
`caller_vm_history` (up to 10 prior summaries). Today the FE stores
`vm_url` on the `PhoneOutbound` model as an unused string and renders
**nothing** about voicemails in any pane. For callback calls the
volunteer has been working blind — the survivor's recorded voicemail
was never in the UI.

This spec does two things in one PR because they're intertwined:

1. **Refresh `CurrentCall.vue`** to the pane-card recipe from spec 19
   (single-layer white pane on smoke page, 12 px uppercase micro-label
   headings, no colour dots).
2. **Add a voicemail panel** that surfaces `vm_url`, `vm_transcription`,
   `vm_summary`, `caller_vm_count`, and `caller_vm_history` whenever
   any of them are populated on the current outbound.

The voicemail panel is the first consumer of spec 19's primitives
(`PaneEmpty`, `PaneSkeleton`, `PaneDisclosure`, the `ai` `BasePill`
variant) and the first caller of the pane-card / micro-callout
recipes.

## Before / After

| Concern | Current | Target |
|---|---|---|
| Outer wrapper | `bg-white rounded-lg shadow-sm p-6 w-full` | `w-full h-full min-h-0 flex flex-col gap-4 overflow-y-auto` — panes stand on their own cards, no wrapping card-in-card. `PhoneOverlay` mounts CurrentCall with `class="p-4 bg-crisiscleanup-smoke h-full"` (was `p-2 bg-crisiscleanup-green-800/95 h-full` — the green wrapper clashed with bordered white cards). The smoke background is spec 19's pane-card backdrop. `overflow-y-auto min-h-0` is load-bearing — without it, the grid + optional voicemail pane together exceed the parent height and push content past the viewport edge. |
| Details header | inline flex row with `font-semibold text-lg text-gray-800` title + green-dot call count + pipe separator + day count | Pane card: title "Call details" (12 px uppercase), right-aligned summary chips built from `BasePill` — `<BasePill variant="dark">{{ n }} calls</BasePill>` (count emphasis) + `<BasePill variant="incident">{{ days }} days</BasePill>` (one yellow chip per pane, per spec 19's variant-usage convention). No green dot, no literal `|` separator. |
| Column surface | `bg-gray-50 rounded-lg p-4` outer + `bg-white rounded-md shadow-sm p-4` inner (two-layer nesting) | Single-layer pane card per spec 19's updated recipe: `bg-white rounded border border-crisiscleanup-grey-100 p-4`, on a `bg-crisiscleanup-smoke` page. No grey outer, no drop shadow. |
| Column heading | blue/purple/green dot + `font-semibold text-gray-700 text-sm uppercase tracking-wide` | 12 px uppercase letter-spaced micro-label (`text-[12px] tracking-[0.04em] font-semibold text-crisiscleanup-grey-900`). No dot. |
| Grid | `grid-cols-1 lg:grid-cols-3 gap-6` — same three columns always | **Suggested Script gets its own full-width row on top**, Cases + FAQ share a `grid grid-cols-1 lg:grid-cols-2 gap-4` row below. Rationale: the script is assembled from up to four concatenated sub-scripts (inbound greeting, voicemail callback, manage-expectations block, handoff close) — at a third-width column it wraps into a tall narrow block that crowds Cases and FAQ. Full-width fewer-but-longer lines read faster and let the script *extend downward* without pushing the siblings. The script body is capped at `max-h-[50vh] overflow-y-auto` so a four-script concatenation scrolls inside its own card. Voicemail pane stacks *below* the 2-col row when present, capped at `max-h-[32rem]` with internal scroll. `gap-6` → `gap-4` to match spec 19's pane-grid recipe. |
| Overlay height | PhoneOverlay's absolute container was `md:h-auto` (content-driven), so any tall CurrentCall content pushed the whole overlay past the viewport bottom. | Add `md:max-h-[calc(100vh-12rem)]` to `PhoneOverlay.vue`'s absolute inset-0 container (same viewport-aware calc the sibling aside already uses). With the parent capped, `h-full` cascades correctly through the left column → `flex-grow` body → `CurrentCall`, and CurrentCall's own `overflow-y-auto min-h-0` finally has something bounded to clip against. |
| Existing-cases scroll area | `h-60 sm:h-80 lg:h-96 overflow-auto bg-white rounded-md shadow-sm` inside the grey outer | Drop the inner card; scrollable list sits directly inside the pane card (`max-h-80 overflow-auto`). Cards inside the list stay as-is (one-level nesting is fine for list items). |
| Case card | `p-3 border rounded-md hover:shadow-md hover:border-gray-400`, selected = `border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500` | `p-3 border border-crisiscleanup-grey-100 rounded hover:bg-crisiscleanup-smoke transition`, selected = `border-primary bg-primary-light` (matches kit yellow selected state from spec 18). No ring, no custom hover shadow. |
| FAQ inner card | `bg-white rounded-md shadow-sm p-4` around `<PhoneFaqRAG />` | Drop the inner card; `<PhoneFaqRAG />` mounts directly inside the pane card's content area. |
| Custom scrollbar | 25 lines of scoped CSS re-implementing Chrome / Firefox scrollbar thumbs | **Remove.** The one place it's needed (existing cases list) becomes a standard `overflow-auto` with native scrollbars — consistent with every other scroll surface in the refresh. |
| Empty "no cases found" | nothing rendered when `cases.length === 0` | `<PaneEmpty>` with copy "No recent cases" — consumes spec 19's primitive. |
| Voicemail panel | **does not exist** | New section above the grid; see below. |

### Voicemail panel anatomy

Rendered when `hasVoicemailContext` is truthy. Shape (top → bottom):

```
┌ Voicemail pane card ──────────────────────────────────────────────┐
│ [micro-label: VOICEMAIL]  ·  [AI BasePill] when vm_summary        │
│                                                                    │
│ ┌ micro-callout ────────────────────────────────────────────┐     │
│ │ "3 prior voicemails from this caller"   [BasePill: 3]    │     │ ← only when caller_vm_count > 1
│ └───────────────────────────────────────────────────────────┘     │
│                                                                    │
│ ┌ summary block ─────────────────────────────────────────────┐    │
│ │ AI-generated summary paragraph (15 px body, leading-snug). │    │
│ │ PaneSkeleton variant="block" when vm_url present but       │    │
│ │ vm_summary is null.                                        │    │
│ └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│ <PaneDisclosure title="Play recording" count=undefined>            │ ← only when vm_url
│   <audio controls :src="vm_url" class="w-full" />                  │
│ </PaneDisclosure>                                                  │
│                                                                    │
│ <PaneDisclosure title="Transcript" count=undefined>                │ ← only when vm_transcription
│   15 px body, whitespace-pre-line.                                 │
│ </PaneDisclosure>                                                  │
│                                                                    │
│ <PaneDisclosure title="Prior voicemails" :count="history.length">  │ ← only when caller_vm_history.length
│   for each item: date header + summary + nested "Transcript"       │
│   PaneDisclosure when item.vm_transcription is set.                │
│ </PaneDisclosure>                                                  │
└────────────────────────────────────────────────────────────────────┘
```

The panel is **collapsed by default** for both the "Play recording"
and "Transcript" disclosures — with the summary paragraph above, the
transcript is verification material one click away, not the primary
read. The prior-voicemails list is flat (no outer accordion — the
pane's own `max-h-[32rem] overflow-auto` wrapper provides the scroll);
each item shows date + source pill + summary, with a nested "Transcript"
disclosure inside when `item.vm_transcription` is populated.

## Files to touch

- **NEW:** `src/components/phone/CurrentCallVoicemail.vue` — the
  voicemail panel. Lives next to `CurrentCall.vue` so the parent page
  keeps the one-pane-per-file shape; child component is injected via a
  `<CurrentCallVoicemail v-if="hasVoicemailContext" :outbound="call" />`.
- **EDIT:** `src/components/phone/CurrentCall.vue` — replace the
  three-column wrapper / surfaces per the Before/After table; mount
  the voicemail child; swap local markup for spec 19 primitives.
- **EDIT:** `src/models/PhoneOutbound.ts` — add four fields to
  `static fields()`:
  - `vm_transcription: this.attr(null)`,
  - `vm_summary: this.attr(null)`,
  - `caller_vm_count: this.attr(0)`,
  - `caller_vm_history: this.attr([])`.
  Also add the matching TypeScript declarations at the top (lines
  9–21 area): `vm_transcription!: string | null;`, etc. Leave
  `vm_url` alone.
- **NEW (hook):** `src/hooks/phone/useVoicemailContext.ts` — composable
  that takes the outbound ref and returns `{ hasVoicemail, isPending,
  summary, transcription, audioUrl, priorCount, priorHistory }`. Lets
  the child component stay dumb and lets `CurrentCall.vue` ask "is
  there anything to show?" without groping around the outbound shape.
- **NEW (tests):**
  - `test/unit/components/phone/CurrentCallVoicemail.test.ts` —
    renders all 5 shapes from the "Edge cases to test" matrix
    (first-time caller with summary, first-time caller pending,
    repeat caller with prior history, opted-out caller, calldown
    with no VM).
  - `test/unit/hooks/phone/useVoicemailContext.test.ts` — pure logic.
  - Update `test/unit/models/PhoneOutbound.test.ts` — assert the four
    new fields round-trip on `getNextOutbound`.
- **EDIT:** `test/e2e/pages/phone.test.ts` — add one `@development`
  e2e that hits `GET /phone_outbound?next={incident}` on a seeded
  DNIS and asserts the summary renders, the transcript disclosure
  opens, and the prior-voicemails accordion shows the seeded row.
  (Backend team to confirm the seeded DNIS — listed in the guide's
  "Quick setup.")
- **EDIT:** `src/locales/en-us.json` (or the equivalent shipped en-us
  bundle) — add keys listed in the "i18n" section below. If the repo
  streams locales from the backend (per
  `src/services/i18n.service.ts`), add the keys to the backend
  strings-export instead and leave the FE to fall back to the key
  literal until sync — same pattern spec 15 used.

## Implementation

### 1. Model update — `PhoneOutbound.ts` + `models/types/index.ts`

Per the live `getNextOutbound` payload, VM fields split across two
objects: the current call's `PhoneOutbound` carries `vm_url`,
`vm_transcription`, `vm_summary`; the caller's `PhoneDnisResult` carries
`caller_vm_count` and `caller_vm_history`.

```diff
 // src/models/PhoneOutbound.ts
 export default class PhoneOutbound extends CCUModel {
   static entity = 'phone_outbound';
   // …
+  vm_url!: string | null;
+  vm_transcription!: string | null;
+  vm_summary!: string | null;

   static fields() {
     return {
       id: this.attr(''),
       phone_number: this.attr(''),
-      vm_url: this.attr(''),
+      vm_url: this.attr(null),
+      vm_transcription: this.attr(null),
+      vm_summary: this.attr(null),
       call_type: this.attr(''),
       // …
     };
   }
 }
```

```diff
 // src/models/types/index.ts
+export interface CallerVmHistoryItem {
+  id: number;
+  source: 'inbound' | 'outbound';
+  created_at: string;
+  vm_summary: string;
+  vm_transcription: string | null;
+}
+
 export interface PhoneDnisResult {
   // …
   worksites: any[];
+  caller_vm_count?: number;
+  caller_vm_history?: CallerVmHistoryItem[];
 }
```

`vm_url` default flips from `''` to `null` so "no VM" has one
representation, not two. Grep `vm_url` usage first to confirm nothing
checks `=== ''` (the exploration map says only the model declares it
— nothing renders it — so this should be safe).

### 2. `useVoicemailContext` composable

`src/hooks/phone/useVoicemailContext.ts`:

```ts
import type { MaybeRef } from '@vueuse/core';
import { computed, unref } from 'vue';
import type PhoneOutbound from '@/models/PhoneOutbound';
import type { CallerVmHistoryItem, PhoneDnisResult } from '@/models/types';

export interface VoicemailContext {
  hasVoicemail: boolean;
  audioUrl: string | null;
  transcription: string | null;
  summary: string | null;
  isSummaryPending: boolean;
  priorCount: number;
  priorHistory: CallerVmHistoryItem[];
}

type OutboundSource =
  | Pick<PhoneOutbound, 'vm_url' | 'vm_transcription' | 'vm_summary'>
  | null
  | undefined;
type CallerSource =
  | Pick<PhoneDnisResult, 'caller_vm_count' | 'caller_vm_history'>
  | null
  | undefined;

export default function useVoicemailContext(
  outbound: MaybeRef<OutboundSource>,
  caller: MaybeRef<CallerSource> = null,
) {
  return computed<VoicemailContext>(() => {
    const ob = unref(outbound);
    const cl = unref(caller);
    const audioUrl = ob?.vm_url || null;
    const transcription = ob?.vm_transcription || null;
    const summary = ob?.vm_summary || null;
    const priorHistory = Array.isArray(cl?.caller_vm_history)
      ? (cl!.caller_vm_history as CallerVmHistoryItem[])
      : [];
    const priorCount = typeof cl?.caller_vm_count === 'number' ? cl.caller_vm_count : 0;
    const hasVoicemail = Boolean(
      audioUrl || transcription || summary || priorHistory.length,
    );
    // Pending = audio or transcription exists but summary hasn't come back yet.
    // Backend guide: vm_summary is null until Whisper+LLM finishes.
    const isSummaryPending = Boolean(
      (audioUrl || transcription) && !summary,
    );
    return {
      hasVoicemail,
      audioUrl,
      transcription,
      summary,
      isSummaryPending,
      priorCount,
      priorHistory,
    };
  });
}
```

Single composable means the CC test + the VM panel test + the e2e
all exercise the same truth table — no duplicated "hasVoicemail"
conditions scattered across three components.

### 3. `CurrentCallVoicemail.vue`

```vue
<template>
  <section
    class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3"
    :aria-label="$t('~~Voicemail')"
  >
    <header class="flex items-center gap-2">
      <h2 class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
        {{ $t('~~Voicemail') }}
      </h2>
      <BasePill v-if="ctx.summary || ctx.isSummaryPending" variant="ai">
        {{ $t('~~AI-generated') }}
      </BasePill>
    </header>

    <!-- Repeat-caller micro-callout -->
    <div
      v-if="ctx.priorCount > 1"
      class="h-8 px-3 flex items-center gap-2 bg-crisiscleanup-light-smoke rounded text-[13px]"
      data-testid="testVoicemailPriorRibbon"
    >
      <span class="flex-1 min-w-0">
        {{ $t('~~{n} prior voicemails from this caller', { n: ctx.priorCount }) }}
      </span>
      <BasePill variant="dark">{{ ctx.priorCount }}</BasePill>
    </div>

    <!-- Summary block -->
    <template v-if="ctx.summary">
      <p
        class="text-[15px] leading-snug whitespace-pre-line text-black"
        data-testid="testVoicemailSummary"
      >
        {{ ctx.summary }}
      </p>
    </template>
    <PaneSkeleton
      v-else-if="ctx.isSummaryPending"
      variant="block"
      data-testid="testVoicemailSummaryPending"
    />

    <!-- Play recording -->
    <PaneDisclosure
      v-if="ctx.audioUrl"
      name="voicemail-audio"
      :title="$t('~~Play recording')"
      :start-open="false"
      data-testid="testVoicemailAudioDisclosure"
    >
      <audio
        controls
        preload="none"
        :src="ctx.audioUrl"
        class="w-full"
        data-testid="testVoicemailAudio"
      />
    </PaneDisclosure>

    <!-- Transcript -->
    <PaneDisclosure
      v-if="ctx.transcription"
      name="voicemail-transcript"
      :title="$t('~~Transcript')"
      :start-open="true"
    >
      <p
        class="text-[15px] leading-snug whitespace-pre-line text-black"
        data-testid="testVoicemailTranscription"
      >
        {{ ctx.transcription }}
      </p>
    </PaneDisclosure>

    <!-- Prior voicemails -->
    <PaneDisclosure
      v-if="ctx.priorHistory.length"
      name="voicemail-history"
      :title="$t('~~Prior voicemails')"
      :count="ctx.priorHistory.length"
      :start-open="true"
      data-testid="testVoicemailHistoryDisclosure"
    >
      <ul class="flex flex-col gap-3">
        <li
          v-for="item in ctx.priorHistory"
          :key="item.id"
          class="flex flex-col gap-2 pb-3 last:pb-0 border-b border-crisiscleanup-grey-100 last:border-b-0"
          :data-testid="`testVoicemailHistoryItem_${item.id}`"
        >
          <div class="flex items-center gap-2 text-[12px] text-crisiscleanup-grey-900 uppercase tracking-[0.04em]">
            <span>{{ formatDate(item.created_at) }}</span>
            <BasePill
              v-if="item.source === 'inbound'"
              variant="open"
              class="ml-auto"
            >
              {{ $t('~~Inbound') }}
            </BasePill>
            <BasePill
              v-else
              variant="completed"
              class="ml-auto"
            >
              {{ $t('~~Callback') }}
            </BasePill>
          </div>
          <p class="text-[13px] leading-snug text-black whitespace-pre-line">
            {{ item.vm_summary }}
          </p>
          <PaneDisclosure
            v-if="item.vm_transcription"
            :name="`voicemail-history-transcript-${item.id}`"
            :title="$t('~~Transcript')"
            :start-open="false"
          >
            <p class="text-[13px] leading-snug whitespace-pre-line">
              {{ item.vm_transcription }}
            </p>
          </PaneDisclosure>
        </li>
      </ul>
    </PaneDisclosure>
  </section>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import type PhoneOutbound from '@/models/PhoneOutbound';
import useVoicemailContext from '@/hooks/phone/useVoicemailContext';
import BasePill from '@/components/BasePill.vue';
import PaneDisclosure from '@/components/phone/foundation/PaneDisclosure.vue';
import PaneSkeleton from '@/components/phone/foundation/PaneSkeleton.vue';
import moment from '@/utils/dates';

const props = defineProps<{ outbound: PhoneOutbound | null }>();
const ctx = useVoicemailContext(toRef(props, 'outbound'));

function formatDate(iso: string) {
  return moment(iso).format('MMM D, YYYY · h:mm A');
}
</script>
```

**Design notes:**

- Source tag (`inbound` / `outbound`) on history items is shown as a
  small right-aligned pill — matches the guide's "don't branch UX on
  it except maybe a subtle icon" guidance. Copy keys are neutral
  ("Inbound voicemail" / "Callback voicemail") and short.
- `preload="none"` on `<audio>`: we don't need to start downloading
  the file until the volunteer explicitly expands "Play recording"
  and clicks play. Meaningful for queue-heavy sessions.
- No cache-buster on `vm_url` — the URL is backend-signed and immutable.
- No `controlslist="nodownload"` — volunteers do want to save the file
  for handoff in some cases. If a privacy review asks us to block
  download, add the attribute in a follow-up.
- `whitespace-pre-line` on summary and transcription: the backend
  returns `\n` characters (see the guide's example — "Key details:\n-
  Callback: 613-555-0199\n- Name: Jane Doe …"). Without this class
  they collapse into one line.

### 4. `CurrentCall.vue` refresh

Replace the entire `<template>` block below the component setup. New
shape:

```vue
<template>
  <div class="w-full flex flex-col gap-4" data-testid="testCurrentCall">
    <!-- Call details header -->
    <section class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex items-center gap-3 flex-wrap">
      <h2 class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
        {{ $t('phoneDashboard.details') }}
      </h2>
      <div
        v-if="caller"
        class="ml-auto flex items-center gap-2"
        data-testid="testNumberOfInboundCallsDiv"
      >
        <BasePill variant="dark">
          {{ $t('~~{n} calls', { n: caller.number_of_inbound_calls }) }}
        </BasePill>
        <BasePill variant="incident">
          {{ $t('~~{n} days', { n: callerAgeInDays }) }}
        </BasePill>
      </div>
    </section>

    <!-- Voicemail pane (conditional, full-width above grid) -->
    <CurrentCallVoicemail
      v-if="voicemailCtx.hasVoicemail"
      :outbound="call"
    />

    <!-- Suggested Script — full-width top row, capped + scrolls internally -->
    <section class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3 min-w-0">
      <h3 class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
        {{ $t('phoneDashboard.suggested_script') }}
      </h3>
      <div
        class="text-[15px] leading-relaxed text-black min-w-0 prose-script max-h-[50vh] overflow-y-auto pr-1"
        v-html="suggestedScript"
      />
    </section>

    <!-- Cases + FAQ — 2-column row below -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Existing Cases -->
      <section class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3 min-w-0">
        <h3 class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
          {{ $t('phoneDashboard.existing_cases') }}
        </h3>
        <div v-if="cases.length" class="max-h-80 overflow-auto flex flex-col gap-2 -mx-1 px-1">
          <button
            v-for="c in cases"
            :key="c.id"
            type="button"
            :data-testid="`test${c.id}Content`"
            class="text-left p-3 border rounded transition"
            :class="c.id === caseId
              ? 'border-primary bg-primary-light'
              : 'border-crisiscleanup-grey-100 bg-white hover:bg-crisiscleanup-smoke'"
            @click="() => setCase(c)"
          >
            <div class="flex items-center gap-2 mb-1">
              <span
                class="cases-svg-container p-1 bg-crisiscleanup-smoke rounded"
                data-testid="testWorktypeSVGIcon"
                v-html="getSVG(c.worktype)"
              />
              <span class="text-[13px] font-semibold text-black" data-testid="testCaseNumberDiv">
                {{ c.caseNumber }}
              </span>
            </div>
            <div class="text-[13px] text-black" data-testid="testCaseNameDiv">
              {{ c.name }}
            </div>
            <div class="text-[12px] text-crisiscleanup-grey-900" data-testid="testCaseAddressStateDiv">
              {{ c.address }} {{ c.state }}
            </div>
          </button>
        </div>
        <PaneEmpty
          v-else
          :title="$t('~~No recent cases')"
          :description="$t('~~New cases from this phone number will appear here.')"
        />
      </section>

      <!-- FAQ -->
      <section class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex flex-col gap-3 min-w-0">
        <h3 class="text-[12px] uppercase tracking-[0.04em] font-semibold text-crisiscleanup-grey-900">
          {{ $t('phoneDashboard.faq') }}
        </h3>
        <PhoneFaqRAG />
      </section>
    </div>
  </div>
</template>
```

Script additions:

```ts
import BasePill from '@/components/BasePill.vue';
import PaneEmpty from '@/components/phone/foundation/PaneEmpty.vue';
import CurrentCallVoicemail from '@/components/phone/CurrentCallVoicemail.vue';
import useVoicemailContext from '@/hooks/phone/useVoicemailContext';

const voicemailCtx = useVoicemailContext(call);
const callerAgeInDays = computed(() =>
  caller.value ? moment().diff(moment(caller.value.created_at), 'days') : 0,
);
```

Remove:
- The scoped `<style>` block for custom-scrollbar (native scrollbar is fine post-refresh).
- The colour-dot `<span>` elements in each column heading.

Keep untouched:
- `watch(() => call.value, …)` — the worksite fetch on DNIS change.
- `suggestedScript` computed — still driven by `useScripts`.
- `setCase` / `getSVG` helpers.

Add a **scoped `prose-script`** block to the `<style>` for readable
concatenated-script HTML — the `useScripts` output stitches up to four
sub-scripts together with `<p>`, `<strong>`, `<br>` markup, and without
a little spacing the paragraphs collide:

```postcss
.prose-script :deep(p) {
  margin-bottom: 0.75rem;
}
.prose-script :deep(p:last-child) {
  margin-bottom: 0;
}
.prose-script :deep(strong) {
  @apply font-semibold text-crisiscleanup-grey-900;
}
.prose-script :deep(br + strong) {
  @apply block mt-2;
}
```

Scoped, `:deep()` is required because `v-html` contents aren't
compiled by Vue SFCs and live outside the component's data-v scope.

### 5. i18n keys

Per the repo-wide `~~English` convention (see AGENTS.md § i18n), new
strings on this surface are written as literal English keys prefixed
with `~~` — vue-i18n's `formatFallbackMessages: true` renders the key
itself when no locale has it, with `{n}` placeholders interpolated.

| Usage | Key literal |
|---|---|
| Voicemail section micro-label | `~~Voicemail` |
| Audio disclosure title | `~~Play recording` |
| Transcript disclosure title | `~~Transcript` |
| Prior voicemails heading | `~~Prior voicemails` |
| Prior-VM count chip | `~~{n} prior voicemails from this caller` |
| VM source tag (inbound) | `~~Inbound` |
| VM source tag (outbound) | `~~Callback` |
| Empty existing-cases title | `~~No recent cases` |
| Empty existing-cases hint | `~~New cases from this phone number will appear here.` |
| Call-count pill | `~~{n} calls` |
| Age pill | `~~{n} days` |
| AI-generated pill (shared w/ spec 19) | `~~AI-generated` |

Pre-existing dotted keys (`phoneDashboard.details`, `.suggested_script`,
`.existing_cases`, `.faq`) already live in the backend locale bundle —
leave them alone.

Singular/plural handling: vue-i18n supports ICU pluralization via
`{n, plural, …}`, but this track accepts "1 prior voicemails" for now.
A separate i18n-pluralization spec can backfill later.

### 6. Audio a11y

- Wrap the `<audio>` in the disclosure so screen readers don't
  auto-announce a control that's out of view.
- `preload="none"` (set in markup) — no network until user intent.
- Title attribute on the disclosure header already carries "Play
  recording" from the i18n key — no additional `aria-label` needed.
- No custom player — the native `controls` UI satisfies keyboard
  nav, captions-off behaviour, and volume. Don't reimplement.

### 7. Testing

**Unit tests** (`CurrentCallVoicemail.test.ts`):

| Case | Setup | Assert |
|---|---|---|
| First-time caller, VM + summary | `{ vm_url, vm_transcription, vm_summary, caller_vm_count: 1, caller_vm_history: [] }` | summary paragraph renders, `ai` pill present, no prior-ribbon, no history disclosure |
| First-time caller, summary pending | same minus `vm_summary: null` | `PaneSkeleton` renders in summary slot, `ai` pill still present, no summary `<p>` |
| Repeat caller | `caller_vm_count: 4, caller_vm_history.length === 3` | prior-ribbon reads "4 prior voicemails", history disclosure shows three list items with date + summary |
| Opted-out caller | `vm_url, vm_transcription, vm_summary: null`, not pending (test by asserting skeleton renders — the component can't distinguish opt-out from pending at render time; backend suppresses the summary equivalently) | skeleton renders; document the known limitation inline |
| Calldown (no VM context at all) | all null/empty | parent's `v-if` gates rendering; test that `useVoicemailContext(null).hasVoicemail === false` |
| Summary with newlines | `vm_summary: "line 1\nline 2"` | renders on two visual lines (`whitespace-pre-line`) |

**E2E** (`test/e2e/pages/phone.test.ts` — one new spec, `@development`):

```ts
test('voicemail summary and prior history render @development', async ({ page }) => {
  // Auth via auth.setup, navigate to a test incident that has a seeded
  // DNIS with transcribed VMs (backend team to provide seed).
  // Trigger getNextOutbound by clicking "Next call" (or equivalent) and
  // wait for the outbound row to load.
  await expect(page.getByTestId('testVoicemailSummary')).toBeVisible();
  await expect(page.getByTestId('testVoicemailHistoryDisclosure')).toBeVisible();
  // Open audio disclosure — should not have started playing.
  await page.getByTestId('testVoicemailAudioDisclosure').click();
  const audio = page.getByTestId('testVoicemailAudio');
  await expect(audio).toBeVisible();
  await expect(audio).toHaveAttribute('preload', 'none');
});
```

### 8. Data-testid inventory

**Preserved** (existing tests / flows):
`testNumberOfInboundCallsDiv`, `test${id}Content`, `testWorktypeSVGIcon`,
`testCaseNumberDiv`, `testCaseNameDiv`, `testCaseAddressStateDiv`.

**New:**
`testCurrentCall`, `testVoicemailSummary`, `testVoicemailSummaryPending`,
`testVoicemailPriorRibbon`, `testVoicemailAudioDisclosure`,
`testVoicemailAudio`, `testVoicemailTranscription`,
`testVoicemailHistoryDisclosure`, `testVoicemailHistoryItem_${id}`.

## Reuse

- **Spec 19 primitives:** `PaneEmpty`, `PaneSkeleton`, `PaneDisclosure`
  plus `BasePill variant="ai"`. First consumer of all of them.
- **Spec 06 `BasePill`:** `variant="dark"` (counts, callback source
  chip) and `variant="incident"` (days-since chip, inbound source
  chip).
- **`moment`** (`@/utils/dates`) — already imported by `CurrentCall`.
- **`useScripts`** — unchanged.
- **`PhoneFaqRAG`** — unchanged; only the wrapping pane changes.
- **Existing worksite fetch** — `Worksite.api().get()` call is kept
  verbatim. No change to data flow.
- **Tailwind tokens:** `crisiscleanup-grey-100` (card border), `primary`,
  `primary-light`, `crisiscleanup-smoke`, `crisiscleanup-light-smoke`,
  `crisiscleanup-grey-{100,900}`. Zero new tokens.

## Verification

- `pnpm lint`, `pnpm typecheck` — clean. The typecheck will surface
  any `vm_url === ''` check we missed; fix in place rather than
  soften the model type.
- `pnpm exec vitest run test/unit/components/phone/CurrentCallVoicemail.test.ts`
  and `.../hooks/phone/useVoicemailContext.test.ts` — all rows from
  the test matrix pass.
- `pnpm exec vitest run test/unit/models/PhoneOutbound.test.ts` —
  still green after adding the four-field assertion.
- `pnpm test:e2e:development --grep 'voicemail'` — the new spec runs
  against the staging queue once the backend seed DNIS is confirmed.
- `pnpm dev`, **1440 px**, authenticated on `/incident/:id/phone`,
  with a queued callback whose DNIS has a transcribed VM:
  - CurrentCall pane opens with a full-width voicemail section above
    the three-column grid. "AI-generated" pill sits next to the
    "Voicemail" micro-label.
  - If the caller has ≥ 2 prior voicemails, the grey micro-callout
    appears above the summary reading "N prior voicemails from this
    caller."
  - Summary text is 15 px, black, wraps at pane width, respects
    `\n` line breaks.
  - "Play recording" is collapsed by default; expanding reveals the
    native `<audio>` control; pressing play does not start a second
    download (check DevTools network panel — no GET until user clicks
    play, thanks to `preload="none"`).
  - "Transcript" is open by default with the full raw transcription.
  - "Prior voicemails" lists up to 10 items, newest first, each with
    a date header and a neutral source chip.
- Same URL with a caller who opted out of summarisation (backend
  flag `ai_opt_out=true`): voicemail section renders transcript +
  audio, summary slot shows the skeleton. Known caveat — this is
  indistinguishable from "summary pending" at the view layer, by
  design.
- Same URL with a calldown number (no VM fields populated): voicemail
  section is not rendered; existing-cases and FAQ columns render as
  before.
- **390 px** (mobile): voicemail section collapses into a single
  column above the grid, same internal layout. Existing cases
  column, when empty, shows the `PaneEmpty` primitive centered.
- Switch the locale to any non-English locale (`?lang=es`): all
  new keys fall back to their English text until the translations
  stream in from the locale service. No raw key literals visible.
- Spot-check dashboard / cases routes — they don't use any of these
  components, so behaviour is identical.

## Out of scope

- **Pluralisation.** The `n_prior_voicemails`, `n_calls`, `n_days`
  keys accept a plain `{n}` interpolation. A separate i18n spec can
  add ICU pluralisation across the app; we don't single out phone
  for it here.
- **Custom audio player UI.** Native `<audio controls>` is accessible
  and familiar; re-skinning it is not a product requirement.
- **Sentry tracking of VM render state.** The exploration map calls
  out `vm_summary` PII concerns. We deliberately **don't** add a
  Sentry breadcrumb that includes the summary or transcription text.
  If the VM pane throws, Sentry will get the stack trace only. Do
  not add `Sentry.captureMessage(vm_summary)` anywhere.
- **Caching or prefetching of `caller_vm_history` audio files.** The
  backend only returns `vm_summary` / `vm_transcription` on history
  items — no `vm_url` per item. We show text only; playback for
  prior items is a separate spec if ever requested.
- **Inline case editing from the existing-cases column.** Today the
  column just highlights the selected case; the right-rail form
  handles edits. Unchanged here.
- **`PhoneFaqRAG` refactor.** The FAQ component is rendered as-is
  inside the new pane card. It has its own internal markup / states
  that aren't touched here.
- **Removing `vm_url` from `PhoneOutbound` fields.** The field is
  kept as a nullable attr; no call sites set `''` after this spec.
- **Backfill behaviour.** Guide flags `manage.py backfill_vm_summaries`
  — once ops runs it, old VMs populate. The FE doesn't need to
  refetch; the next `getNextOutbound` call returns the enriched row.
  No FE polling added.
- **Feature flag plumbing for `VM_AI_SUMMARY_ENABLED`.** The guide
  says when the flag is off the fields still appear (null). No
  client-side flag check needed.

## Risks / rollback

- **Risk — `vm_url` default change.** Flipping `vm_url` from `''` to
  `null` is a one-word change but every call site that implicitly
  coerced to boolean (`if (outbound.vm_url) { … }`) keeps working;
  any comparison to `''` breaks. Grep first:
  `rg -n "vm_url\s*===?\s*['\"]{2}|vm_url\s*!==?\s*['\"]{2}" src/`.
  Expected: zero matches — only the model declares it.
- **Risk — PII in Sentry / logs.** `vm_summary` and `vm_transcription`
  are sensitive. Any thrown error around the VM component auto-captures
  by the response interceptor in `src/main.ts`. Verify that
  interceptor does **not** include response body text in its toast /
  Sentry payload (spec says it toasts 4xx/5xx warnings via
  `@/utils/errors` — re-check that helper doesn't serialize response
  data).
- **Risk — audio file CORS / mime.** `vm_url` is a backend-signed
  recording URL. In dev, the CORS allow-list must include the
  frontend origin; the native `<audio>` will fail silently if it
  can't fetch. QA signal is "Play button appears but clicking does
  nothing" — if seen, check the network response status in DevTools.
- **Risk — E2E dependence on a seeded DNIS.** The `@development`
  voicemail test requires a DNIS whose inbound row has been
  transcribed + summarised. If the backfill job hasn't run on the
  dev env, the test is flaky. Mitigation: gate the test on a
  fixtures check that skips if no VM-bearing DNIS is found, logging
  "seed DNIS missing."
- **Risk — overflow behaviour on tiny screens.** Prior voicemails
  list can contain up to 10 items with long summaries. At 390 px the
  section has no inherent max-height — if that proves to be a
  problem, wrap the `<ul>` in `max-h-96 overflow-auto`. Leave off
  initially; fix if feedback calls it out.
- **Risk — long audio files blocking the UI.** Native `<audio>` is
  lightweight, but very long recordings (> 20 min) may stall the
  browser's buffering on slow networks. `preload="none"` defers the
  load; nothing else is needed.
- **Risk — accordion state on call-next.** Each call loads a new
  outbound. The disclosures' open state is uncontrolled (managed by
  `AccordionItem`'s internal `state.isOpen`). When `call.value`
  changes, Vue reuses DOM nodes via key reconciliation — there's no
  explicit `:key="outbound.id"` on `CurrentCallVoicemail`. Add
  `:key="call?.id ?? 'no-call'"` to force remount between calls so
  a collapsed "Play recording" doesn't visually carry over from the
  last call.
- **Rollback.** Delete `CurrentCallVoicemail.vue`, revert
  `CurrentCall.vue`, revert the four model fields, delete the hook.
  App returns to pre-refresh state bit-identical. Model rollback
  does not require a data migration — the `attr()` defaults are
  FE-side only.
