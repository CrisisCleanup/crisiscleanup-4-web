# 22 — ActiveCall refresh

## Intent

`ActiveCall.vue` is a legacy compact call strip that pre-dates the
three-column `CurrentCall.vue` pane. It renders a status banner
(`connecting` / `inbound call` / `outbound call` / `completed`), the
suggested-script header + body in a single coloured block, the
caller DNIS + location, a horizontally scrollable cases strip, and
a hangup icon.

Post-spec 18, the call banner logic (connecting / inbound-dark /
outbound-dark / grey-ended, no pulse) moves into `PhoneOverlay.vue`
as a single 48 px row. Post-spec 20, the suggested script + existing
cases + caller info live in the refreshed `CurrentCall.vue` with
proper pane cards. That leaves `ActiveCall.vue` with redundant
surface area.

**The right move for this spec is deletion**, not redesign. But
because an automated deletion risks silently dropping a render path
that an audit failed to catch, this spec is a two-step:

1. **Audit** — confirm `ActiveCall` has no remaining consumer after
   specs 18 + 20 land. If it still mounts, inventory the data that
   is *only* shown there.
2. **Execute** — either delete the component + all imports (the
   expected outcome), or, if the audit turns up a genuine consumer,
   shrink `ActiveCall` to render only the non-redundant bits and
   swap its inner markup to the pane-card recipe.

## Before / After

### Path A — deletion (expected)

| Concern | Current | Target |
|---|---|---|
| `src/components/phone/ActiveCall.vue` | 280-line component | **Deleted.** |
| Imports of `ActiveCall` | Grep first (`rg -n "ActiveCall"`) | All removed. |
| Status banner (connecting/on-call/completed) | Inline in `ActiveCall` with `bg-crisiscleanup-lightblue-800`, `bg-crisiscleanup-dark-blue`, `bg-crisiscleanup-green-300` | Already owned by `PhoneOverlay.vue` post-spec 18. |
| Script block | `:style="{ backgroundColor: scripts.currentScriptColor.value }"` + `base-text variant="h3"` header | Already owned by `CurrentCall.vue` post-spec 20 ("Suggested Script" pane). |
| Caller DNIS + location | `base-text variant="h2"` + dark-200 sub-text | Already owned by the refreshed call banner (spec 18). |
| Cases strip | horizontal scroll of case cards | Already owned by `CurrentCall.vue`'s "Existing Cases" column (spec 20). |
| Hangup icon | `ccu-icon type="hangup"` at right edge | Already owned by the refreshed call banner (spec 18). |

### Path B — shrink (fallback)

If the audit finds a consumer we can't retire (e.g. a mobile-only
mount where the full `CurrentCall` grid doesn't fit), then
`ActiveCall` becomes a **3-block compact strip**: status pill,
caller line, hangup — and nothing else. Everything else is
delegated to spec 20's `CurrentCall` and spec 18's banner.

| Concern | Fallback target |
|---|---|
| Wrapper | `bg-white rounded border border-crisiscleanup-grey-100 p-4 flex items-center gap-3` |
| Status | `<BasePill variant="success">` when on call, `<BasePill variant="primary">` when connecting, `<BasePill variant="dark">` when completed. No per-state hex backgrounds. |
| Caller line | `<span class="text-[13px] font-semibold">{{ caller.dnis }}</span> <span class="text-[12px] text-crisiscleanup-grey-900">{{ caller.location_name }} {{ caller.state_name }}</span>` |
| Hangup | 32×32 icon tile (`w-8 h-8 grid place-items-center rounded hover:bg-crisiscleanup-smoke`) with `ccu-icon type="hangup"` |
| Scripts, cases, call count | **Removed** — those live in `CurrentCall` post-spec 20 |

## Files to touch

### Audit step

- Run these greps and archive the output in the PR description:
  ```bash
  rg -n '\bActiveCall\b' src/
  rg -n "import .*ActiveCall" src/
  rg -n 'from .*/ActiveCall' src/
  rg -n '<ActiveCall' src/
  ```
