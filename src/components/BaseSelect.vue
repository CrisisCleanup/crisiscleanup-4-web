<template>
  <div>
    <Multiselect
      ref="input"
      :model-value="modelValue"
      :required="required"
      :options="options"
      :can-clear="clearable"
      :searchable="searchable"
      :label="label"
      :value-prop="itemKey"
      :limit="limit"
      :mode="multiple ? 'tags' : 'single'"
      :disabled="disabled"
      class="form-select text-base"
      :resolve-on-load="false"
      :open-direction="openDirection"
      :clear-on-blur="false"
      :delay="isAsync ? 0 : undefined"
      :filter-results="isAsync ? false : undefined"
      :class="[
        isInvalid && !modelValue ? 'invalid' : '',
        floatLabel ? 'py-2 pt-3' : '',
      ]"
      :placeholder="placeholder"
      :no-options-text="placeholder"
      :classes="multiSelectClasses"
      v-bind="$attrs"
      @update:model-value="
        (v) => {
          onInput(v);
        }
      "
      @open="handleOpen"
    >
      <template #singlelabel="{ value }">
        <slot name="selected-option" :option="value">
          <template v-if="label === 'name_t'">
            <span :class="multiSelectClasses.singleLabel">{{
              $t(value[label])
            }}</span>
          </template>
        </slot>
      </template>

      <template #tag="{ option, handleTagRemove, disabled: dis }">
        <slot name="tag" :option="option">
          <template v-if="label === 'name_t'">
            <span :class="multiSelectClasses.tag" tabindex="-1"
              ><span class="multiselect-tag-wrapper">{{
                $t(option[label])
              }}</span
              ><span
                v-if="!dis"
                class="multiselect-tag-remove"
                @click="handleTagRemove(option, $event)"
                ><span class="multiselect-tag-remove-icon"></span></span
            ></span>
          </template>
        </slot>
      </template>

      <template #option="{ option }">
        <slot name="option" :option="option">
          <template v-if="label === 'name_t'">
            <span>{{ $t(option[label]) }}</span>
          </template>
        </slot>
      </template>

      <template #beforelist>
        <slot name="list-header" />
      </template>
    </Multiselect>
    <label
      v-if="floatLabel"
      ref="inputLabel"
      :style="isFloated && floatStyle"
      for="select-id"
    >
      <slot name="float-label" v-bind="{ isFloated }">
        {{ floatLabel }}
      </slot>
    </label>
  </div>
</template>

