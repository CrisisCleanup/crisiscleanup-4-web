<template>
  <div class="text-center flex flex-col items-center gap-4">
    <base-text variant="h2" class="my-2" data-testid="testManualDialerContent">
      {{ $t('phoneDashboard.manual_dialer') }}
    </base-text>
    <base-text class="my-2" data-testid="testManualDialHiddenCallerIdContent">
      {{ $t('phoneDashboard.manual_dial_hidden_caller_id') }}
    </base-text>
    <base-text class="" data-testid="testManualDialerNoLateOutboundCalls">
      {{ $t('phoneDashboard.no_late_outbound_calls') }}
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
        <PhoneNumberInput
          v-model="phone"
          data-testid="testPhoneNumberTextInput"
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
        :disabled="
          (dialing || !phone || after10pmEastern || !hasActiveHotline) &&
          !can('development_mode')
        "
        @click="handleDial"
      ></base-button>

      <div>{{ $t('phoneDashboard.or') }}</div>

      <base-button
        variant="outline"
        data-testid="testDialHiddenCallerIdButton"
        class="px-5 py-2 my-3 w-full"
        :text="$t('phoneDashboard.remove_from_queue')"
        :alt="$t('phoneDashboard.remove_from_queue')"
        @click="removeNumberFromQueue"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import useEmitter from '../../hooks/useEmitter';
import BaseInput from '@/components/BaseInput.vue';
import moment from 'moment';
import PhoneNumberInput from '@/components/PhoneNumberInput.vue';
import { useActiveHotlines } from '@/hooks/useActiveHotlines';
import useAcl from '@/hooks/useAcl';

export default defineComponent({
  name: 'EnhancedManualDialer',
  components: { PhoneNumberInput, BaseInput },
  props: {
    dialing: {
      type: Boolean,
      default: false,
    },
    phoneNumber: {
      type: String,
      default: '',
    },
  },
  emits: ['onDial', 'onRemoveNumberFromQueue'],
  setup(props, { emit }) {
    const { isLoading, incidentsWithActiveHotline } = useActiveHotlines();
    const { $can } = useAcl();

    const phone = ref('');
    const selectedCountryCode = ref('+1');
    const countryCodes = ref([{ code: '+1', icon: 'flag-usa' }]);

    const after10pmEastern = ref(false);

    const updateAfter10State = () => {
      const tenEst = moment()
        .startOf('day')
        .utcOffset(-4)
        .hour(22)
        .utcOffset(-4);
      after10pmEastern.value = moment().isAfter(tenEst);
    };

    const handleDial = () => {
      updateAfter10State();
      if (!after10pmEastern.value) {
        emit('onDial', `${selectedCountryCode.value}${phone.value}`);
      }
    };

    const removeNumberFromQueue = () => {
      emit('onRemoveNumberFromQueue', phone.value);
    };

    const hasActiveHotline = computed(() => {
      return incidentsWithActiveHotline.value.length > 0;
    });

    onMounted(() => {
      updateAfter10State();
      if (props.phoneNumber) {
        phone.value = props.phoneNumber;
      }
    });
    return {
      can: $can,
      selectedCountryCode,
      phone,
      countryCodes,
      handleDial,
      removeNumberFromQueue,
      after10pmEastern,
      hasActiveHotline,
    };
  },
});
</script>

<style scoped>
/* Add scoped styles here if necessary */
</style>
