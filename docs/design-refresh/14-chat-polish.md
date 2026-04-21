# 14 — Chat polish (Spinny + access points, keep layout)

## Intent

`src/components/chat/Chat.vue` works — real-time socket, favorites, search,
Spinny the Sage (Dynamic FAQ / RAG) accordion on the left, tabbed thread on
the right. The **structure stays**. This spec focuses on three things:

1. **Design polish** — normalize the chat surface to the kit's card
   signature (radius, shadow, smoke surfaces), align typography, and fix
   the cramped input bar.
2. **Spinny the Sage** — today it's a collapsed second accordion with a
   plain `ccu-icon help`. Make it feel like a *feature*: label, subtle
   brand, a streaming affordance, and a persistent "Ask Spinny" entry
   below the message input so users find it without scrolling the sidebar.
3. **Access points** — one global icon entry (nav / header) with an unread
   badge, plus inline "chat this user" affordances on the online-users
   list. Chat is currently only reachable through the phone overlay
   (`PhoneOverlay.vue:591-601`) — add the two missing paths without
   disturbing that one.

Explicitly **out of scope:** moving the accordion to the bottom, replacing
the `@vueform/multiselect`-style scroll list, or rewriting Spinny's RAG
pipeline. Layout stays.

## Before / After

### Chat shell (`src/components/chat/Chat.vue`)

| Concern | Current | Target |
|---|---|---|
| Outer container | `flex-1 p-2 sm:p-3 flex flex-col w-full` with no surface | `rounded shadow-crisiscleanup-card bg-white p-3 sm:p-4` (now reads as a single card on the smoke page surface) |
| Header row | `text-lg` chat name with `py-1 border-b border-gray-200` | `text-[15px] font-bold text-black pb-2 border-b border-crisiscleanup-grey-100`; add online-count pill to the right (small `BasePill variant="open" :show-dot="true"`) |
| Left column surface | `bg-crisiscleanup-light-smoke p-2` (no radius, no border) | `bg-crisiscleanup-smoke rounded p-3 border border-crisiscleanup-grey-100` — reads as a panel, not a dumped block |
| Messages scroll area | `h-72 md:h-120` + grab-bag scrollbar classes | `h-[calc(100vh-22rem)] md:h-[calc(100vh-18rem)] min-h-[320px]` so the scroll region grows with the viewport; keep existing webkit scrollbar treatment |
| Date divider | `bg-gray-300 h-px` with a pill in the middle | `bg-crisiscleanup-grey-100 h-px`, pill uses `BasePill variant="dark"` with `showDot="false"` |
| Input row | `<Editor>` + flex row with checkbox + FAQ link + send | keep; lift the whole footer onto `bg-crisiscleanup-smoke rounded p-2` so it reads as a composing surface distinct from the thread |
| Urgent state | existing top border flip to `crisiscleanup-chat-red` | unchanged; pair with a subtle left-bar accent on the editor using `border-l-4 border-crisiscleanup-red-900` for reinforcement |
| Send button | `bg-crisiscleanup-dark-blue` + plane icon | swap to `variant="solid"` (spec 4 yellow) — consistent with rest of the app's primary action |
| "Read FAQ first" link | italic span, no affordance | swap to a `<button>` with `text-[11px] underline text-crisiscleanup-dark-blue hover:text-black` |

### Spinny the Sage (inside the left accordion + new footer entry)

| Concern | Current | Target |
|---|---|---|
| Accordion title | `BaseText variant="h2"` "Spinny the Sage" | add a 20 px ✨/🔮 brand glyph (use `ccu-icon type="help"` + `text-primary-dark`) and a subtitle `$t('chat.ask_a_question_ai_disclaimer')` collapsed into a `BasePill variant="dark"` next to the title that reads "AI" |
| Question input | missing — users have to type in the main chat then route? Unclear | add a dedicated single-line input *inside the accordion body*: `<base-input icon="search" :placeholder="$t('chat.ask_spinny_placeholder')" v-model="spinnyQuery" @enter="submitQuestion(spinnyQuery)">` |
| History rendering | loops `faqHistory` and places raw `help` icons next to user messages, `MarkdownRenderer` for AI responses — no visual grouping | wrap each user+AI exchange in a light smoke card with a compact avatar/glyph to distinguish roles; add a small "AI" pill to AI replies |
| Streaming state | `isStreamingMessage` exists in setup but isn't rendered | append a pulsing **spinner row** (`<font-awesome-icon icon="spinner" spin class="text-primary-dark">`) at the bottom of the exchange list when `isStreamingMessage === true`, with the text "Spinny is thinking…" |
| Disclaimer | plain `BaseText variant="h4"` | keep the copy; restyle as `text-[11px] text-crisiscleanup-grey-900` under the exchange list |
| "Ask Spinny" shortcut | none outside the accordion | add a **secondary footer button** below the main chat composer: `<button class="flex items-center gap-2 px-2 py-1 rounded hover:bg-crisiscleanup-smoke text-[12px]"><font-awesome-icon icon="sparkles" /> {{ $t('chat.ask_spinny') }}</button>` that scrolls the accordion into view and focuses the Spinny input. This is an **access point** for Spinny — today it's buried in an accordion panel the user may never open. |

