# 08 — Table + integrated search toolbar

## Intent

Give the primary `Table.vue` the kit's cleaner look: column headers as small
uppercase labels with a smoke background, row dividers only (no per-cell
borders), subtle hover, and a **toolbar row bonded to the table card** that
holds the search input plus the status-filter chip row. Today the search tends
to float above the table; the kit's integrated toolbar reads as one surface
and ties the filter chips visually to the data they filter.

Out of scope: the grid engine, sorting logic, row-click behavior, column-search
mode, and pagination logic — those work. This is a visual + structural refresh.

## Before / After

| Concern | Current (`src/components/Table.vue`) | Target (`kit.css` / `CasesTable.jsx`) |
|---|---|---|
| Outer container | `div.table-grid js-table w-full` — no card wrapper | `div.card` (white bg, `shadow-crisiscleanup-card`, `rounded`, `p-0`) |
| Toolbar | *separate* `<base-input icon="search">` lives in callers (e.g. `pages/organization/Layers.vue`) above the table | **inside** the card: `flex items-center gap-2.5 p-3.5 border-b border-crisiscleanup-grey-100` — search flex-1, then filter chip buttons | 
| Column header bg | `bg-white` | `bg-crisiscleanup-smoke` (`#f7f7f7`) |
| Column header type | `<base-text variant="h3" regular>` (14 px / 700 / mixed-case) | `text-[10px] font-bold uppercase tracking-[0.06em] text-crisiscleanup-grey-900` (h4 micro-label) |
| Column header padding | `p-2` | `px-3 py-2.5` |
| Row borders | `border-b` on each row | *unchanged* (already matches) |
| Row hover | `hover:bg-crisiscleanup-light-grey` | `hover:bg-[#fafafa]` (slightly cooler — or keep light-grey, close enough; prefer unchanged) |
| Row text | default | `text-[13px]` (body-sm) |
| Case ID column | default | `font-mono font-bold` (see `CasesTable.jsx:88`) |
| Action column (ellipsis) | not standard | right-side trailing ellipsis icon, `opacity-60 hover:opacity-100` |
| Status column | ad-hoc spans | `<BasePill>` from spec 06 |
| Priority "Urgent" | mixed | `<BasePill variant="urgent">` |
| Filter chips | not standard | `<BaseButton size="sm" :variant="isActive ? 'solid' : 'outline'">` — outline variant for inactive, solid yellow for active |

## Files to touch

- `src/components/Table.vue` — header styling + expose an optional `toolbar`
  slot so callers can mount search+filters bonded to the table.
- **Callers of the table to migrate to the new toolbar slot** (pick top
  priority first):
  - `src/pages/organization/Layers.vue` (pattern exemplar — has a floating
    `<base-input icon="search">` today).
  - Cases-list pages: grep for `<Table` in `src/pages/cases/` and
    `src/pages/**/Cases*.vue`.
  - Any other page that renders `<Table>` with a sibling search control above it.
- `src/components/BaseInput.vue` — not touched here; spec 09 fixes its error
  placement, which this spec inherits automatically.

Grep to enumerate callers (before starting):

```bash
grep -rln '<Table' src/pages src/components | sort -u
```

## Implementation

1. **Add a toolbar slot in `Table.vue`:**

   ```diff
   <template>
   -  <div v-if="mq" class="table-grid js-table w-full">
   +  <div v-if="mq" class="ccu-table-card w-full">
   +    <div v-if="$slots.toolbar" class="ccu-table-toolbar">
   +      <slot name="toolbar" />
   +    </div>
   +    <div class="table-grid js-table w-full">
        <div v-if="!hideHeader && !mq.mdMinus" class="header ..." :style="gridStyleHeader">
          <!-- ... existing header cells ... -->
        </div>
        <!-- ... body, footer ... -->
   +    </div>
     </div>
   </template>
   ```

   Styles:

   ```css
   .ccu-table-card {
     @apply bg-white rounded shadow-crisiscleanup-card overflow-hidden;
   }
   .ccu-table-toolbar {
     @apply flex items-center gap-2.5 p-3.5 border-b border-crisiscleanup-grey-100;
   }
   ```

