<template>
  <div
    v-if="worksite"
    data-testid="testWorksiteFormContentDiv"
    class="form h-full"
    :class="{ 'form--noheader': !hasFormHeaderContent }"
  >
    <div v-if="hasFormHeaderContent" class="form-header">
      <div class="flex p-1">
        <flag
          v-for="flag in worksite.flags"
          :key="flag.reason_t"
          :data-testid="`test${flag.reason_t}Flag`"
          :flag-reason="flag.reason_t"
          removable
          @on-remove="removeFlag(flag)"
        />
      </div>
    </div>
    <div class="form-content">
      <SectionHeading :count="1" class="mb-3">{{
        $t('caseForm.property_information')
      }}</SectionHeading>
      <section class="px-3 pb-3">
        <div class="flex flex-row">
          <div class="flex-1">
            <label
              class="my-1 text-xs font-bold text-crisiscleanup-grey-700 block"
              >{{ $t('formLabels.name') }}</label
            >
            <div data-testid="testNameContent">{{ worksite.name }}</div>
          </div>
          <div class="flex-1">
            <div class="flex flex-row items-center justify-center gap-2">
              <div class="flex-1">
                <label
                  class="my-1 text-xs font-bold text-crisiscleanup-grey-700 block"
                  >{{ $t('formLabels.phone1') }}</label
                >
                <PhoneNumberDisplay
                  :phone-number="worksite.phone1"
                  data-testid="testPhoneDiv"
                />
              </div>
            </div>
          </div>
        </div>
        <div>
          <label
            class="my-1 text-xs font-bold text-crisiscleanup-grey-700 block"
            >{{ $t('formLabels.address') }}</label
          >
          <AddressDisplay
            :address="worksiteAddress"
            :latitude="worksiteLatLng.latitude"
            :longitude="worksiteLatLng.longitude"
          />
        </div>
        <WorksiteNotes
          :worksite="worksite"
          data-testid="testWorksiteNotesContent"
          :expanded="false"
          @save-note="saveNote"
        />
        <div v-if="incident">
          <template v-for="field in incident.form_fields">
            <div
              v-if="
                field.html_type === 'textarea' &&
                worksite.form_data.find((element) => {
                  return element.field_key === field.field_key;
                })?.field_value
              "
              :key="field.field_key"
              class="mb-2"
            >
              <div class="my-1 text-base font-semibold block">
                {{ $t(field.label_t) }}
              </div>
              <div
                class="font-hairline cursor-pointer bg-opacity-50 rounded bg-crisiscleanup-light-grey"
              >
                {{
                  worksite.form_data.find((element) => {
                    return element.field_key === field.field_key;
                  })?.field_value
                }}
              </div>
            </div>
          </template>
        </div>
      </section>
      <SectionHeading :count="3" class="mb-3"
        >{{ $t('caseForm.work') }}
        <template #action>
          <base-button
            v-if="workTypesUnclaimed.length > 0"
            data-testid="testClaimAllButton"
            class="ml-2 p-1 px-3 text-xs"
            variant="solid"
            :text="$t('actions.claim_all_alt')"
            :alt="$t('actions.claim_all_alt')"
            :action="
              () => {
                return claimWorkType(
                  workTypesUnclaimed.map((workType) => workType.work_type),
                );
              }
            "
          />
          <template v-if="workTypesClaimedByOthersUnrequested.length > 0">
            <base-button
              v-if="incident.turn_on_release && workTypesReleaseable.length > 0"
              data-testid="testReleaseAllButton"
              class="ml-2 p-1 px-3 text-xs"
              variant="solid"
              :text="$t('actions.release_all')"
              :alt="$t('actions.release_all')"
              :action="
                () => {
                  return releaseWorkType(
                    workTypesReleaseable.map((workType) => workType.work_type),
                  );
                }
              "
            />
            <base-button
              v-else
              class="ml-2 p-1 px-3 border-black border-2 border-black text-xs"
              data-testid="testRequestAllButton"
              :text="$t('actions.request_all')"
              :alt="$t('actions.request_all')"
              :action="
                () => {
                  requestingWorkTypes = true;
                  initialWorkTypeRequestSelection = [];
                }
              "
            />
          </template>
        </template>
      </SectionHeading>
      <section class="px-3 pb-3">
        <div
          v-if="Object.keys(workTypesClaimedByOthers).length > 0"
          data-testid="testWorkTypesClaimedByOthersDiv"
        >
          <label
            class="my-1 text-xs font-bold text-crisiscleanup-grey-700 block"
            >{{ $t('caseView.claimed_by') }}</label
          >
          <div
            v-for="organization in Object.keys(workTypesClaimedByOthers)"
            :key="`${organization.id}`"
            class="my-1"
          >
            {{ getOrganizationName(organization) }}
          </div>
        </div>
        <div>
          <div v-if="Object.keys(workTypesClaimedByOthers).length > 0">
            <div
              v-for="(work_types, organization) in workTypesClaimedByOthers"
              :key="organization.id"
            >
              <label class="text-xs font-bold text-crisiscleanup-grey-700"
                >{{ $t('caseView.claimed_by') }}
                {{ getOrganizationName(organization) }}</label
              >
              <template v-for="work_type in work_types" :key="work_type.id">
                <div class="work_type_section">
                  <span class="text-sm">{{
                    getWorkTypeName(work_type.work_type)
                  }}</span>
                  <WorksiteStatusDropdown
                    class="block"
                    :phase="incident.phase"
                    :current-work-type="work_type"
                    @input="
                      (value) => {
                        statusValueChange(value, work_type);
                      }
                    "
                  />

                  <base-button
                    v-if="incident.turn_on_release && isStaleCase(work_type)"
                    :data-testid="`testRelease${work_type.work_type}Button`"
                    class="ml-2 p-1 px-3 text-xs"
                    variant="solid"
                    :text="$t('actions.release')"
                    :alt="$t('actions.release')"
                    :action="
                      () => {
                        return releaseWorkType([work_type.work_type]);
                      }
                    "
                  />

                  <template v-else>
                    <base-button
                      v-if="!worksiteRequestWorkTypeIds.has(work_type.id)"
                      :data-testid="`testRequest${work_type.work_type}Button`"
                      type="link"
                      :action="
                        () => {
                          requestingWorkTypes = true;
                          initialWorkTypeRequestSelection = [
                            work_type.work_type,
                          ];
                        }
                      "
                      :text="$t('actions.request')"
                      :alt="$t('actions.request')"
                      class="ml-2 p-1 px-3 text-xs"
                    />
                    <div
                      v-else
                      class="ml-2 p-1 px-3 text-xs"
                      data-testid="testRequestedDiv"
                    >
                      {{ $t('caseView.requested') }}
                    </div>
                  </template>
                  <div class="work-list">
                    {{
                      getFieldsForType(work_type.work_type)
                        .map((_) => $t(_.label_t))
                        .join(', ')
                    }}
                  </div>
                  <div
                    v-if="work_type.recur"
                    data-testid="testNextRecurrenceDiv"
                    class="recurrence"
                  >
                    {{ getRecurrenceString(work_type.recur) }}
                    <br />
                    {{ $t('caseView.next') }}
                    {{ formatRecurrence(work_type.next_recur_at) }}
                  </div>
                </div>
              </template>
              <WorkTypeRequestModal
                v-if="requestingWorkTypes"
                :work-types="workTypesClaimedByOthersUnrequested"
                :initial-selection="initialWorkTypeRequestSelection"
                :my-organization="currentUser.organization"
                @on-request="requestWorkTypes"
                @on-cancel="requestingWorkTypes = false"
              />
            </div>
          </div>
          <div v-if="workTypesClaimedByOrganization.length > 0">
            <label class="text-xs font-bold text-crisiscleanup-grey-700">{{
              $t('caseView.claimed_by_my_org')
            }}</label>
            <template
              v-for="work_type in workTypesClaimedByOrganization"
              :key="work_type.id"
            >
              <div class="work_type_section">
                <span class="text-sm">{{
                  getWorkTypeName(work_type.work_type)
                }}</span>
                <WorksiteStatusDropdown
                  class="block"
                  :data-testid="`testWorksiteStatusDropdown${work_type.work_type}Select`"
                  :phase="incident.phase"
                  :current-work-type="work_type"
                  @input="
                    (value) => {
                      statusValueChange(value, work_type);
                    }
                  "
                />
                <base-button
                  variant="solid"
                  :data-testid="`testUnclaim${work_type.work_type}Button`"
                  :action="
                    () => {
                      return unclaimWorkType([work_type.work_type]);
                    }
                  "
                  :text="$t('actions.unclaim')"
                  :alt="$t('actions.unclaim')"
                  class="ml-2 p-1 px-3 text-xs"
                />
                <div class="work-list">
                  {{
                    getFieldsForType(work_type.work_type)
                      .map((_) => $t(_.label_t))
                      .join(', ')
                  }}
                </div>
                <div v-if="work_type.recur" class="recurrence">
                  {{ getRecurrenceString(work_type.recur) }}
                  <br />
                  {{ $t('caseView.next') }}
                  {{ formatRecurrence(work_type.next_recur_at) }}
                </div>
              </div>
            </template>
          </div>
          <div v-if="workTypesUnclaimed.length > 0" class="mt-3">
            <label class="text-xs font-bold text-crisiscleanup-grey-700">{{
              $t('caseView.unclaimed_work_types')
            }}</label>
            <template
              v-for="work_type in workTypesUnclaimed"
              :key="work_type.id"
            >
              <div class="work_type_section">
                <span class="text-sm">{{
                  getWorkTypeName(work_type.work_type)
                }}</span>
                <WorksiteStatusDropdown
                  class="block"
                  :data-testid="`testWorksiteStatusDropdown${work_type.work_type}Div`"
                  :phase="incident.phase"
                  :current-work-type="work_type"
                  @input="
                    (value) => {
                      statusValueChange(value, work_type);
                    }
                  "
                />
                <base-button
                  variant="solid"
                  :data-testid="`testClaim${work_type.work_type}Button`"
                  :action="
                    () => {
                      return claimWorkType([work_type.work_type]);
                    }
                  "
                  :text="$t('actions.claim')"
                  :alt="$t('actions.claim')"
                  class="ml-2 p-1 px-3 text-xs"
                />
                <div class="work-list">
                  {{
                    getFieldsForType(work_type.work_type)
                      .map((_) => $t(_.label_t))
                      .join(', ')
                  }}
                </div>
                <div v-if="work_type.recur" class="recurrence">
                  {{ getRecurrenceString(work_type.recur) }}
                  <br />
                  {{ $t('caseView.next') }}
                  {{ formatRecurrence(work_type.next_recur_at) }}
                </div>
              </div>
            </template>
          </div>
        </div>
      </section>
      <SectionHeading :count="5" class="mb-3">{{
        $t('caseView.report')
      }}</SectionHeading>
      <WorksiteReportSection :key="worksite.total_time" :worksite="worksite" />
      <SectionHeading :count="6" class="mb-3">{{
        $t('caseForm.photos')
      }}</SectionHeading>
      <WorksiteImageSection
        :key="worksite.files"
        ref="worksiteImageSection"
        :worksite="worksite"
        class="px-3 pb-3"
      />
      <SectionHeading :count="7" class="mb-3">{{
        $t('caseView.attachments')
      }}</SectionHeading>
      <div class="px-3 pb-3">
        <SupportingDocumentSection
          :worksite="worksite"
          :is-print-token="isPrintToken"
          :is-survivor-token="isSurvivorToken"
          :disable-document-upload="disableDocumentUpload"
          @update-files="handleFileUpdate"
          @documents-changed="handleDocumentsChanged"
        />
      </div>
    </div>

    <div class="form-footer flex justify-between p-3 gap-2">
      <base-button
        v-if="workTypesClaimedByOrganization.length > 0"
        :data-testid="`testUnclaimButton`"
        size="medium"
        class="m-1 text-black p-3 px-4 border-2 border-black flex-grow"
        :text="$t('actions.unclaim')"
        :alt="$t('actions.unclaim')"
        :action="
          () => {
            return unclaimWorkType();
          }
        "
      />
      <base-button
        v-if="workTypesUnclaimed.length > 0"
        :data-testid="`testClaimButton`"
        size="medium"
        variant="solid"
        class="m-1 text-black p-3 px-4 flex-grow"
        :text="$t('actions.claim')"
        :alt="$t('actions.claim')"
        :action="
          () => {
            return claimWorkType(
              workTypesUnclaimed.map((workType) => workType.work_type),
            );
          }
        "
      />
      <base-button
        v-if="workTypesClaimedByOthersUnrequested.length > 0"
        :data-testid="`testRequestButton`"
        size="medium"
        class="m-1 text-black p-3 px-4 border-2 border-black flex-grow"
        :text="$t('actions.request')"
        :alt="$t('actions.request')"
        :action="
          () => {
            requestingWorkTypes = true;
            initialWorkTypeRequestSelection = [];
          }
        "
      />
      <base-button
        size="medium"
        data-testid="testCloseWorksiteButton"
        variant="solid"
        class="m-1 text-black p-3 px-4 flex-grow"
        :text="$t('actions.done')"
        :alt="$t('actions.done')"
        :action="
          () => {
            $emit('closeWorksite');
          }
        "
      />
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-full w-full grid">
    <spinner />
  </div>
