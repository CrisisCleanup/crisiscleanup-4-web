<template>
  <div>
    <div
      v-if="showCaseTabs"
      data-testid="testCaseHeaderDiv"
      class="h-12 flex items-center justify-start px-2"
    >
      <div
        class="flex items-center cursor-pointer"
        data-testid="testNewCaseDiv"
        @click="() => $emit('closeWorksite')"
      >
        <ccu-icon :alt="$t('casesVue.new_case')" type="active" size="small" />
        <span class="px-1 mt-0.5" data-testid="testNewCaseContent">
          {{ $t('casesVue.new_case') }}
        </span>
      </div>
      <div
        v-if="worksite && worksite.id"
        data-testid="testCaseDiv"
        class="h-full p-3 flex items-center justify-center border-b-2 border-primary-light"
      >
        {{ $t('casesVue.case') }} {{ worksite && worksite.case_number }}
        <ccu-icon
          :alt="$t('actions.cancel')"
          data-testid="testCloseWorksiteIcon"
          size="xs"
          type="cancel"
          class="ml-2"
          @click="$emit('closeWorksite')"
        />
      </div>
    </div>
    <div class="flex items-start justify-between p-1">
      <div>
        <div class="text-left text-black flex items-center">
          <div class="mt-1 mr-1">
            {{ worksite && worksite.case_number }}
          </div>
          <base-button class="mr-1">
            <div
              v-if="worksite && worksite.isFavorite"
              data-testid="testIsMemberOfMyOrgIcon"
              class="svg-container cursor-pointer"
              :title="$t('actions.not_member_of_my_org')"
              :alt="$t('actions.not_member_of_my_org')"
              @click="() => toggleFavorite(false)"
              v-html="favoriteSvgActive"
            ></div>
            <div
              v-else
              class="svg-container cursor-pointer"
              data-testid="testIsNotMemberOfMyOrgIcon"
              :title="$t('actions.member_of_my_org')"
              :alt="$t('actions.member_of_my_org')"
              @click="() => toggleFavorite(true)"
              v-html="favoriteSvgInactive"
            ></div>
          </base-button>
          <base-button class="mr-1">
            <div
              v-if="worksite && worksite.isHighPriority"
              data-testid="testIsHighPriorityIcon"
              class="svg-container cursor-pointer"
              :title="$t('actions.unmark_high_priority')"
              :alt="$t('actions.unmark_high_priority')"
              @click="() => toggleHighPriority(false)"
              v-html="highPrioritySvgActive"
            ></div>
            <div
              v-else
              data-testid="testIsNotHighPriorityIcon"
              class="svg-container cursor-pointer"
              :title="$t('actions.mark_high_priority')"
              :alt="$t('actions.mark_high_priority')"
              @click="() => toggleHighPriority(true)"
              v-html="highPrioritySvgInactive"
            ></div>
          </base-button>
        </div>
        <div
          v-if="worksite && worksite.id"
          class="text-xs text-crisiscleanup-grey-700"
        >
          {{ $t('casesVue.updated') }}
          {{ momentFromNow(worksite.updated_at) }}
        </div>
      </div>
      <div v-if="worksite && worksite.id" class="flex items-center">
        <ccu-icon
          :alt="$t('actions.flag')"
          data-testid="testFlagIcon"
          size="small"
          class="border p-2 bg-primary-light hover-bg-primary-light click-bg-primary-light"
          type="flag"
          @click="$emit('onFlagCase')"
        />
        <ccu-icon
          :alt="$t('actions.jump_to_case')"
          data-testid="testJumpToCaseIcon"
          size="small"
          class="border p-2 bg-primary-light hover-bg-primary-light click-bg-primary-light"
          type="go-case"
          @click="$emit('onJumpToCase')"
        />
        <ccu-icon
          :alt="$t('actions.history')"
          data-testid="testHistoryIcon"
          size="small"
          class="border p-2 bg-primary-light hover-bg-primary-light click-bg-primary-light"
          :fa="true"
          type="user-group"
          @click="$emit('onShowHistory')"
        />
        <ccu-icon
          :alt="$t('actions.download')"
          size="small"
          class="border p-2 bg-primary-light hover-bg-primary-light click-bg-primary-light"
          type="download"
          data-testid="cases.icons.download"
          @click="$emit('onDownloadWorksite')"
        />
        <ccu-icon
          :alt="$t('actions.share')"
          size="small"
          class="border p-2 bg-primary-light hover-bg-primary-light click-bg-primary-light"
          type="share"
          data-testid="cases.icons.share"
          @click="$emit('onShareWorksite')"
        />
        <ccu-icon
          :alt="$t('actions.print')"
          size="small"
          class="border p-2 bg-primary-light hover-bg-primary-light click-bg-primary-light"
          type="print"
          data-testid="cases.icons.print"
          :class="printIconDisabled ? 'disabled pulse' : ''"
          @click="handlePrintWorksite"
        />
        <ccu-icon
          v-if="isViewingWorksite && canEdit"
          data-testid="testEditIcon"
          :alt="$t('actions.edit')"
          class="border p-2 bg-primary-light hover-bg-primary-light click-bg-primary-light"
          size="small"
          type="edit"
          @click="$emit('onEditCase')"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';