- Check `src/pages/phone/PhoneSystem.vue` and `src/components/phone/PhoneOverlay.vue` line-by-line — they're the two likely mount points. Reading both:
  - If neither mounts it, proceed with **Path A (delete)**.
  - If either mounts it and the mount is still necessary post-specs-18/20, proceed with **Path B (shrink)**.

### Path A files

- **DELETE:** `src/components/phone/ActiveCall.vue`.
- **EDIT:** every file the audit grep turned up — remove the import and the `<ActiveCall …>` usage.
- **DELETE:** `test/unit/components/phone/ActiveCall.test.ts` if present.
- **EDIT:** `test/e2e/pages/phone.test.ts` — remove any selector hitting `testCurrentScriptHeaderContent`, `testCurrentScriptValueContent`, `testCallerDiv`, `testIsConnectingDiv`, `testIsOnCallDiv`, `testIsInboundCallDiv`, `testIsOutboundCallDiv`, `testIsCompletedDiv`, `testExistingCasesDiv`, `testNewCaseContent` (grep the file first). Those testids all live in `ActiveCall`; the post-18/20 equivalents are on different hosts — update to the new ids documented in specs 18 and 20 or drop the assertion if it's redundant.

### Path B files

- **EDIT:** `src/components/phone/ActiveCall.vue` — strip to the 3-block compact strip; remove all script handling, cases watching, `Worksite.find()` lookup, Sentry connecting-timeout logic (that belongs in a hook, not a view component — migrate it out separately as part of this spec).
- **NEW:** `src/hooks/phone/useConnectingTimeout.ts` — extract the 45 s connecting-stuck watcher (`ActiveCall.vue:222-252`) so whichever component still needs it (likely `useConnectFirst` consumers) can opt in. This is the only genuinely non-redundant logic in `ActiveCall` today.
- **EDIT:** `test/unit/components/phone/ActiveCall.test.ts` — shrink to cover the three remaining visual pieces + the status-pill branching.

## Implementation

### Audit (both paths)

```bash
rg -n '\bActiveCall\b' src/ test/ | tee /tmp/activecall-audit.txt
```

Any hit outside this spec's own files means a live consumer. Look at
*why* it's mounted — in 90 % of cases the answer post-specs-18/20
is "historical; the refreshed components cover it." When that's true,
retire the consumer alongside this spec and proceed with Path A.

### Path A — deletion diff

1. **Remove the file.**
2. **Remove imports.** Expected shape:
   ```diff
   - import ActiveCall from '@/components/phone/ActiveCall.vue';
   ```
3. **Remove template references.** Expected shape:
   ```diff
   - <ActiveCall :case-id="…" @set-case="…" />
   ```