</template>

<script lang="ts">
import { computed, onMounted, ref } from 'vue';
import moment from 'moment';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import Worksite from '../../models/Worksite';
import { getErrorMessage } from '../../utils/errors';
import Incident from '../../models/Incident';
import WorksiteRequest from '../../models/WorksiteRequest';
import { getQueryString } from '../../utils/urls';
import Organization from '../../models/Organization';
import { groupBy } from '../../utils/array';
import WorksiteStatusDropdown from '../WorksiteStatusDropdown.vue';
import User from '../../models/User';
import useDialogs from '../../hooks/useDialogs';
import {
  formatRecurrence,
  getRecurrenceString,
  getWorkTypeName,
} from '../../filters/index';
import useCurrentUser from '../../hooks/useCurrentUser';
import WorkTypeRequestModal from './WorkTypeRequestModal.vue';
import Flag from './Flag.vue';
import WorksiteNotes from './WorksiteNotes.vue';
import SectionHeading from './SectionHeading.vue';
import WorksiteReportSection from './WorksiteReportSection.vue';
import WorksiteImageSection from './WorksiteImageSection.vue';
import SupportingDocumentSection from './SupportingDocumentSection.vue';
import useAcl from '@/hooks/useAcl';
import AddressDisplay from '@/components/AddressDisplay.vue';
import { formatWorksiteAddress } from '@/utils/helpers';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay.vue';

