<template>
  <div :class="classes">
    <button :class="buttonClasses" @click="toggleOpen">
      <slot name="name">
        {{ name }}
      </slot>
      <font-awesome-icon :icon="isOpen ? openIcon : closedIcon" />
    </button>
    <div v-show="isOpen" :class="bodyClasses">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs, computed } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faPlus,
  faMinus,
  faChevronDown,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

library.add(faPlus, faMinus, faChevronDown, faChevronRight);

export default {
  name: 'AccordionItem',
  components: {
    FontAwesomeIcon,
  },
  props: {
    name: {
      type: String,
      required: true,
    },
    iconStyle: {
      type: String,
      default: 'chevron', // Options: 'chevron', 'plus-minus'
    },
    classes: {
      type: String,
      default: 'border-b border-gray-200',
    },
    buttonClasses: {
      type: String,
      default:
        'w-full text-left bg-white py-2 px-4 hover:bg-gray-100 focus:outline-none flex justify-between items-center',
    },
    bodyClasses: {
      type: String,
      default: 'py-2 px-4',
    },
  },
  setup(props) {
    const state = reactive({
      isOpen: false,
    });

    const toggleOpen = () => {
      state.isOpen = !state.isOpen;
    };

    const openIcon = computed(() =>
      props.iconStyle === 'chevron' ? 'chevron-down' : 'minus',
    );
    const closedIcon = computed(() =>
      props.iconStyle === 'chevron' ? 'chevron-right' : 'plus',
    );

    return {
      ...toRefs(state),
      toggleOpen,
      openIcon,
      closedIcon,
    };
  },
};
</script>