2. **Restyle column headers** — bg + type:

   ```diff
   <div
     v-for="column of columns"
     ...
   - class="p-2 border-b flex items-center cursor-pointer header-column"
   + class="px-3 py-2.5 border-b bg-crisiscleanup-smoke flex items-center cursor-pointer header-column"
     ...
   >
     <slot :name="`${column.key}-title`" :column="column">
   -   <base-text
   -     class="text-crisiscleanup-grey-700"
   +   <span
   +     class="text-[10px] font-bold uppercase tracking-[0.06em] text-crisiscleanup-grey-900"
        :data-testid="`testColumn${column.key}TitleContent`"
   -     :class="column.titleClass && column.titleClass"
   -     variant="h3"
   -     regular
   -   >
   +     :class="column.titleClass">
        {{ $t(column.title) }}
   -   </base-text>
   +   </span>
     </slot>
   ```

   Also apply `bg-crisiscleanup-smoke` to the selection checkbox cell and the
   row-details cell (lines 10, 20) so the whole header strip reads as one band.

3. **Body / row tuning** (optional, minimal):

   ```diff
   <div
     v-for="item of data"
     :key="item.id"
     ...
   - class="hover:bg-crisiscleanup-light-grey border-b js-table-row"
   + class="hover:bg-crisiscleanup-light-grey border-b js-table-row text-[13px]"
     ...
   >
   ```

   (Row font-size nudge is optional — only if the current rows read too large.)

4. **Caller migration pattern** — move search/filter from floating above to
   the new toolbar slot:

   ```diff
   - <base-input icon="search" :placeholder="$t('actions.search')" ... />
   - <Table ... />
   + <Table ...>
   +   <template #toolbar>
   +     <base-input
   +       icon="search"
   +       :placeholder="$t('actions.search')"
   +       class="flex-1"
   +       v-model="query"
   +     />
   +     <div class="flex items-center gap-1.5">
   +       <base-button
   +         v-for="f in filters"
   +         :key="f.key"
   +         size="sm"
   +         :variant="activeFilter === f.key ? 'solid' : 'outline'"
   +         :action="() => (activeFilter = f.key)"
   +       >{{ f.label }}</base-button>
   +     </div>
   +   </template>
   + </Table>
   ```

   Keep the existing `enableColumnSearch` row mechanism — per-column search
   still makes sense for admin-style tables and is orthogonal to the
   global toolbar.

## Reuse

- `BasePill` from spec 06 — any status/priority column.
- `BaseButton` variants `solid` / `outline` with `size="sm"` — filter chips.
- `BaseInput` `icon="search"` — unchanged API.
- `shadow-crisiscleanup-card` token — the single signature shadow.
- `text-crisiscleanup-{smoke,grey-100,grey-900}` — already defined.

## Verification

- `pnpm dev` → `/cases` (or wherever the primary table lives). Table sits in
  a card; column headers are small uppercase grey labels on a smoke band.
  Search + filters live in a toolbar above the first row, flush with the card
  edges.
- Filter chip states visibly flip solid → outline on click.
- Column sorting still works (click a sortable header → sort icons + order
  change). The data-testid selectors `testColumn${column.key}Div` and
  `testColumn${column.key}TitleContent` still resolve.
- Column search row (when `enableColumnSearch`) still renders below the
  header band and stays functional.
- Cases status column renders `<BasePill>` instead of raw spans (requires spec
  06 to have shipped).
- `pnpm lint` + `pnpm typecheck` + `pnpm test` + `pnpm test:e2e:primary`
  (if local env is set up for auth).

## Out of scope

- Rewriting `Table.vue`'s CSS-grid sizing / column sizing logic.
- Virtualization / infinite scroll / server-side pagination beyond what
  already exists.
- Empty-state illustration (the kit's polite "nothing to show" card with the
  `cc-bugs` mascot — separate spec if we want it).
- Per-column cell alignment tweaks.

## Risks / rollback

- **Risk:** adding a `.ccu-table-card` wrapper changes the DOM nesting and
  could break consumers that position overlays/popovers relative to the table
  root. Mitigate by preserving the existing `.table-grid js-table` class on
  the inner grid (the diff above does).
- **Risk:** existing pages already have their own card/container around the
  table; double-nesting looks bad. Audit before shipping: if a parent already
  provides `shadow-crisiscleanup-card`, drop that from the parent when
  migrating callers.
- **Rollback:** the new styles are additive; reverting the template diffs
  restores the current look. Caller migrations are per-file and independently
  revertable.
