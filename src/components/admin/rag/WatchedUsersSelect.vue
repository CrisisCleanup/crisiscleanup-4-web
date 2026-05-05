<script setup lang="ts">
import Multiselect from '@vueform/multiselect';
import User from '@/models/User';

interface UserRow {
  id: number;
  full_name?: string;
  email?: string;
  mobile?: string;
}

const props = defineProps<{
  modelValue: number[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', ids: number[]): void;
}>();

// Cache of loaded user records keyed by id. With a pure async loader,
// `@vueform/multiselect` has nothing to resolve `42 → {full_name: "…"}`
// against until the user opens the dropdown — so saved IDs render as bare
// numbers. We mitigate by:
//   1. Hydrating `knownUsers` for the current modelValue IDs on mount.
//   2. Returning Object.values(knownUsers) for the empty query so
//      multiselect can resolve pill labels before the user types.
//   3. Setting :resolve-on-load=true so multiselect calls the loader once
//      at mount with an empty query.
const knownUsers = ref<Record<number, UserRow>>({});

const hydrateMissing = async (ids: number[]) => {
  const missing = ids.filter((id) => !knownUsers.value[id]);
  if (missing.length === 0) return;
  try {
    const result = await User.api().get(`/users?id__in=${missing.join(',')}`, {
      dataKey: 'results',
    });
    const rows =
      (result?.entities as { users?: UserRow[] } | undefined)?.users ?? [];
    const next = { ...knownUsers.value };
    for (const row of rows) next[row.id] = row;
    knownUsers.value = next;
  } catch {
    // Silently leave hydration partial — pills fall back to `#id`.
  }
};

watch(
  () => props.modelValue,
  (ids: number[] | undefined) => {
    if (ids?.length) void hydrateMissing(ids);
  },
  { immediate: true, deep: true },
);

const onSearchUsers = async (query: string): Promise<UserRow[]> => {
  if (!query) {
    return Object.values(knownUsers.value);
  }
  const result = await User.api().get(
    `/users?search=${encodeURIComponent(query)}&limit=10`,
    { dataKey: 'results' },
  );
  const users =
    (result?.entities as { users?: UserRow[] } | undefined)?.users ?? [];
  if (users.length > 0) {
    const next = { ...knownUsers.value };
    for (const u of users) next[u.id] = u;
    knownUsers.value = next;
  }
  // Always include already-selected users so multiselect has labels for
  // existing pills even when the current search wouldn't match them.
  const merged = new Map<number, UserRow>();
  for (const id of props.modelValue) {
    const row = knownUsers.value[id];
    if (row) merged.set(id, row);
  }
  for (const u of users) merged.set(u.id, u);
  return [...merged.values()];
};

const onUpdate = (next: number[]) => {
  emit('update:modelValue', next ?? []);
};

const labelFor = (id: number): string => {
  const row = knownUsers.value[id];
  if (row?.full_name) return row.full_name;
  if (row?.email) return row.email;
  return `#${id}`;
};

// Force the underlying @vueform/multiselect to re-call its async options
// loader after the initial hydration completes. The multiselect resolves
// options once at mount (when `knownUsers` is empty) and caches the empty
// result, so pre-existing IDs in modelValue render as bare numbers (or
// nothing) until the user opens the dropdown. Bumping a `key` on the
// component forces a remount once we have data, which re-runs
// resolveOnLoad with the now-populated cache.
const remountKey = computed(() => {
  // Only bump after every selected ID is known; bumping continually as
  // search results stream in would steal focus while typing.
  if (!props.modelValue?.length) return 'empty';
  const allKnown = props.modelValue.every((id) =>
    Boolean(knownUsers.value[id]),
  );
  return allKnown ? `hydrated:${props.modelValue.join(',')}` : 'pending';
});

// classes mirror the rest of the editor's slate palette.
const msClasses = {
  container:
    'relative mx-auto w-full flex items-center justify-end cursor-pointer bg-white text-[14px] leading-snug outline-none rounded-md border border-slate-200 transition focus-within:border-slate-400 focus-within:shadow-[0_0_0_2px_rgba(15,23,42,0.08)] min-h-[40px]',
  wrapper:
    'relative mx-auto w-full flex items-center justify-end box-border cursor-pointer outline-none min-h-[40px] py-1 px-2',
  search:
    'w-full absolute inset-0 outline-none focus:ring-0 appearance-none box-border border-0 text-base font-sans bg-white rounded pl-3 rtl:pl-0 rtl:pr-3',
  tags: 'flex-grow flex-shrink flex flex-wrap mt-1 pl-2 min-w-0 rtl:pl-0 rtl:pr-2',
  tag: 'bg-slate-100 text-slate-800 text-xs font-semibold py-0.5 px-2 rounded-full mr-1 mb-1 flex items-center whitespace-nowrap rtl:pr-2 rtl:mr-0 rtl:ml-1 border border-slate-200',
  tagsSearchWrapper:
    'inline-block relative mx-1 mb-1 flex-grow flex-shrink h-full',
  tagsSearch:
    'absolute inset-0 border-0 outline-none focus:ring-0 appearance-none p-0 text-base font-sans box-border w-full',
  tagsSearchCopy: 'invisible whitespace-pre-wrap inline-block h-px',
  placeholder:
    'flex items-center h-full absolute left-0 top-0 pointer-events-none bg-transparent leading-snug pl-3.5 text-slate-400 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3.5',
  caret:
    'bg-multiselect-caret bg-center bg-no-repeat w-2.5 h-4 py-px box-content mr-3 relative z-10 opacity-40 flex-shrink-0 flex-grow-0 transition-transform transform pointer-events-none rtl:mr-0 rtl:ml-3.5',
  caretOpen: 'rotate-180 pointer-events-auto',
  clear:
    'pr-3.5 relative z-10 opacity-40 transition duration-300 flex-shrink-0 flex-grow-0 flex hover:opacity-80 rtl:pr-0 rtl:pl-3.5',
  clearIcon:
    'bg-multiselect-remove bg-center bg-no-repeat w-2.5 h-4 py-px box-content inline-block',
  spinner:
    'bg-multiselect-spinner bg-center bg-no-repeat w-4 h-4 z-10 mr-3.5 animate-spin flex-shrink-0 flex-grow-0 rtl:mr-0 rtl:ml-3.5',
  inifite: 'flex items-center justify-center w-full',
  inifiteSpinner:
    'bg-multiselect-spinner bg-center bg-no-repeat w-4 h-4 z-10 animate-spin flex-shrink-0 flex-grow-0 m-3.5',
  dropdown:
    'absolute -left-px -right-px bottom-0 transform translate-y-full border border-slate-200 -mt-px overflow-y-scroll z-50 bg-white flex flex-col rounded-b shadow-md',
  dropdownTop:
    '-translate-y-full top-px bottom-auto rounded-b-none rounded-t flex-col-reverse',
  dropdownHidden: 'hidden',
  options: 'flex flex-col p-0 m-0 list-none',
  optionsTop: '',
  group: 'p-0 m-0',
  groupLabel:
    'flex text-sm box-border items-center justify-start text-left py-1 px-3 font-semibold bg-slate-100 cursor-default leading-normal',
  groupLabelPointable: 'cursor-pointer',
  groupLabelPointed: 'bg-slate-200 text-slate-800',
  groupLabelSelected: 'bg-slate-700 text-white',
  groupLabelDisabled: 'bg-slate-100 text-slate-300 cursor-not-allowed',
  groupLabelSelectedPointed: 'bg-slate-700 text-white opacity-90',
  groupLabelSelectedDisabled:
    'text-slate-50 bg-slate-700 bg-opacity-50 cursor-not-allowed',
  groupOptions: 'p-0 m-0',
  option:
    'flex items-center justify-start box-border text-left cursor-pointer text-base leading-snug py-2 px-3',
  optionPointed: 'text-slate-900 bg-slate-100',
  optionSelected: 'text-white bg-slate-900',
  optionDisabled: 'text-slate-300 cursor-not-allowed',
  optionSelectedPointed: 'text-white bg-slate-900 opacity-90',
  optionSelectedDisabled:
    'text-white bg-slate-900 bg-opacity-50 cursor-not-allowed',
  noOptions: 'py-2 px-3 text-slate-500 bg-white text-left',
  noResults: 'py-2 px-3 text-slate-500 bg-white text-left',
  fakeInput:
    'bg-transparent absolute left-0 right-0 -bottom-px w-full h-px border-0 p-0 appearance-none outline-none text-transparent',
  spacer: 'h-9 py-px box-content',
};
</script>

<template>
  <Multiselect
    :key="remountKey"
    :model-value="modelValue"
    :options="onSearchUsers"
    mode="tags"
    :searchable="true"
    :resolve-on-load="true"
    :min-chars="0"
    :delay="200"
    :filter-results="false"
    :clear-on-blur="false"
    :placeholder="placeholder"
    value-prop="id"
    label="full_name"
    track-by="full_name"
    :classes="msClasses"
    @update:model-value="onUpdate"
  >
    <template #tag="{ option, handleTagRemove, disabled }">
      <span :class="msClasses.tag">
        <span>
          {{
            labelFor(
              typeof option === 'object' ? option.id : (option as number),
            )
          }}
        </span>
        <button
          v-if="!disabled"
          type="button"
          class="ml-1 opacity-60 hover:opacity-100"
          @mousedown.prevent.stop="handleTagRemove(option, $event)"
        >
          ×
        </button>
      </span>
    </template>
    <template #option="{ option }">
      <div class="flex flex-col">
        <span class="text-sm">{{ option.full_name || `#${option.id}` }}</span>
        <span v-if="option.email" class="text-xs text-slate-500">
          {{ option.email }}
        </span>
      </div>
    </template>
  </Multiselect>
</template>

<style src="@vueform/multiselect/themes/tailwind.css"></style>
