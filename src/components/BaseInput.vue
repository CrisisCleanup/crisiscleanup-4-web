<template>
  <div class="ccu-field flex flex-col gap-1.5 relative">
    <label
      v-if="topLabel"
      :for="fieldId"
      class="text-[11px] font-bold text-black"
    >
      {{ topLabel }}
    </label>
    <div class="ccu-field__row flex items-center relative" :class="rowClasses">
      <component
        :is="textArea ? 'textarea' : 'input'"
        :id="fieldId"
        v-bind="$attrs"
        ref="input"
        :class="[inputClasses, defaultInputClasses, selector]"
        :style="[cssVars, inputStyle]"
        :type="passwordView || type || 'search'"
        :value.prop="modelValue"
        :disabled="disabled || (breakGlass && !glassBroken)"
        :placeholder="placeholder"
        :required="required"
        :hidden="hidden"
        :pattern="pattern"
        :autocomplete="autocomplete"
        :rows="rows"
        :aria-invalid="Boolean(resolvedError) || undefined"
        :aria-describedby="resolvedError || hint ? `${fieldId}-msg` : undefined"
        @input="update"
        @input.stop=""
        @change="change"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
        @keyup.enter="$emit('enter')"
        @invalid="isInvalid = true"
      />
      <div
        v-if="breakGlass && !glassBroken && !hidden"
        class="icon-container flex items-center justify-center"
        :class="iconClasses"
        @click="glassBroken = true"
      >
        <ccu-icon
          :alt="$t('actions.edit')"
          data-testid="testBreakGlassButton"
          type="edit"
          size="small"
          class="js-break-glass"
        />
      </div>
      <div
        v-if="faIcon"
        class="icon-container flex items-center justify-center"
        :class="iconClasses"
      >
        <ccu-icon
          :fa="true"
          size="medium"
          :type="faIcon"
          :alt="tooltip"
          :action="
            () => {
              $emit('iconClicked');
            }
          "
        />
      </div>
      <div
        v-else-if="icon || tooltip"
        v-tooltip="{
          content: tooltip,
          triggers: ['hover'],
          popperClass: 'interactive-tooltip w-72',
          html: true,
        }"
        class="icon-container flex items-center justify-center"
        :class="iconClasses"
      >
        <ccu-icon
          :alt="$t('actions.help_alt')"
          :type="tooltip ? 'info' : icon"
          :size="iconSize"
        />
      </div>
      <font-awesome-icon
        v-if="type === 'password'"
        :alt="$t('info.password')"
        size="lg"
        class="cursor-pointer absolute right-0 mr-4"
        :icon="passwordView === 'text' ? 'eye-slash' : 'eye'"
        @click="
          () => {
            if (passwordView === 'text') {
              passwordView = 'password';
            } else {
              passwordView = 'text';
            }
          }
        "
      />
      <slot></slot>
    </div>
    <p
      v-if="resolvedError"
      :id="`${fieldId}-msg`"
      class="text-[11px] text-crisiscleanup-red-900"
      role="alert"
    >
      {{ resolvedError }}
    </p>
    <p
      v-else-if="hint"
      :id="`${fieldId}-msg`"
      class="text-[11px] text-crisiscleanup-grey-900"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script lang="ts">
import { ref, computed, defineComponent } from 'vue';
import type { PropType } from 'vue';
import { uniqueId } from 'lodash';

export interface BaseInputProps {
  textAreaAutoResize?: boolean;
  size?: string;
  icon?: string;
  faIcon?: string;
  iconSize?: string;
  modelValue?: any;
  disabled?: boolean;
  hidden?: boolean;
  placeholder?: string;
  pattern?: string;
  required?: boolean;
  tooltip?: string;
  topLabel?: string;
  type?: string;
  inputStyle?: string;
  inputClasses?: string;
  breakGlass?: boolean;
  readonly?: boolean;
  selector?: string;
  autocomplete?: string;
  textArea?: boolean;
  rows?: number;
  validator?: ((value: any) => { newValue: any; valid: boolean }) | boolean;
  width?: string;
  height?: string;
  hint?: string;
  errorMessage?: string | string[];
}

export interface BaseInputEmits {
  (event: 'update:modelValue', value: any): void;
  (event: 'iconClicked'): void;
  (event: 'change'): void;
  (event: 'blur'): void;
  (event: 'focus'): void;
  (event: 'enter'): void;
}

