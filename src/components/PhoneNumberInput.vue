<script setup lang="ts">
import BaseInput, {
  type BaseInputEmits,
  type BaseInputProps,
} from '@/components/BaseInput.vue';
import useValidation from '@/hooks/useValidation';

defineOptions({
  inheritAttrs: false,
});

export type PhoneNumberInputProps = BaseInputProps;
export type PhoneNumberInputEmits = BaseInputEmits;

const props = defineProps<PhoneNumberInputProps>();
const emit = defineEmits<PhoneNumberInputEmits>();

const { validatePhoneNumber } = useValidation();

function updatePhoneNumber(value: string) {
  emit('update:modelValue', value);
}

function handleIconClick() {
  emit('iconClicked');
}

onMounted(() => {
  // Auto format initially passed phone number
  if (props.modelValue) {
    const { newValue } = validatePhoneNumber(props.modelValue);
    emit('update:modelValue', newValue);
  }
});
</script>

<template>
  <BaseInput
    v-bind="{ ...$attrs, ...$props }"
    :model-value="props.modelValue"
    :validator="validatePhoneNumber"
    @update:model-value="updatePhoneNumber"
    @icon-clicked="handleIconClick"
  />
</template>

<style lang="postcss" scoped></style>
