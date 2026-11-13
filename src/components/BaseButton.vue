<template>
  <button
    :class="[styles, buttonSelector]"
    :alt="alt || text"
    :aria-label="accessibleName"
    :disabled="disabled || loading"
    type="submit"
    :size="size"
    :title="buttonTitle"
    :data-testid="buttonSelector"
    @click.prevent="performAction"
  >
    <spinner v-if="loading || showSpinner" size="sm" />
    <font-awesome-icon v-if="icon" class="m-1" :icon="icon" :size="iconSize" />
    <ccu-icon v-if="ccuIcon" class="m-1" :type="ccuIcon" :size="iconSize" />
    <slot>{{ text }}</slot>
    <font-awesome-icon v-if="suffixIcon" class="m-1" :icon="suffixIcon" />
  </button>
</template>

<script lang="ts">
import { kebabCase } from 'lodash-es';
import type { PropType } from 'vue';
import { ref, computed, defineComponent } from 'vue';
import type {
  BUTTON_VARIANTS as VARIANTS,
  ICON_SIZES,
  ICONS,
} from '../constants';
import useLogEvent from '@/hooks/useLogEvent';

type ButtonSize = 'small' | 'medium' | 'large' | 'sm' | 'md' | 'lg';
type IconSize = (typeof ICON_SIZES)[number];