4. **Extract `useConnectingTimeout`** (even in Path A — it's the
   one bit of logic that isn't duplicated elsewhere). Move the 45 s
   watcher from `ActiveCall.vue:222-252` into
   `src/hooks/phone/useConnectingTimeout.ts`:
   ```ts
   export default function useConnectingTimeout() {
     const toast = useToast();
     const { t } = useI18n();
     const { currentUser } = useCurrentUser();
     const phoneService = reactive(usePhoneService());
     const {
       isTransitioning, caller, callState, isInboundCall,
       isOutboundCall, call, setPotentialFailedCall,
     } = useConnectFirst();
     const timeout = ref<ReturnType<typeof setTimeout> | null>(null);

     watch(() => isTransitioning.value, (stuck) => {
       if (stuck) {
         const startedConnecting = moment().toISOString();
         timeout.value = setTimeout(() => {
           Sentry.setContext('call_info', {
             user: currentUser?.value?.$toJson(),
             caller: caller.value, callState: callState.value,
             isInboundCall: isInboundCall.value,
             isOutboundCall: isOutboundCall.value,
             startedConnecting,
             connectingTimedOut: moment().toISOString(),
           });
           Sentry.captureException(
             'Call is stuck connecting state for 45 seconds',
           );
           toast.error(t('phoneDashboard.could_not_connect'));
           setPotentialFailedCall(call.value);
           phoneService.hangup();
         }, 45_000);
       } else if (timeout.value) {
         clearTimeout(timeout.value);
       }
     });
   }
   ```
   Mount this hook once — the natural owner is `PhoneSystem.vue`'s
   setup, since that's the root phone view and specs 18/20 don't
   add it elsewhere.

### Path B — shrink markup

```vue
<template>
  <section
    v-if="caller"
    class="bg-white rounded border border-crisiscleanup-grey-100 p-4 flex items-center gap-3"
    data-testid="testActiveCallStrip"
  >
    <BasePill :variant="statusVariant">
      {{ statusLabel }}
    </BasePill>
    <div class="flex items-center gap-2 min-w-0 flex-1">
      <span class="text-[13px] font-semibold text-black truncate">
        {{ caller.dnis }}
      </span>
      <span class="text-[12px] text-crisiscleanup-grey-900 truncate">
        {{ caller.location_name }} {{ caller.state_name }}
      </span>
    </div>
    <button
      v-if="(isOnCall || caller) && isOutboundCall"
      type="button"
      class="w-8 h-8 grid place-items-center rounded hover:bg-crisiscleanup-smoke transition"
      :aria-label="$t('actions.hangup')"
      data-testid="testHangupIcon"
      @click="hangup"
    >
      <ccu-icon type="hangup" size="small" :alt="$t('actions.hangup')" />
    </button>
  </section>
</template>
```

```ts
const statusVariant = computed(() => {
  if (isConnecting.value) return 'primary';
  if (isOnCall.value) return 'success'; // or 'open' if spec 06 hasn't shipped `success`
  return 'dark';
});
const statusLabel = computed(() => {
  if (isConnecting.value) return t('phoneDashboard.connecting');
  if (isOnCall.value && isInboundCall.value) return t('phoneDashboard.inbound_call');
  if (isOnCall.value && isOutboundCall.value) return t('phoneDashboard.outbound_call');
  return t('phoneDashboard.completed');
});
```

## Reuse

- **Path A:** no reuse — deletion only. The `useConnectingTimeout` extraction reuses `useConnectFirst`, `usePhoneService`, `useCurrentUser`, `useToast`, `useI18n`, and `@sentry/vue` — all already wired.
- **Path B:** `BasePill` (spec 06), `ccu-icon`, `useConnectFirst`, `usePhoneService`.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` — clean after either path.
- `rg -n '\bActiveCall\b' src/ test/` — **Path A:** zero hits. **Path B:** only hits are the component file itself and its direct consumer.
- `pnpm dev` with a staging caller:
  - Connecting → inbound transition still displays the banner (spec 18) and populates CurrentCall (spec 20). No regression from removing the `ActiveCall` strip.
  - 45 s stuck-connecting Sentry capture still fires — test by forcing a dropped call on the staging dialer and watching for the Sentry event + toast.
- E2E tagged `@primary` on the phone page — still passes; the removed testids don't exist in primary-path scenarios.

## Out of scope

- Rewriting `useConnectFirst`. The hook is the canonical call-state store; this spec only *adds* a consumer (`useConnectingTimeout`), it doesn't refactor.
- Changing `phoneService.hangup()` semantics. The 45 s timeout hangs up via the existing API call; unchanged.
- Touching `phoneDashboard.connecting` / `inbound_call` / `outbound_call` / `completed` i18n strings — reused verbatim.
- Touching `PhoneIndicator.vue`. That's spec 24's problem.

## Risks / rollback

- **Risk — silent consumer.** If the audit misses a mount point (e.g., a lazy-loaded page, a test helper), deletion regresses that surface. Mitigation: the audit grep pattern catches any `import` statement or `<ActiveCall` tag. If the import is dynamic (`() => import(...)`), grep the path string too: `rg -n "phone/ActiveCall"`.
- **Risk — `useConnectingTimeout` mount location.** Spec says "mount once in `PhoneSystem.vue`'s setup." That's a single point of failure — if `PhoneSystem` is server-side rendered or otherwise skipped, the 45 s Sentry capture stops firing. This is currently fine (the component is SPA-mounted and always-on), but re-confirm at implementation time.
- **Risk — testid drift.** Specs 18 and 20 define replacement testids. If e2e specs import from a shared page-object helper, update the helper, not individual specs.
- **Rollback — Path A:** restore `ActiveCall.vue` from git, restore the imports, delete `useConnectingTimeout.ts`. **Path B:** revert the shrink diff.
