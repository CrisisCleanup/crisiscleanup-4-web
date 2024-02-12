<template>
  <div
    class="relative h-full w-full flex flex-col"
    data-testid="testGeneralIncidentInfoDiv"
  >
    <div v-if="savedIncident" class="text-2xl font-bold text-center my-2">
      {{ savedIncident.id }}: {{ savedIncident.name }}
    </div>

    <Wizard
      ref="steps"
      class="flex-grow"
      step-classes="text-xs"
      step-details-classes="p-2 pt-16"
      step-default-classes="flex items-center justify-center h-8 cursor-pointer px-2"
      step-active-classes=""
      :loading="loading"
      @done="onCompletedIncident"
    >
      <Step
        :name="$t('incidentBuilder.general_incident_info')"
        :on-save="saveIncident"
      >
        <div class="grid grid-cols-2 gap-2">
          <Card>
            <IncidentForm
              :key="savedIncident"
              :incident="savedIncident"
              :ani-incidents="savedAniIncidents"
              @on-incident-change="currentIncident = $event"
              @on-ani-change="currentAni = $event"
              @on-delete-ani-incident="deleteAniIncident"
            />
          </Card>
          <IncidentLocationEditor
            :key="currentIncidentLocation"
            :location="currentIncidentLocation"
            :current-incident="currentIncident"
            @on-location-change="currentLocation = $event"
          />
        </div>
      </Step>
      <Step
        :name="$t('incidentBuilder.create_intake_form')"
        :on-save="saveIncidentFields"
      >
        <IncidentFormBuilder
          :key="savedIncident"
          :incident="savedIncident"
          @on-update-form="formFieldTree = $event"
        />
      </Step>
      <Step :name="$t('incidentBuilder.assets')">
        <IncidentAssetBuilder
          :incident="savedIncident"
          :anis="savedAniIncidents"
          :selectable-work-types="selectableWorkTypes"
        />
      </Step>
    </Wizard>
  </div>
</template>

<script lang="ts">
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';
import moment from 'moment';
import { useRoute } from 'vue-router';
import Wizard from '@/components/wizard/Wizard.vue';
import Step from '@/components/wizard/Step.vue';
import Card from '@/components/cards/Card.vue';
import Incident from '@/models/Incident';
import IncidentForm from '@/components/admin/incidents/IncidentForm.vue';
import IncidentFormBuilder from '@/components/admin/incidents/IncidentFormBuilder.vue';
import IncidentLocationEditor from '@/components/admin/incidents/IncidentLocationEditor.vue';
import IncidentAssetBuilder from '@/components/admin/incidents/IncidentAssetBuilder.vue';
import { useToast } from 'vue-toastification';

export default defineComponent({
  name: 'AdminIncidentWizard',
  components: {
    IncidentAssetBuilder,
    IncidentLocationEditor,
    IncidentFormBuilder,
    IncidentForm,
    Card,
    Step,
    Wizard,
  },
  setup() {
    const route = useRoute();

    const currentIncident = ref({
      name: '',
      short_name: '',
      timezone: '',
      case_label: '',
      incident_type: '',
      start_at: null,
    });
    const currentAni = ref({
      anis: [],
      start_at: null,
      end_at: null,
      timezone: '',
      use_hotline: false,
    });
    const currentLocation = ref(null);
    const formFieldTree = ref(null);
    const savedIncident = ref<Incident>(null);
    const savedAniIncidents = ref([]);
    const loading = ref(false);
    const { t } = useI18n();
    const $toasted = useToast();

    const selectableWorkTypes = computed(() => {
      if (formFieldTree.value) {
        const workInfoSection = formFieldTree.value.find(
          (f) => f.label_t === 'formLabels.work_info',
        );
        return workInfoSection?.children.map((child) => {
          return child.if_selected_then_work_type;
        });
      }

      return [];
    });

    const currentIncidentLocation = computed(() => {
      if (savedIncident.value && savedIncident.value.locations.length > 0) {
        return savedIncident.value.locations.at(-1);
      }

      return null;
    });

    async function loadIncident(id) {
      loading.value = true;
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/incidents/${id}`,
      );

      const aniIncidentResponse = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/ani_incidents`,
        {
          params: {
            incident: id,
          },
        },
      );

      savedAniIncidents.value = aniIncidentResponse.data.results;
      savedIncident.value = response.data;
      currentIncident.value = {
        ...savedIncident.value,
      };
      loading.value = false;
    }

    async function saveIncidentFields() {
      const result = [];
      const stack = [...formFieldTree.value];
      while (stack.length > 0) {
        const current = stack.pop();

        result.push(current);

        if (current.children && current.children.length > 0) {
          for (const [index, child] of [...current.children].entries()) {
            child.field_parent_key = current.field_key;
            child.list_order = index;
            if (!child.phase) {
              child.phase = 4;
            }

            stack.push(child);
            continue;
          }
        }
      }

      loading.value = true;

      try {
        await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/incident_forms`,
          {
            fields: result,
            incident: savedIncident.value.id,
          },
        );
      } finally {
        loading.value = false;
      }
    }

    function updateIncident(value, key) {
      Incident.update({
        where: currentIncident.value.id,
        data: {
          [key]: value,
        },
      });
    }

    async function saveIncident() {
      let response;
      response = await (savedIncident.value?.id
        ? axios.patch(
            `${import.meta.env.VITE_APP_API_BASE_URL}/incidents/${
              savedIncident.value.id
            }`,
            {
              ...currentIncident.value,
              start_at: moment(currentIncident.value.start_at),
            },
          )
        : axios.post(`${import.meta.env.VITE_APP_API_BASE_URL}/incidents`, {
            ...currentIncident.value,
            start_at: moment(currentIncident.value.start_at),
          }));

      const incidentId = response.data.id;

      if (currentLocation.value?.id) {
        await Incident.api().addLocation(incidentId, currentLocation.value.id);
      }

      if (currentAni.value.anis.length > 0) {
        const promises = [];
        for (const ani of currentAni.value.anis) {
          promises.push(
            axios.post(
              `${import.meta.env.VITE_APP_API_BASE_URL}/ani_incidents`,
              {
                ani,
                incident: incidentId,
                start_at: moment(currentAni.value.start_at),
                end_at: moment(currentAni.value.end_at),
              },
            ),
          );
        }

        await Promise.all(promises);
      }

      await loadIncident(incidentId);
    }

    async function deleteAniIncident(id) {
      await axios.delete(
        `${import.meta.env.VITE_APP_API_BASE_URL}/ani_incidents/${id}`,
      );
      savedAniIncidents.value = savedAniIncidents.value.filter(
        (aniIncident) => aniIncident.id !== id,
      );
    }

    async function onCompletedIncident() {
      await $toasted.success(t('info.create_incident_success'));
    }

    onMounted(async () => {
      if (route.params.incident_id) {
        await loadIncident(route.params.incident_id);
      }
    });

    return {
      saveIncidentFields,
      saveIncident,
      deleteAniIncident,
      currentIncident,
      currentAni,
      currentLocation,
      formFieldTree,
      savedIncident,
      savedAniIncidents,
      loading,
      selectableWorkTypes,
      currentIncidentLocation,
      onCompletedIncident,
    };
  },
});
</script>