import { templates } from '../../icons/icons_templates';
import Worksite from '../../models/Worksite';
import { momentFromNow } from '../../filters';
import BaseButton from '@/components/BaseButton.vue';
import { SVG_STROKE_WIDTH } from '@/constants';

export default defineComponent({
  name: 'CaseHeader',
  components: { BaseButton },
  props: {
    worksite: {
      type: Object,
      default() {
        return {};
      },
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
    isViewingWorksite: { type: Boolean, default: null, required: false },
    showCaseTabs: { type: Boolean, default: false, required: false },
  },
  setup(props, { emit }) {
    const store = useStore();
    const currentIncidentId = computed(
      () => store.getters['incident/currentIncidentId'],
    );
    const highPrioritySvgInactive = computed(() => {
      const template = templates.important;
      return template
        .replaceAll('{{fillColor}}', 'grey')
        .replaceAll('{{strokeWidth}}', SVG_STROKE_WIDTH.toString())
        .replaceAll('{{strokeColor}}', 'white')
        .replaceAll('{{multiple}}', '');
    });
    const highPrioritySvgActive = computed(() => {
      const template = templates.important;
      return template
        .replaceAll('{{fillColor}}', 'red')
        .replaceAll('{{strokeWidth}}', SVG_STROKE_WIDTH.toString())
        .replaceAll('{{strokeColor}}', 'white')
        .replaceAll('{{multiple}}', '');
    });
    const favoriteSvgInactive = computed(() => {
      const template = templates.favorite;
      return template
        .replaceAll('{{fillColor}}', 'grey')
        .replaceAll('{{strokeWidth}}', SVG_STROKE_WIDTH.toString())
        .replaceAll('{{strokeColor}}', 'white')
        .replaceAll('{{multiple}}', '');
    });

    const favoriteSvgActive = computed(() => {
      const template = templates.favorite;
      return template
        .replaceAll('{{fillColor}}', 'red')
        .replaceAll('{{strokeWidth}}', SVG_STROKE_WIDTH.toString())
        .replaceAll('{{strokeColor}}', 'white')
        .replaceAll('{{multiple}}', '');
    });

    async function toggleFavorite(toggle) {
      await (toggle
        ? Worksite.api().favorite(props.worksite.id)
        : Worksite.api().unfavorite(
            props.worksite.id,
            props.worksite.favorite.id,
          ));

      await Worksite.api().fetch(props.worksite.id);
      emit('reloadMap');
    }

    async function toggleHighPriority(isHighPriority) {
      if (isHighPriority) {
        await Worksite.api().addFlag(props.worksite.id, {
          reason_t: 'flag.worksite_high_priority',
          is_high_priority: true,
          notes: '',
          requested_action: '',
        });
      } else {
        const highPriorityFlags = props.worksite.flags.filter(
          (flag) => flag.is_high_priority,
        );
        await Promise.all(
          highPriorityFlags.map((f) =>
            Worksite.api().deleteFlag(props.worksite.id, f),
          ),
        );
      }

      await Worksite.api().fetch(props.worksite.id);
      emit('reloadMap');
    }

    const printIconDisabled = ref(false);
    const handlePrintWorksite = () => {
      // Disable the icon
      printIconDisabled.value = true;

      // Add a setTimeout for 15 seconds (15000 milliseconds)
      setTimeout(() => {
        // Re-enable the icon after 15 seconds
        printIconDisabled.value = false;
      }, 15_000);

      emit('onPrintWorksite');
      // Emit the click event immediately
    };

    return {
      currentIncidentId,
      highPrioritySvgInactive,
      highPrioritySvgActive,
      favoriteSvgInactive,
      favoriteSvgActive,
      printIconDisabled,
      handlePrintWorksite,
      toggleFavorite,
      toggleHighPriority,
      momentFromNow,
    };
  },
});
</script>

<style>
.svg-container svg {
  width: 18px !important;
  height: 18px !important;
}

.hover-bg-primary-light:hover {
  background-color: #ffdd3a;
}

.click-bg-primary-light:active {
  background-color: #e0b805; /* New background color on click */
  /* Other styles for clicked state */
}

.disabled {
  cursor: not-allowed; /* Change the cursor to "not allowed" */
  opacity: 0.2; /* Reduce opacity to indicate the element is disabled */
  pointer-events: none; /* Prevent any interactions with the element */
}

.pulse {
  animation: pulse-animation 2s infinite;
}
@keyframes pulse-animation {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
}
</style>
