<template>
  <div class="flex">
    <div class="flex-grow" data-testid="testPhoneToolBarDiv">
      <Agent
        class="border-b shadow"
        @on-logged-in="onLoggedIn"
        @set-allowed-call-type="setAllowedCallType"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Agent from './Agent.vue';

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
  },
  data() {
    return {
      tabs: null,
    };
  },
});
</script>
