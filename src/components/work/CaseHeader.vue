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
      <div
        v-if="worksite && worksite.id"
        role="toolbar"
        :aria-label="$t('actions.case_actions', 'Case actions')"
        class="inline-flex flex-wrap items-center rounded border border-primary-dark/30 overflow-hidden divide-x divide-primary-dark/20 bg-primary-light"
      >
        <v-popover popper-class="add-list-popover">
          <button
            type="button"
            class="w-8 h-8 grid place-items-center bg-primary-light hover:bg-primary-dark/20 active:bg-primary-dark/30 transition text-black"
            data-testid="testAddToListIcon"
            :title="$t('actions.add_to_list')"
            :aria-label="$t('actions.add_to_list')"
          >
            <ccu-icon
              :alt="$t('actions.add_to_list')"
              size="small"
              linked
              type="sticky-note-solid"
            />
          </button>
          <template #popper>
            <AddToList
              class="p-1.5"
              model-type="worksite_worksites"
              :object-id="worksite.id"
              :incident="currentIncidentId"
            />
          </template>
        </v-popover>

        <button
          type="button"
          class="w-8 h-8 grid place-items-center bg-primary-light hover:bg-primary-dark/20 active:bg-primary-dark/30 transition text-black"
          data-testid="testFlagIcon"
          :title="$t('actions.flag')"
          :aria-label="$t('actions.flag')"
          @click="$emit('onFlagCase')"
        >
          <ccu-icon :alt="$t('actions.flag')" size="small" linked type="flag" />
        </button>
        <button
          type="button"
          class="w-8 h-8 grid place-items-center bg-primary-light hover:bg-primary-dark/20 active:bg-primary-dark/30 transition text-black"
          data-testid="testJumpToCaseIcon"
          :title="$t('actions.jump_to_case')"
          :aria-label="$t('actions.jump_to_case')"
          @click="$emit('onJumpToCase')"
        >
          <ccu-icon
            :alt="$t('actions.jump_to_case')"
            size="small"
            linked
            type="go-case"
          />
        </button>
        <button
          type="button"
          class="w-8 h-8 grid place-items-center bg-primary-light hover:bg-primary-dark/20 active:bg-primary-dark/30 transition text-black"
          data-testid="testHistoryIcon"
          :title="$t('actions.history')"
          :aria-label="$t('actions.history')"
          @click="$emit('onShowHistory')"
        >
          <ccu-icon
            :alt="$t('actions.history')"
            size="small"
            linked
            :fa="true"
            type="user-group"
          />
        </button>
        <button
          type="button"
          class="w-8 h-8 grid place-items-center bg-primary-light hover:bg-primary-dark/20 active:bg-primary-dark/30 transition text-black"
          data-testid="cases.icons.download"
          :title="$t('actions.download')"
          :aria-label="$t('actions.download')"
          @click="$emit('onDownloadWorksite')"
        >
          <ccu-icon
            :alt="$t('actions.download')"
            size="small"
            linked
            type="download"
          />
        </button>
        <button
          type="button"
          class="w-8 h-8 grid place-items-center bg-primary-light hover:bg-primary-dark/20 active:bg-primary-dark/30 transition text-black"
          data-testid="cases.icons.share"
          :title="$t('actions.share')"
          :aria-label="$t('actions.share')"
          @click="$emit('onShareWorksite')"
        >
          <ccu-icon
            :alt="$t('actions.share')"
            size="small"
            linked
            type="share"
          />
        </button>
        <button
          type="button"
          class="w-8 h-8 grid place-items-center bg-primary-light hover:bg-primary-dark/20 active:bg-primary-dark/30 transition text-black"
          :class="printIconDisabled ? 'opacity-60 pulse cursor-wait' : ''"
          data-testid="cases.icons.print"
          :title="$t('actions.print')"
          :aria-label="$t('actions.print')"
          :disabled="printIconDisabled"
          @click="handlePrintWorksite"
        >
          <ccu-icon
            :alt="$t('actions.print')"
            size="small"
            linked
            type="print"
          />
        </button>
        <button
          v-if="isViewingWorksite && canEdit"
          type="button"
          class="w-8 h-8 grid place-items-center bg-primary-light hover:bg-primary-dark/20 active:bg-primary-dark/30 transition text-black"
          data-testid="testEditIcon"
          :title="$t('actions.edit')"
          :aria-label="$t('actions.edit')"
          @click="$emit('onEditCase')"
        >
          <ccu-icon :alt="$t('actions.edit')" size="small" linked type="edit" />
        </button>
        <button
          v-if="!isViewingWorksite && canEdit"
          type="button"
          class="w-8 h-8 grid place-items-center bg-primary-light hover:bg-primary-dark/20 active:bg-primary-dark/30 transition text-black"
          data-testid="testExitEditIcon"
          :title="$t('actions.go_to_work')"
          :aria-label="$t('actions.go_to_work')"
          @click="$emit('onExitEditCase')"
        >
          <ccu-icon
            :alt="$t('actions.go_to_work')"
            size="small"
            linked
            icon-classes="filter-black scale-150"
            type="cases"
          />
        </button>
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
import AddToList from '@/pages/lists/AddToList.vue';

export default defineComponent({
  name: 'CaseHeader',
  components: { AddToList, BaseButton },
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

<style lang="postcss" scoped>
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

.add-list-popover {
  @apply p-3 outline-none z-max;
  width: 300px;
  left: 0.75rem !important;
  height: 500px;
  overflow: auto;
}
</style>
