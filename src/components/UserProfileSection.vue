<template>
  <div class="border w-full p-2 px-3">
    <div class="flex items-center justify-between my-1.5">
      <h2 class="text-base">
        {{ title }}
      </h2>
      <ccu-icon
        v-if="!isExpanded && expandable"
        type="edit"
        class="cursor-pointer"
        size="small"
        :data-testid="`testToggle${sectionKey}Section`"
        @click="toggleSection"
      />
    </div>

    <!-- Collapsed Section -->
    <div v-if="!isExpanded" class="text-sm flex flex-col gap-0.5">
      <slot name="collapsed"></slot>
    </div>

    <!-- Expanded Section -->
    <div v-else class="text-sm">
      <slot name="expanded"></slot>
      <div class="flex gap-2">
        <base-button
          variant="solid"
          :action="saveAction"
          class="mt-2"
          size="small"
          :alt="$t('actions.save')"
        >
          {{ $t('actions.save') }}
        </base-button>
        <base-button
          variant="outline"
          class="mt-2"
          size="small"
          :alt="$t('actions.cancel')"
          @click="toggleSection"
        >
          {{ $t('actions.cancel') }}
        </base-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  saveAction: {
    type: Function,
    required: true,
  },
  expandedSections: {
    type: Object,
    required: true,
  },
  sectionKey: {
    type: String,
    required: true,
  },
  expandable: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['toggle-section']);

const isExpanded = computed(() => props.expandedSections[props.sectionKey]);

function toggleSection() {
  emit('toggle-section', props.sectionKey);
}
</script>