export default defineComponent({
  name: 'BaseInput',
  props: {
    textAreaAutoResize: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    faIcon: {
      type: String,
      default: '',
    },
    iconSize: {
      type: String,
      default: 'small',
    },
    modelValue: {
      type: null,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
    pattern: {
      type: String,
      default: '.*',
    },
    required: {
      type: Boolean,
      default: false,
    },
    tooltip: {
      type: String,
      default: '',
    },
    topLabel: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: '',
    },
    inputStyle: {
      type: String,
      default: '',
    },
    inputClasses: {
      type: String,
      default: '',
    },
    breakGlass: {
      type: Boolean,
      default: false,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    selector: {
      type: String,
      default: '',
    },
    autocomplete: {
      type: String,
      default: 'off',
    },
    textArea: {
      type: Boolean,
      default: false,
    },
    rows: {
      type: Number,
      default: 0,
    },
    validator: {
      type: [Function, Boolean],
      default: false,
    },
    width: {
      type: String,
      default: '300',
    },
    height: {
      type: String,
      default: '40',
    },
    hint: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: [String, Array] as PropType<string | string[]>,
      default: '',
    },
  },
  emits: [
    'update:modelValue',
    'change',
    'blur',
    'focus',
    'enter',
    'iconClicked',
  ],

  setup(props, context) {
    const { t } = useI18n();
    const fieldId = `base-input-${uniqueId()}`;
    const isInvalid = ref(false);
    const input = ref(null);
    const passwordView = ref(props.type === 'password' ? 'password' : '');
    const iconClasses = ref({
      large: props.size === 'large',
      small: props.size === 'small',
      base: props.size !== 'large' && props.size !== 'small',
      'has-tooltip': Boolean(props.tooltip),
    });
    const glassBroken = ref(false);

    const cssVars = computed(() => {
      return {
        '--height': `${props.height}px`,
        '--width': `${props.width}px`,
      };
    });

    const resolvedError = computed(() => {
      const custom = Array.isArray(props.errorMessage)
        ? props.errorMessage[0]
        : props.errorMessage;
      if (custom) return custom;
      if (props.required && isInvalid.value && !props.modelValue) {
        return t('info.required');
      }
      return '';
    });

    const rowClasses = computed(() => ({
      'has-error': Boolean(resolvedError.value),
    }));

    const hasAdjacentIcon = computed(() =>
      Boolean(
        props.faIcon ||
          props.icon ||
          props.tooltip ||
          (props.breakGlass && !glassBroken.value && !props.hidden),
      ),
    );

    const defaultInputClasses = computed(() => ({
      'flex-grow': true,
      'text-base': !props.inputClasses,
      xlarge: props.size === 'xlarge',
      large: props.size === 'large',
      medium: props.size === 'medium',
      small: props.size === 'small',
      base: props.size === 0,
      'has-icon': Boolean(props.icon),
      'has-adjacent-icon': hasAdjacentIcon.value,
      'has-tooltip': Boolean(props.tooltip),
      invalid: Boolean(resolvedError.value),
      noscrollbars: Boolean(props.textAreaAutoResize),
    }));

    function update(e) {
      const { value } = e.target;
      if (props.validator) {
        const { newValue, valid } = props.validator(value);
        isInvalid.value = valid;
        if (newValue) {
          // input.value = newValue;
          return context.emit('update:modelValue', newValue);
        }
      }
      if (props.textAreaAutoResize) {
        textAreaAutoResize();
      }
      context.emit('update:modelValue', value);
      isInvalid.value = !input?.value?.checkValidity();
      return value;
    }

    function textAreaAutoResize() {
      nextTick(() => {
        const element = input.value;
        if (
          props.textArea &&
          element &&
          element.scrollHeight > element.clientHeight
        ) {
          element.style.height = `${element.scrollHeight}px`;
        }
      });
    }
    function change(e) {
      context.emit('change', e.target.value);
      isInvalid.value = !input?.value?.checkValidity();
    }

    return {
      input,
      fieldId,
      isInvalid,
      passwordView,
      iconClasses,
      glassBroken,
      rowClasses,
      resolvedError,
      cssVars,
      defaultInputClasses,
      update,
      change,
    };
  },
});
</script>

<style scoped>
input:disabled {
  background-color: #f7f7f7;
}

textarea:disabled {
  background-color: #f7f7f7;
}

input::placeholder {
  @apply text-crisiscleanup-dark-300;
}

textarea::placeholder {
  @apply text-crisiscleanup-dark-300;
}

input.invalid,
textarea.invalid {
  @apply border border-crisiscleanup-red-900;
}

input.invalid:focus,
textarea.invalid:focus {
  border-color: theme('colors.crisiscleanup-red.900');
  box-shadow: 0 0 0 2px rgba(206, 0, 0, 0.2);
}

textarea.noscrollbars {
  overflow: hidden;
  width: 300px;
  height: 100px;
}
input {
  outline: none;
  width: var(--width);
  height: var(--height);
  border-radius: 4px;
  @apply border border-crisiscleanup-dark-100;
  box-sizing: border-box;
  padding: 9px 10px;
  font-size: 14px;
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;
  -webkit-appearance: none;
  opacity: 1;
}

textarea {
  outline: none;
  @apply border border-crisiscleanup-dark-100;
  border-radius: 4px;
  box-sizing: border-box;
  padding: 9px 10px;
  font-size: 14px;
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;
}

input:not([type='radio']):not([type='checkbox']) {
  -webkit-appearance: none;
  border-radius: 4px;
}

input:focus,
textarea:focus {
  border-color: theme('colors.primary.light');
  box-shadow: 0 0 0 2px rgba(254, 206, 9, 0.25);
}

input:not([type='radio']):not([type='checkbox']).has-adjacent-icon,
textarea.has-adjacent-icon {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: 0;
}

input.xlarge {
  height: 60px;
}

input.large {
  height: 50px;
}

input.medium {
  height: 40px;
  width: 225px;
}

input.small {
  height: 32px;
  width: 150px;
}

textarea.large {
  height: 150px;
}

.icon-container {
  width: 40px;
  height: 40px;
  @apply border border-crisiscleanup-dark-100;
  border-left: 0;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.icon-container.large {
  width: 50px;
  height: 50px;
}

.icon-container.small {
  height: 30px;
}

.icon-container.has-tooltip {
  background-color: #f7f7f7;
}
</style>
