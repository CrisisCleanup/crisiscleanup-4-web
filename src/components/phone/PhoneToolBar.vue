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
