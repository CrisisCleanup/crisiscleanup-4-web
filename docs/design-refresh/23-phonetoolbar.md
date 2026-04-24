# 23 — PhoneToolBar refresh

## Intent

`PhoneToolBar.vue` is a 12-line wrapper around `<Agent>` — its
entire non-trivial markup is:

```vue
<div class="flex">
  <div class="flex-grow" data-testid="testPhoneToolBarDiv">
    <Agent class="border-b shadow" … />
  </div>
</div>
```

Spec 18 already redesigns the `Agent` toolbar into three clusters
with internal borders. The wrapper's `border-b shadow` on `<Agent>`
adds a second elevation (a `shadow` class below the refreshed 1 px
bottom border) that conflicts with the kit's single-signature
shadow rule (`shadow-crisiscleanup-card` reserved for focal surfaces —
skeletons, modals, poppers — not on chrome strips or pane cards, which
now use a 1 px grey border instead per spec 19's updated recipe).

This spec drops the residual shadow, confirms the wrapper collapses
cleanly into its parent, and wires a data-testid that surfs the
refresh (so e2e isn't coupled to an intermediate `<div>` whose only
job was to carry a class).

## Before / After

| Concern | Current | Target |
|---|---|---|
| Outer `<div class="flex">` | Ornamental flex container around a single child | Remove — collapse to a single `<Agent>` invocation with the wrapper's testid moved onto Agent's root |
| `.flex-grow` inner div | Carries `data-testid="testPhoneToolBarDiv"` and forwards `<Agent class="border-b shadow" />` | Remove; testid moves to `<Agent>` via a new `data-testid` pass-through |
| `<Agent class="border-b shadow">` | Double-elevation (spec-18 refreshed Agent already owns its `border-b border-crisiscleanup-grey-100`) | `<Agent />` — no extra classes. The spec-18 Agent toolbar already carries `border-b border-crisiscleanup-grey-100` at the top level. |
| Props forwarded | `completeCall`, `onLoggedIn`, `setAllowedCallType`, `selectCase`, `worksiteId`, `allowedCallType` | Only `onLoggedIn`, `setAllowedCallType`, `allowedCallType` are actually used by `<Agent>` (grep `Agent.vue` — `completeCall`, `selectCase`, `worksiteId` are declared on the wrapper but never bound). Remove the unused three |
| Setup returning `tabs: null` | Vestigial — nothing consumes `tabs` | Remove |

## Files to touch

- **EDIT:** `src/components/phone/PhoneToolBar.vue` — shrink per the table above.
- **EDIT:** `src/components/phone/Agent.vue` — accept a `data-testid` pass-through on its root, or add `data-testid="testPhoneToolBarDiv"` inline at its root. Prefer inline; there's only one consumer today.
- **EDIT:** the mount site of `<PhoneToolBar …>` (grep `rg -n '<PhoneToolBar'`) — drop any of the now-unused props (`completeCall`, `selectCase`, `worksiteId`). Confirms they were dead.

## Implementation

```vue
<!-- PhoneToolBar.vue, post-refresh -->
<template>
  <Agent
    :allowed-call-type="allowedCallType"
    @on-logged-in="onLoggedIn"
    @set-allowed-call-type="setAllowedCallType"
  />
</template>

<script lang="ts">
import Agent from './Agent.vue';
import { AllowedCallType } from '@/pages/phone/PhoneSystem.vue';

export default defineComponent({
  name: 'PhoneToolBar',
  components: { Agent },
  props: {
    onLoggedIn: { type: Function, default() {} },
    setAllowedCallType: { type: Function, default() {} },
    allowedCallType: {
      type: AllowedCallType,
      default: 'BOTH',
    },
  },
});
</script>
```

Seven lines of template + a clean props list. No setup block, no
vestigial `tabs: null` return.

In `Agent.vue`, add `data-testid="testPhoneToolBarDiv"` to the root
`<div>` so the existing e2e selector doesn't break. (Spec 18 adds a
different root structure; coordinate with whichever of 18 or 23
lands first — the one that lands second carries the testid.)

## Reuse

- `<Agent>` — unchanged by this spec beyond the testid move.
- `AllowedCallType` — unchanged.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `rg -n 'completeCall|selectCase|worksiteId' src/components/phone/PhoneToolBar.vue` — zero hits after refresh.
- `pnpm dev` at `/incident/:id/phone` — agent toolbar renders identically to pre-refresh (spec 18 owns the visual), no double bottom border.
- E2E selector `testPhoneToolBarDiv` still hits.

## Out of scope

- `<Agent>` internal layout — owned by spec 18.
- `AllowedCallType` enum — unchanged.
- Moving `AllowedCallType` out of `PhoneSystem.vue` (it's imported as a value from a page file, which is a smell but not this spec's problem).

## Risks / rollback

- **Risk — spec 18 landing order.** If spec 18 hasn't added the `border-b` to `Agent.vue`'s root, removing `class="border-b shadow"` from the `<Agent>` invocation leaves the toolbar with no bottom separator. Mitigation: block this spec on spec 18, or inline `border-b border-crisiscleanup-grey-100` on Agent's root as part of this spec instead.
- **Risk — testid pass-through.** If downstream code asserts `testPhoneToolBarDiv` is a `<div>` (not `<div>` with `role`), an Agent root that's, e.g., a `<section>` breaks the selector. Playwright's `getByTestId` is tag-agnostic; Vue Test Utils' `find('[data-testid=…]')` is also. Both fine.
- **Rollback.** Revert the 2-file diff.