<script lang="ts">
import Multiselect from '@vueform/multiselect';
import type { PropType } from 'vue';
import { computed, h, nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { isEmpty as empty, kebabCase, xor } from 'lodash';

export default defineComponent({
  name: 'BaseSelect',
  components: {
    Multiselect,
  },
  props: {
    searchable: {
      type: Boolean,
      default: false,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
    clearable: {
      type: Boolean,
      default: true,
    },
    selectClasses: {
      type: String,
      default: '',
    },
    containerClasses: {
      type: String,
      default:
        'border relative mx-auto w-full flex items-center justify-end cursor-pointer bg-white text-base leading-snug outline-none',
    },
    wrapperClasses: {
      type: String,
      default:
        'relative mx-auto w-full flex items-center justify-end box-border cursor-pointer outline-none min-h-[theme(spacing.12)]',
    },
    options: {
      type: [Array, Function],
      default() {
        return [];
      },
    },
    openDirection: {
      type: String as PropType<'top' | 'bottom'>,
      default: 'bottom',
    },
    limit: {
      type: Number,
      default: 0,
    },
    placeholder: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    size: {
      type: String,
      default: 'large',
    },
    modelValue: {
      type: null,
      default: null,
    },
    itemKey: {
      type: null,
      default: null,
    },
    indicatorIcon: {
      type: String,
      default: 'sort',
    },
    floatLabel: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const cancelText = t('actions.cancel');

    const iconSize = props.multiple ? 'xxs' : 'medium';
    const { indicatorIcon } = props;
    const input = ref(null);
    const inputLabel = ref(null);
    const isFloated_ = ref(false);
    const isEmpty_ = ref(false);
    const isInvalid = ref(false);
    const baseHeight_ = ref(0);
    const currentHeight_ = ref(0);
    const floatDisplacement = ref(0);
    const selected = ref(null);

    const inputIdSelector = computed(() => {
      const idSpec = props.floatLabel ?? '';
      return `select-id-${kebabCase(idSpec)}`;
    });

    const inputRef = computed(() => {
      return input.value || document.getElementById(inputIdSelector.value);
    });

    const isAsync = computed(() => {
      return typeof props.options === 'function';
    });

    const heightMultiplier = computed(() => {
      if (currentHeight_.value === 0) return 1;
      return currentHeight_.value / baseHeight_.value;
    });

    const floatStyle = computed(() => {
      const displace = heightMultiplier.value * -12;
      return { transform: `translateY(${displace}px)` };
    });

    const isEmpty = computed(() => {
      if (props.modelValue !== null) {
        return empty(props.modelValue);
      }

      return isEmpty_.value;
    });

    const isFloated = computed(() => {
      if (isFloated_.value === true) {
        return true;
      }

      if (isEmpty.value === false) {
        return true;
      }

      return isFloated_.value;
    });

    const multiSelectClasses = computed(() => {
      // only override the default classes if we have a custom class
      const searchClassesObj = props.selectClasses
        ? { search: props.selectClasses }
        : {};
      const containerClassesObj = props.containerClasses
        ? { container: props.containerClasses }
        : {};
      const wrapperClassesObj = props.wrapperClasses
        ? { wrapper: props.wrapperClasses }
        : {};
      return {
        ...searchClassesObj,
        ...containerClassesObj,
        ...wrapperClassesObj,
        optionSelected: 'text-white bg-crisiscleanup-dark-200',
        optionPointed: 'text-gray-800 bg-crisiscleanup-dark-100',
        optionSelectedPointed:
          'text-white bg-crisiscleanup-dark-200 opacity-90',
        singleLabel:
          'flex items-center h-full max-w-full absolute left-0 top-0 pointer-events-none bg-transparent leading-snug pl-3.5 pr-16 box-border rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3.5',
        tag: 'text-xs bg-white py-0.5 pl-2 rounded mr-1 mb-1 flex items-center whitespace-nowrap rtl:pl-0 rtl:pr-2 rtl:mr-0 rtl:ml-1 border border-crisiscleanup-dark-100',
      };
    });

    function onInput(value) {
      isEmpty_.value = value === null;
      if (value === null && props.floatLabel) {
        isFloated_.value = false;
        inputLabel.value.classList.remove('focused');
      }

      if (props.multiple) {
        const current = props.modelValue || [];
        const currentValues = current
          .map((item) => (props.itemKey ? item[props.itemKey] : item))
          .filter(Boolean);
        emit('changed', xor(value, currentValues));
      }

      if (props.required) {
        isInvalid.value = isEmpty_.value;
      }
    }

    function onBlur() {
      if (props.floatLabel && isEmpty.value) {
        isFloated_.value = false;
        inputLabel.value.classList.remove('focused');
      }
    }

    function open() {
      if (props.floatLabel) {
        isFloated_.value = true;
        inputLabel.value.classList.add('focused');
      }

      nextTick(() => {
        const items = Array.prototype.slice.call(
          document.querySelectorAll('.vs__dropdown-option'),
        );

        for (const item of items) {
          item.classList.remove('vs__dropdown-option--highlight');
        }

        const selected = items.find((item) => {
          if (props.modelValue) {
            const currentLabel = props.label
              ? props.modelValue[props.label]
              : props.modelValue;
            return item.textContent.trim() === currentLabel;
          }

          return false;
        });

        if (selected) {
          selected.classList.add('vs__dropdown-option--highlight');
          document.querySelector('.vs__dropdown-menu').scrollTop =
            selected.offsetTop;
        }
      });
    }

    function handleResize() {
      currentHeight_.value = inputRef.value.parentElement.clientHeight;
      emit('resize', currentHeight_.value);
    }

    function handleOpen() {
      // This basically triggers a search once the box is selected
      if (isAsync.value && props.searchable && !inputRef.value.search) {
        inputRef.value.clearSearch();
      }
    }

    onMounted(() => {
      if (props.floatLabel) {
        inputRef.value.parentElement.classList.add('has-float');
        baseHeight_.value = inputRef.value.parentElement.clientHeight;
      }
    });

    return {
      selected,
      // options,
      isInvalid,
      floatDisplacement,
      cancelText,
      inputIdSelector,
      inputRef,
      heightMultiplier,
      floatStyle,
      isEmpty,
      isFloated,
      multiSelectClasses,
      onInput,
      onBlur,
      open,
      handleResize,
      input,
      inputLabel,
      isAsync,
      handleOpen,
    };
  },
});
</script>

<style src="@vueform/multiselect/themes/tailwind.css"></style>

<style>
.multiselect-dropdown {
  @apply z-header;
}

.multiselect-search {
  @apply h-full;
}

.multiselect-tags-search {
  @apply h-full;
}

.multiselect-placeholder {
  @apply text-crisiscleanup-dark-200;
}
</style>