export default defineComponent({
  name: 'WorksiteView',
  components: {
    PhoneNumberDisplay,
    AddressDisplay,
    WorksiteNotes,
    WorksiteReportSection,
    WorksiteImageSection,
    SupportingDocumentSection,
    Flag,
    SectionHeading,
    WorkTypeRequestModal,
    WorksiteStatusDropdown,
  },
  props: {
    worksiteId: {
      type: String,
      default: null,
    },
    incidentId: {
      type: String,
      default: null,
    },
    topHeight: {
      type: Number,
      default: 300,
    },
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const { $can } = useAcl();
    const $toasted = useToast();
    const { prompt } = useDialogs();
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    const addingNotes = ref(false);
    const currentNote = ref('');
    const addingTime = ref(false);
    const expandedNotes = ref({});
    const showingAllNotes = ref(false);
    const requestingWorkTypes = ref(false);
    const initialWorkTypeRequestSelection = ref([]);
    const uploading = ref(false);
    const showingClaimModal = ref(false);
    const workTypesToClaim = ref(new Set());

    function isStaleCase(workType) {
      return moment(workType.created_at).isBefore(moment().add(-30, 'days'));
    }

    const incident = computed(() => {
      return Incident.find(props.incidentId);
    });

    const worksite = computed(() => {
      return Worksite.find(props.worksiteId);
    });

    const { currentUser } = useCurrentUser();

    const cssVars = computed(() => {
      let { topHeight } = props;
      if (worksite.value.flags.length > 0) {
        topHeight += 25;
      }

      const formHeight = `${topHeight}px`;
      return {
        'grid-template-rows': `auto calc(100vh - ${formHeight} - var(--safe-area-inset-bottom)) 80px`,
      };
    });

    const workTypesClaimedByOrganization = computed(() => {
      if (worksite.value) {
        return worksite.value.work_types.filter(
          (type) =>
            currentUser.value.organization.all_affiliates_and_groups.includes(
              type.claimed_by,
            ) || type.claimed_by === currentUser.value.organization.id,
        );
      }

      return [];
    });

    const workTypesClaimedByOthers = computed(() => {
      if (worksite.value) {
        const list = worksite.value.work_types.filter(
          (type) =>
            type.claimed_by &&
            !currentUser.value.organization.all_affiliates_and_groups.includes(
              type.claimed_by,
            ) &&
            type.claimed_by !== currentUser.value.organization.id,
        );
        return groupBy(list, 'claimed_by');
      }

      return [];
    });

    const worksiteRequests = computed(() => {
      return WorksiteRequest.query()
        .where('worksite', Number.parseInt(props.worksiteId))
        .get();
    });

    const worksiteRequestWorkTypeIds = computed(() => {
      return new Set(
        worksiteRequests.value.map((request) => request.worksite_work_type.id),
      );
    });

    const workTypesClaimedByOthersUnrequested = computed(() => {
      return worksite.value.work_types.filter(
        (type) =>
          type.claimed_by &&
          type.claimed_by !== currentUser.value.organization.id &&
          !worksiteRequestWorkTypeIds.value.has(type.id),
      );
    });

    const workTypesReleaseable = computed(() => {
      return workTypesClaimedByOthersUnrequested.value.filter((type) =>
        isStaleCase(type),
      );
    });

    const workTypesUnclaimed = computed(() => {
      if (worksite.value) {
        return worksite.value.work_types.filter(
          (type) => type.claimed_by === null,
        );
      }

      return [];
    });

    const worksiteAddress = computed(() =>
      formatWorksiteAddress(worksite.value),
    );
    const worksiteLatLng = computed(() => {
      // NOTE: We store coordinates in [lng, lon] format
      const latitude = worksite.value?.location?.coordinates?.[1];
      const longitude = worksite.value?.location?.coordinates?.[0];
      return {
        latitude,
        longitude,
      };
    });

    const hasFormHeaderContent = computed(() => {
      const wsFlags = worksite.value?.flags ?? [];
      return wsFlags.length > 0;
    });

    function updateWorkTypesToClaim(value, workTypeToClaim) {
      if (value) {
        workTypesToClaim.value.add(workTypeToClaim.work_type);
      } else {
        workTypesToClaim.value.delete(workTypeToClaim.work_type);
      }

      workTypesToClaim.value = new Set(workTypesToClaim.value);
    }

    async function getWorksiteRequests() {
      const worksiteRequestParams = {
        worksite_work_type__worksite: props.worksiteId,
      };

      await WorksiteRequest.api().get(
        `/worksite_requests?${getQueryString(worksiteRequestParams)}`,
        {
          dataKey: 'results',
        },
      );
    }

    async function claimWorkType(workTypes = []) {
      try {
        await Worksite.api().claimWorksite(props.worksiteId, workTypes);
        await Worksite.api().fetch(props.worksiteId);
        emit('reloadMap', props.worksiteId);
        emit('reloadTable');
        emit('reloadCase', worksite.value);
        showingClaimModal.value = false;
        workTypesToClaim.value = new Set();
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      }
    }

    async function releaseWorkType(workTypes = []) {
      try {
        const result = await prompt({
          title: t('actions.release_cases'),
          content: t('caseView.please_justify_release'),
        });
        if (!result) {
          return;
        }

        await Worksite.api().releaseWorkType(
          props.worksiteId,
          workTypes,
          result,
        );
        await Worksite.api().fetch(props.worksiteId);
        emit('reloadMap', props.worksiteId);
        emit('reloadTable');
        emit('reloadCase', worksite.value);
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      }
    }

    async function unclaimWorkType(workTypes = []) {
      try {
        await Worksite.api().unclaimWorksite(props.worksiteId, workTypes);
        await Worksite.api().fetch(props.worksiteId);
        emit('reloadMap', props.worksiteId);
        emit('reloadTable');
        emit('reloadCase', worksite.value);
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      }
    }

    async function requestWorkTypes({ workTypes, reason }) {
      try {
        requestingWorkTypes.value = false;
        const result = await Worksite.api().requestWorksite(
          props.worksiteId,
          workTypes,
          reason,
        );
        await Worksite.api().fetch(props.worksiteId);
        await getWorksiteRequests();
        emit('reloadMap', props.worksiteId);
        emit('reloadTable');
        emit('reloadCase', worksite.value);
        $toasted.success(t('Successfully requested work types'));
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      }
    }

    async function saveNote(n) {
      try {
        await Worksite.api().addNote(props.worksiteId, n);
        await Worksite.api().fetch(props.worksiteId);
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      }
    }

    function cancelNote() {
      addingNotes.value = false;
      currentNote.value = '';
    }

    function getOrganizationName(id) {
      const organization = Organization.find(id);
      if (organization) {
        return organization.name;
      }

      return '';
    }

    async function statusValueChange(value, workType) {
      try {
        await Worksite.api().updateWorkTypeStatus(workType.id, value);
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      } finally {
        await Worksite.api().fetch(props.worksiteId);
        emit('reloadMap', props.worksiteId);
        emit('reloadTable');
        emit('reloadCase', worksite.value);
      }
    }

    function getFieldsForType(workType) {
      if (incident.value) {
        const availableFields = new Set(
          worksite.value.form_data.map((data) => data.field_key),
        );
        return incident.value.form_fields.filter((field) => {
          const parent = incident.value.form_fields.find((element) => {
            return element.field_key === field.field_parent_key;
          });

          let { if_selected_then_work_type } = field;
          if (parent) {
            if_selected_then_work_type = parent.if_selected_then_work_type;
          }

          return (
            if_selected_then_work_type === workType &&
            availableFields.has(field.field_key) &&
            field.html_type === 'checkbox'
          );
        });
      }

      return [];
    }

    async function removeFlag(flag) {
      if (worksite.value) {
        try {
          await Worksite.api().deleteFlag(worksite.value.id, flag);
          await Worksite.api().fetch(worksite.value.id);
        } catch (error) {
          console.error(error);
          await $toasted.error(getErrorMessage(error));
        }
      } else {
        console.error('Worksite not found. Cannot remove flag');
      }
    }

    onMounted(async () => {
      try {
        await Worksite.api().fetch(props.worksiteId, props.incidentId);
        emit('caseLoaded');
        await getWorksiteRequests();
        if (Number(worksite.value.incident) !== Number(props.incidentId)) {
          if (props.incidentId) {
            emit('onResetForm');
          } else {
            await router.push(`/incident/${route.params.incident_id}/work`);
          }
        }
      } catch (error) {
        if (error.response?.status === 404) {
          await $toasted.error(t('caseView.deleted_notice'));
        }

        if (props.incidentId) {
          emit('onResetForm');
        } else {
          await router.push(`/incident/${route.params.incident_id}/work`);
        }
      }

      if (route.query.showOnMap) {
        emit('jumpToCase', props.worksiteId);
      }
    });

    return {
      addingNotes,
      addingTime,
      expandedNotes,
      showingAllNotes,
      requestingWorkTypes,
      initialWorkTypeRequestSelection,
      currentNote,
      uploading,
      showingClaimModal,
      workTypesToClaim,
      cssVars,
      worksite,
      incident,
      workTypesClaimedByOrganization,
      workTypesClaimedByOthers,
      workTypesClaimedByOthersUnrequested,
      workTypesReleaseable,
      workTypesUnclaimed,
      worksiteAddress,
      worksiteLatLng,
      currentUser,
      worksiteRequests,
      worksiteRequestWorkTypeIds,
      hasFormHeaderContent,
      updateWorkTypesToClaim,
      isStaleCase,
      getWorksiteRequests,
      claimWorkType,
      releaseWorkType,
      unclaimWorkType,
      requestWorkTypes,
      saveNote,
      cancelNote,
      getOrganizationName,
      statusValueChange,
      getFieldsForType,
      removeFlag,
      getRecurrenceString,
      getWorkTypeName,
      formatRecurrence,
      can: $can,
    };
  },
});
</script>

<style scoped lang="postcss">
.form {
  display: grid;
  grid-template-rows: auto 1fr 80px;
  @supports (-webkit-touch-callout: none) {
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }

  &--noheader {
    grid-template-rows: auto 80px;
  }
}

.form-content {
  overflow-y: auto;
}

.work_type_section {
  @apply border-b py-4;
  display: grid;
  grid-template-columns: 1fr 2fr 0.5fr;
  justify-items: start;
  align-items: center;
}

.work-list {
  @apply mt-1 text-crisiscleanup-grey-900;
  grid-column-start: 1;
  grid-column-end: 4;
}

.recurrence {
  @apply mt-1 text-crisiscleanup-grey-900 flex flex-col;
  grid-column-start: 1;
  grid-column-end: 4;
}

button.worksite__dialer {
  @apply rounded-full;
}

button.worksite__dialer :deep(img.ccu-icon) {
  transition: filter 300ms ease;
}

button.worksite__dialer:hover :deep(img.ccu-icon) {
  filter: brightness(0) invert(1);
}
</style>
