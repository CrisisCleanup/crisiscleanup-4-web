<template>
  <div class="flex">
    <div class="flex-grow" data-testid="testPhoneToolBarDiv">
      <Agent
        class="border-b shadow"
        :allowed-call-type="allowedCallType"
        @on-logged-in="onLoggedIn"
        @set-allowed-call-type="setAllowedCallType"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Agent from './Agent.vue';
import { AllowedCallType } from '@/pages/phone/PhoneSystem.vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'PhoneToolBar',
  components: { Agent },
  props: {
    completeCall: {
      type: Function,
      default() {},
    },
    onLoggedIn: {
      type: Function,
      default() {},
    },
    setAllowedCallType: {
      type: Function,
      default() {},
    },
    selectCase: {
      type: Function,
      default() {},
    },
    worksiteId: {
      type: Function,
      default() {},
    },
    allowedCallType: {
      type: AllowedCallType,
      default: 'BOTH',
    },
  },
  setup(props, context) {
    return {
      tabs: null,
    };
  },
});
</script>
