<template>
  <div v-if="!loading">
    <modal
      v-if="showRequestAccessModal"
      data-testid="testShowRequestAccessModalModal"
      :title="$t('reportsVue.reports_activation')"
      modal-classes="w-108"
      @close="showRequestAccessModal = false"
    >
      <div class="flex justify-around m-5">
        <base-text variant="body">
          <span v-html="$t('reportsVue.no_state_account_yet')"></span>
        </base-text>
      </div>
      <template #footer>
        <div class="flex p-1 justify-center">
          <base-button
            variant="outline"
            :action="() => (showRequestAccessModal = false)"
          ></base-button>
        </div>
      </template>
    </modal>
    <!-- Report Library -->
    <h1 data-testid="testReportHeader" class="text-xl font-bold m-2 ml-3 pt-5">
      Report Library
    </h1>
    <div v-for="sponsored in reportsKeys" :key="sponsored">
      <div v-if="sponsored === 'true'" class="text-lg font-bold m-2 ml-3 pt-1">
        {{ $t('reportsVue.sponsored_reports') }}
      </div>
      <div v-else class="text-lg font-bold m-2 ml-3 pt-1">
        {{ $t('reportsVue.other_reports') }}
      </div>
      <div
        data-testid="testReportsContainerDiv"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
      >
        <div v-for="r in reportsGrouped[sponsored]" :key="`${r.id}`">
          <div
            class="my-4 mx-2 bg-white sm:h-5/6 shadow content-center flex-wrap cursor-pointer"
            @click="() => requestReport(r, null, sponsored === 'true')"
          >
            <div class="flex flex-col justify-around">
              <div class="m-5">
                <div class="flex flex-row items-center justify-between">
                  <base-text variant="body" weight="700"
                    >{{ $t(r.name_t) }}
                  </base-text>
                  <badge
                    v-if="
                      newReportIds.length > 0 &&
                      newReportIds.has(r.id) &&
                      sponsored === 'true'
                    "
                    width="2.5rem"
                    height="1rem"
                    class="text-white bg-crisiscleanup-red-700 mx-1 p-4"
                    :title="$t('reportsVue.new_badge')"
                    >{{ $t('reportsVue.new') }}</badge
                  >
                  <img
                    v-else-if="sponsored !== 'true'"
                    src="@/assets/greylockss.jpg"
                    class="h-8 px-3"
                  />
                </div>
                <base-text variant="bodysm">
                  {{ $t(r.description_t) }}
                </base-text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="flex h-full items-center justify-center">
    <spinner />
  </div>
</template>

<script lang="ts">
import { mapState, useStore } from 'vuex';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import moment from 'moment';
import EventLog from '@/models/EventLog';
import Report from '@/models/Report';
import User from '@/models/User';
import { groupBy } from '@/utils/array';
import useCurrentUser from '@/hooks/useCurrentUser';
import { getErrorMessage } from '@/utils/errors';
import { useCurrentIncident } from '@/hooks';

export default defineComponent({
  name: 'Reports',
  setup() {
    const { t } = useI18n();
    const store = useStore();
    const { currentUser } = useCurrentUser();
    const route = useRoute();
    const router = useRouter();
    const { updateUserStates } = useCurrentUser();

    const { currentIncidentId } = useCurrentIncident();

    const loading = ref(false);
    const newReportIds = ref(new Set());
    const showRequestAccessModal = ref(false);
    const reports = computed(() => Report.all());
    const reportsGrouped = computed(() =>
      groupBy(reports.value, 'isSponsored'),
    );
    const reportsKeys = computed(() =>
      Object.keys(reportsGrouped.value).reverse(),
    );

    function requestReport(
      report: Report | null = null,
      downloadType = null,
      sponsored = false,
    ) {
      if (sponsored === true) {
        return router.push(
          `/incident/${currentIncidentId.value}/report/${report?.id}`,
        );
      }

      if (!downloadType) {
        showRequestAccessModal.value = true;
      }

      EventLog.api().create(
        'request_report',
        currentIncidentId.value,
        route.query.page,
        {
          report_type: report?.name_t,
          download_type: downloadType,
        },
      );
      return false;
    }

    onMounted(() => {
      const newReports = Report.query()
        .where('created_at', (created_at: string) => {
          const reportsAccessed =
            currentUser?.value?.states &&
            currentUser?.value?.states.reports_last_accessed;
          return reportsAccessed
            ? moment(created_at).isAfter(moment(reportsAccessed))
            : true;
        })
        .get();
      newReportIds.value = new Set(newReports.map((r) => r.id));
      updateUserStates({
        reports_last_accessed: moment().toISOString(),
      }).catch(getErrorMessage);
    });

    return {
      loading,
      newReportIds,
      showRequestAccessModal,
      reports,
      reportsGrouped,
      reportsKeys,
      currentUser,
      requestReport,
    };
  },
});
</script>