export default defineComponent({
  name: 'BaseButton',

  props: {
    action: {
      type: Function as PropType<() => any>,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    showSpinner: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
      default: '',
    },
    alt: {
      type: String,
      default: 'button',
    },
    title: {
      type: String,
      default: '',
    },
    ccuEvent: {
      type: String,
      default: '',
    },
    size: {
      type: String as PropType<ButtonSize>,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    ccuIcon: {
      type: String as PropType<keyof typeof ICONS>,
      default: '',
    },
    iconSize: {
      type: String as PropType<IconSize>,
      default: '',
    },
    suffixIcon: {
      type: String as PropType<keyof typeof ICONS>,
      default: '',
    },
    selector: {
      type: String,
      default: '',
    },
    variant: {
      type: String as PropType<(typeof VARIANTS)[keyof typeof VARIANTS]>,
      default: '',
    },
    type: {
      type: String,
      default: '',
    },
    timeout: {
      type: Number,
      default: 5000,
    },
    buttonClasses: {
      type: Object,
      default: () => ({}),
    },
  },

  setup(props, { slots }) {
    const delay = async (ms: number) =>
      new Promise((res) => setTimeout(res, ms));
    const loading = ref(false);

    const buttonTitle = computed(() => props.text || props.alt || props.title);

    // When the button has visible text, let it be its own name; otherwise
    // surface `alt`/`title` via aria-label so icon-only buttons satisfy
    // Lighthouse button-name.
    const accessibleName = computed(() => {
      if (props.text) return;
      return props.alt === 'button' ? props.title || undefined : props.alt;
    });

    const buttonSelector = computed(
      () => props.selector || `js-${kebabCase(buttonTitle.value)}`,
    );

    // A button with a background or a border has one of three heights. A
    // caller that gives no size gets the medium height. A button that looks
    // like text (a link, or no variant) has no height of its own, because it
    // often wraps other content.
    const hasBox = computed(
      () =>
        ['solid', 'outline', 'outline-dark', 'danger'].includes(
          props.variant,
        ) || ['primary', 'danger', 'warning'].includes(props.type),
    );
    const buttonSize = computed(() => {
      if (['large', 'lg'].includes(props.size)) return 'large';
      if (['small', 'sm'].includes(props.size)) return 'small';
      if (['medium', 'md'].includes(props.size) || hasBox.value) {
        return 'medium';
      }
      return '';
    });
    const isIconOnly = computed(() => props.text === '' && !slots.default);

    const styles = computed(() => {
      const styleObject = {
        'large text-h3 font-h3': buttonSize.value === 'large',
        'medium text-sans text-h4 font-h4':
          buttonSize.value === 'medium' && props.size !== '',
        medium: buttonSize.value === 'medium',
        'small text-bodysm font-bodysm': buttonSize.value === 'small',
        'icon-only': isIconOnly.value,
        disabled: props.disabled,
        // **** DEPRECATED ****
        primary: props.type === 'primary',
        danger: props.type === 'danger',
        warning: props.type === 'warning',
        link: props.type === 'link',
        bare: props.type === 'bare',
        // **************
        flex: true,
        'items-center': true,
        'justify-center': true,
        'base-button': true,
        ...props.buttonClasses,
      } as Record<string, string | boolean>;
      if (props.variant) {
        styleObject[props.variant] = true;
      }

      styleObject[props.variant] = true;
      return styleObject;
    });

    const timeout = async () => {
      await delay(props.timeout);
      throw new Error('Button Action timed out!');
    };

    const performAction = async () => {
      loading.value = true;

      try {
        if (typeof props.action == 'function') {
          await Promise.race([props.action(), timeout()]);
        }
      } catch {
        // TODO: expose method for handling button exceptions
      } finally {
        const { logEvent } = useLogEvent();
        logEvent(props.ccuEvent);
        loading.value = false;
      }
    };

    return {
      loading,
      styles,
      buttonSelector,
      buttonTitle,
      accessibleName,
      performAction,
    };
  },
});
</script>

<style scoped>
button {
  @apply font-sans;
  cursor: pointer;
  border-radius: 4px;
  transition: all 300ms ease;
}

button:focus-visible {
  outline: 2px solid theme('colors.primary.light');
  outline-offset: 2px;
}

/** ----- DEPRECATED ----- */
.primary {
  @apply bg-primary-light;
}

.link {
  @apply text-primary-dark underline underline-offset-2;
}

/** ----- DEPRECATED ----- */

button.solid {
  @apply bg-primary-light border-primary-light border;
}

button.solid:hover {
  @apply bg-crisiscleanup-yellow-100;
}

button.solid.disabled {
  @apply bg-crisiscleanup-dark-200 !important;
  @apply border-crisiscleanup-dark-200 !important;
  @apply text-gray-100;
}

button.danger {
  @apply bg-crisiscleanup-red-900 border border-crisiscleanup-red-900 text-white;
}

button.danger:hover {
  @apply brightness-95;
}

button.danger.disabled {
  @apply bg-crisiscleanup-dark-200 border-crisiscleanup-dark-200 text-gray-100;
}

button.outline {
  @apply bg-transparent border-2 border-crisiscleanup-dark-400;
  outline-style: none;
}

button.outline:hover {
  @apply bg-crisiscleanup-dark-500;
  @apply text-gray-100;
}

button.outline.disabled {
  @apply text-crisiscleanup-grey-900;
}

button.outline.disabled:hover {
  @apply text-crisiscleanup-grey-900;
}

button.outline-dark {
  background-color: transparent;
  border: 1px solid white;
}

button.outline-dark:hover {
  @apply bg-crisiscleanup-dark-500;
  @apply text-gray-100;
}

button.outline-dark.disabled {
  @apply text-crisiscleanup-grey-900;
}

button.outline-dark.disabled:hover {
  @apply text-crisiscleanup-grey-900;
}

button.text {
  background-color: transparent;
}

button.text:hover {
  @apply bg-crisiscleanup-grey-100;
}

button.text.disabled {
  @apply text-crisiscleanup-grey-900;
}

button.text.disabled:hover {
  @apply text-crisiscleanup-grey-900;
}

/* The three button heights. The padding is set here, and not by the caller,
   so that all buttons of one size have the same height. A label that wraps
   to two lines makes the button taller. */
button.small,
button.medium,
button.large {
  line-height: 1.2;
}

button.small {
  min-height: 28px;
  padding: 2px 12px;
}

button.medium {
  min-height: 36px;
  padding: 4px 16px;
}

button.large {
  min-height: 44px;
  padding: 4px 20px;
}

/* A button with an icon and no label is a square. */
button.small.icon-only {
  min-width: 28px;
  padding: 0;
}

button.medium.icon-only {
  min-width: 36px;
  padding: 0;
}

button.large.icon-only {
  min-width: 44px;
  padding: 0;
}

button.text-dark {
  @apply text-crisiscleanup-dashboard-blue;
}
</style>
