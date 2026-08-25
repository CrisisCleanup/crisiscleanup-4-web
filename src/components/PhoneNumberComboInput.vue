<script setup lang="ts">
import type { PropType } from 'vue';
import BaseSelect from '@/components/BaseSelect.vue';
import PhoneNumberInput from '@/components/PhoneNumberInput.vue';

interface CountryCode {
  code: string;
  icon: string | string[];
}

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  countryCode: {
    type: String,
    default: '+1',
  },
  countryCodes: {
    type: Array as PropType<CountryCode[]>,
    default: () => [{ code: '+1', icon: 'flag-usa' }],
  },
  placeholder: {
    type: String,
    default: '',
  },
});

defineEmits(['update:modelValue', 'update:countryCode']);
</script>

<template>
  <div
    class="phone-combo h-12 w-full flex items-stretch rounded border border-crisiscleanup-dark-100 bg-white transition focus-within:border-primary-light"
  >
    <BaseSelect
      :model-value="countryCode"
      data-testid="testCountryCodeSelect"
      :options="countryCodes"
      indicator-icon="caret-down"
      class="phone-combo__code w-24 flex-none h-full"
      item-key="code"
      label="code"
      :searchable="false"
      :clearable="false"
      @update:model-value="$emit('update:countryCode', $event)"
    >
      <template #selected-option="{ option }">
        <span
          class="absolute left-0 top-0 h-full flex items-center pl-3 pointer-events-none"
        >
          <font-awesome-icon :icon="option.icon" class="w-5 h-3.5 mr-1.5" />
          <span class="text-sm">{{ option.code }}</span>
        </span>
      </template>
      <template #option="{ option }">
        <div class="flex items-center">
          <font-awesome-icon :icon="option.icon" class="w-6 h-4 mr-2" />
          <div>{{ option.code }}</div>
        </div>
      </template>
    </BaseSelect>
    <div class="w-px bg-crisiscleanup-dark-100 my-2 flex-none"></div>
    <PhoneNumberInput
      :model-value="modelValue"
      data-testid="testPhoneNumberTextInput"
      class="phone-combo__number flex-1 min-w-0 h-full justify-center"
      :placeholder="placeholder"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<style lang="postcss" scoped>
/* The wrapper draws the single border; strip the inner controls' own chrome. */
.phone-combo__code :deep(.multiselect) {
  border: none;
  background: transparent;
  height: 100%;
  min-height: 0;
  box-shadow: none;
}

.phone-combo__code :deep(.multiselect.is-active) {
  box-shadow: none;
}

.phone-combo__number :deep(.ccu-field__row) {
  height: 100%;
}

.phone-combo__number :deep(input) {
  border: none;
  height: 100%;
  width: 100%;
  background: transparent;
}

.phone-combo__number :deep(input:focus) {
  box-shadow: none;
}
</style>