### Access points (entry paths into chat from the rest of the app)

| Path | Current | Target |
|---|---|---|
| Desktop top-bar icon | none — chat only reachable from `PhoneOverlay` | add a small icon-button in `src/components/header/Header.vue` right group (between phone indicator + user menu): `assets/icons/chat.svg` at 22 px, `opacity-60 hover:opacity-100`, with a red-dot `BasePill variant="urgent" show-dot` overlay when `unreadChatCount > 0`. Clicks emit `open:chat` — the layout handles routing to wherever chat is hosted (phone overlay for now, future standalone page). |
| Mobile top-bar | nothing | a compact chat glyph in the mobile top bar (spec 12) *only if* the user is a phone agent; otherwise hidden. Skip unless bottom tab gets cramped — the "More" sheet already lists it via routes. |
| Online user row | `UserDetailsTooltip` on hover, no click affordance | add a small `message` icon button on each online-user row that dispatches a `@start-dm` event (no 1:1 DM yet — gate behind a feature flag or just open the tooltip for now). This is the **access point** groundwork; wiring real DMs is a follow-up. |
| Chat SVG asset | exists at `src/assets/icons/chat.svg` and is re-exported from `constants.ts:29` but never rendered | use it for the new header icon. |
| URLs inside messages | plain text | render as `<a>` with `text-crisiscleanup-dark-blue underline underline-offset-2 hover:opacity-80` via a lightweight linkify pass in `ChatMessage.vue`. This is the simplest *content-level* access point — clickable links in the thread. |

## Files to touch

- `src/components/chat/Chat.vue` — primary target. Template restructure
  only (card surface, Spinny additions, footer shortcut). Keep the
  composable hooks, the socket plumbing, and the data props untouched.
- `src/components/chat/ChatMessage.vue` — add linkification of URLs (reuse
  an existing utility if there is one, else a tight inline regex).
- `src/components/header/Header.vue` — add the chat icon-button to the
  right group; wire it to emit a `open:chat` event the layout can listen
  to (for now, the layout no-ops if there's no chat overlay; the future
  standalone route can bind to this event).
- `src/constants.ts` — if we need to tag the chat icon in a component
  registry, do it here. Otherwise skip.

Do **not** touch:
- `PhoneOverlay.vue` — the existing chat entry point stays intact.
- The RAG hooks (`useRAG`, `useRAGConversations`, `useRAGCollections`) —
  API surface is fine.
- The chat websocket / online-users hooks.

## Implementation

1. **Audit** — `pnpm dev`, log in as a phone agent (the only account with
   chat today), click the phone chat tab. Screenshot the current layout
   at 1440 px *and* 768 px so regressions are obvious later.

2. **Re-skin the shell (Chat.vue)**:
   - Wrap the existing root in the new card classes.
   - Bump the header row typography + add the online-count `BasePill`.
   - Re-skin the left panel's surface.
   - Re-skin the footer composer.

3. **Spinny upgrades**:
   - Inside the Spinny accordion body, render the new input + history list
     with role-separated cards + streaming spinner.
   - Pipe the existing `submitQuestion` / `latestMessage` / `isStreamingMessage`
     values — no new state needed.
   - Add the "Ask Spinny" button below the main chat send row. On click,
     expand the Spinny accordion (emit/imperative call on the Accordion
     ref, or toggle an internal `spinnyOpen` flag) and focus the Spinny
     input via `ref` + `nextTick`.

