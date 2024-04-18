<template>
  <div class="text-center flex flex-col items-center gap-4">
    <base-text variant="h2" class="my-2" data-testid="testManualDialerContent">
      {{ $t('phoneDashboard.manual_dialer') }}
    </base-text>
    <base-text class="my-2" data-testid="testManualDialHiddenCallerIdContent">
      {{ $t('phoneDashboard.manual_dial_hidden_caller_id') }}
    </base-text>
    <div class="flex flex-col items-center gap-2 w-full max-w-md">
      <div class="grid grid-cols-6 gap-1">
        <base-select
          v-model="selectedCountryCode"
          data-testid="testCountryCodeSelect"
          :options="countryCodes"
          indicator-icon="caret-down"
          class="col-span-2"
          item-key="code"
          label="code"
          :placeholder="$t('phoneDashboard.code')"
        >
          <template #option="{ option }">
            <div class="flex items-center">
              <font-awesome-icon :icon="option.icon" class="w-6 h-4 mr-2" />
              <div>{{ option.code }}</div>
            </div>
          </template>
        </base-select>
        <base-input
          v-model="phoneNumber"
          data-testid="testPhoneNumberTextInput"
          type="tel"
          size="large"
          class="col-span-4 text-sm"
          :placeholder="$t('phoneDashboard.phone_number')"
        />
      </div>
      <base-button
        variant="solid"
        data-testid="testDialingButton"
        class="px-5 py-2 my-3 w-full"
        :text="
          dialing ? $t('phoneDashboard.dialing') : $t('phoneDashboard.dial')
        "
        :alt="
          dialing ? $t('phoneDashboard.dialing') : $t('phoneDashboard.dial')
        "
        :disabled="dialing || !phoneNumber"
        @click="handleDial"
      ></base-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import useEmitter from '../../hooks/useEmitter';
import BaseInput from '@/components/BaseInput.vue';

export default defineComponent({
  name: 'EnhancedManualDialer',
  components: { BaseInput },
  props: {
    dialing: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const { emitter } = useEmitter();

    const phoneNumber = ref('');
    const selectedCountryCode = ref(null);
    const countryCodes = ref([{ code: '+1', icon: 'flag-usa' }]);

    emitter.on('dialer:set_phone_number', (phone) => {
      phoneNumber.value = phone;
    });

    const handleDial = () => {
      emit('onDial', `${selectedCountryCode.value}${phoneNumber.value}`);
    };

    return {
      selectedCountryCode,
      phoneNumber,
      countryCodes,
      handleDial,
    };
  },
});
</script>

<style scoped>
/* Add scoped styles here if necessary */
</style>