4. **Access point — Header chat icon**:
   - Import the chat SVG in `Header.vue`.
   - Render a button after the phone indicator, before `UserProfileMenu`.
   - Listen to an `unreadChatCount` ref sourced from a new `useChatUnread`
     hook *or*, simplest for v1, read from a Vuex store slice if one
     exists; otherwise fall back to "always 0" and wire the count in a
     follow-up. Keep the button harmless until the count wiring lands.
   - Click emits `open:chat` up to the parent `Authenticated.vue`. For now
     parent just toggles the existing phone overlay chat tab if the agent
     is on that page; else logs a "coming soon" toast. **No routing
     changes in this spec.**

5. **Message linkification (`ChatMessage.vue`)**:
   - Regex `/\b(https?:\/\/[^\s<]+)/g` with a guard against `<` so the
     replacement doesn't double-process HTML-ish tokens.
   - Wrap each match in `<a target="_blank" rel="noopener noreferrer" class="text-crisiscleanup-dark-blue underline underline-offset-2">`.
   - Do the replacement on a computed, feed into `v-html` on a scoped
     `<span>` — or use an existing markdown/sanitizer if it's already
     imported in `ChatMessage`; cheaper than reinventing.

6. **Accessibility**:
   - Every new `<button>` gets an `aria-label` from i18n (no icon-only
     buttons without a label).
   - The "AI" pill gets `aria-hidden="true"` — it's decorative.
   - Streaming row gets `aria-live="polite"` so screen readers hear "Spinny
     is thinking…" announce.

## Reuse

- `BasePill` (spec 6) — `open`, `dark`, `urgent` variants all used here.
- `BaseInput` (spec 5/9) — the new Spinny input inherits the yellow focus
  ring and the hint/error placement. The "Ask a question" disclaimer
  renders naturally via the `hint` prop.
- `shadow-crisiscleanup-card` + `rounded` (spec 7) — the card signature.
- Existing hooks (`useRAG`, `useRAGConversations`, `useWebSockets`,
  `useCurrentUser`) — untouched.
- `src/assets/icons/chat.svg` — already there; just wire it in.

## Verification

- `pnpm dev`, phone-agent user. Open chat:
  - Whole panel reads as one card on a smoke page, not a raw column.
  - Online-count pill in the header matches `onlineUsersWithData.length`.
  - Type and send a message → no regression; scroll position + urgent
    state behaves as before.
  - Submit a Spinny question via the new Spinny input → spinner appears,
    streaming text fills in, "AI" pill appears on the response.
  - Click "Ask Spinny" under the composer → accordion scrolls open, input
    focuses.
  - Post a message with a URL → renders as a clickable link opening in a
    new tab.
- `pnpm dev`, visit any non-chat page → header shows the chat glyph,
  dimmed by default, dot badge when `unreadChatCount > 0`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `pnpm test:e2e:primary` — `testIsUrgentCheckbox`, `testSendMessageButton`,
  `testFavoritesContent`, `testMessagesSearchTextInput`, `testMessagesContent`
  selectors all still resolve (template reshuffle, not rename).

## Out of scope

- **1:1 direct messages** from the online-users list. The `@start-dm`
  event is plumbing only; the inbox/thread UX is a separate track.
- **Standalone chat route** (`/chat`). Today chat lives inside
  `PhoneOverlay`; breaking it out is its own PR.
- **Rich media uploads** in chat (images, files) — `Editor` already
  supports inline images; extend its menu in a later spec.
- **Moderation / reporting** — not in the kit.
- **Spinny memory / cross-session history** — the RAG hook already handles
  this; no new persistence work.

## Risks / rollback

- **Risk:** the header chat icon needs an unread-count source. If the only
  source today is `PhoneOverlay`-scoped state, we either lift it into a
  store or accept a "no count until you're in the overlay" v1. Call out
  the limitation in the commit body.
- **Risk:** wrapping the whole chat in `shadow-crisiscleanup-card` inside
  `PhoneOverlay`'s already-padded container can create double-border
  stacking. Test inside the overlay; strip the outer shadow if the
  overlay already provides one.
- **Risk:** URL linkification regex mangling pre-rendered HTML from the
  Quill `Editor` output. Neutralize by running the regex only on text
  nodes (DOM walk) or by running it *before* Quill renders.
- **Rollback:** per-file reverts. The three files touched are independent;
  access-point Header addition can ship first, Spinny second, chat
  re-skin third.
