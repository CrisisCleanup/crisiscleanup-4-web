<template>
  <div class="flex flex-col sm:w-3/4 w-11/12 m-auto">
    <base-button
      variant="solid"
      class="px-4 py-2 self-end mt-6"
      data-testid="testSaveButton"
      :text="$t('actions.save')"
      :alt="$t('actions.save')"
      :action="saveOrganization"
    />
    <div class="mt-6 grid sm:grid-cols-2 gap-x-6">
      <Card>
        <template #header>
          <base-text class="px-5 py-3">
            {{ $t('profileOrg.main_info') }}
          </base-text>
        </template>
        <div class="px-5 py-3">
          <div class="logo-field form-row">
            <div>{{ $t('profileOrg.logo') }}</div>
            <div class="flex">
              <div v-if="!logoUrl">
                <DragDrop
                  class="w-full sm:w-84 h-16 text-center mr-6 border border-dashed"
                  data-testid="testOrganizationLogoFile"
                  container-class="flex-row items-center justify-center"
                  :choose-title="$t('profileOrg.upload_org_logo')"
                  :drag-title="$t('profileOrg.logo_specs')"
                  :multiple="false"
                  @files="
                    (files) => {
                      handleFileUpload(files, 'fileTypes.logo');
                    }
                  "
                ></DragDrop>
              </div>
              <div v-else>
                <img
                  class="w-full sm:w-84"
                  data-testid="testOrganizationLogoIcon"
                  :src="logoUrl"
                  :alt="$t('profileOrg.organization_logo')"
                />
                <DragDrop
                  class="text-primary-dark cursor-pointer"
                  data-testid="testOrganizationLogo2File"
                  :disabled="uploading"
                  :multiple="false"
                  @files="
                    (files) => {
                      handleFileUpload(files, 'fileTypes.logo');
                    }
                  "
                >
                  <base-button
                    class="text-center pb-4 cursor-pointer"
                    data-testid="testUpdateLogoButton"
                    :show-spinner="uploading"
                    :alt="$t('actions.update_logo')"
                    :disabled="uploading"
                    >{{ $t('actions.update_logo') }}
                  </base-button>
                </DragDrop>
              </div>
            </div>
          </div>
          <div class="form-row">
            <FloatingInput
              class="mr-2 w-full sm:w-84"
              data-testid="testOrganizationNameTextInput"
              :placeholder="$t('profileOrg.organization_name')"
              :value="currentOrganization.name"
              required
              @input="(e) => updateOrganization(e.target.value, 'name')"
            />
          </div>
          <div class="form-row">
            <FloatingInput
              class="mr-2 w-full sm:w-84"
              data-testid="testAddressTextInput"
              :placeholder="$t('profileOrg.address')"
              :value="currentOrganization.address"
              required
              @input="(e) => updateOrganization(e.target.value, 'address')"
            />
          </div>
          <div class="form-row">
            <FloatingInput
              class="mr-2 w-full sm:w-84"
              data-testid="testUrlTextInput"
              :placeholder="$t('profileOrg.url')"
              :value="currentOrganization.url"
              required
              @input="(e) => updateOrganization(e.target.value, 'url')"
            />
          </div>
          <div class="form-row">
            <FloatingInput
              class="mr-2 w-full sm:w-84"
              data-testid="testEmailTextInput"
              :placeholder="$t('profileOrg.email')"
              :value="currentOrganization.email"
              required
              @input="(e) => updateOrganization(e.target.value, 'email')"
            />
          </div>
          <div class="form-row">
            <PhoneNumberInput
              class="sm:w-84"
              data-testid="testPhoneTextInput"
              :placeholder="$t('profileOrg.phone')"
              :model-value="currentOrganization.phone1"
              required
              @update:model-value="(v) => updateOrganization(v, 'phone1')"
            />
          </div>
          <div class="form-row">
            <base-select
              :placeholder="$t('profileOrg.organization_type')"
              data-testid="testOrganizationTypeTextInput"
              class="w-full sm:w-84 flex-grow border border-crisiscleanup-dark-100"
              :options="organizationTypes"
              :model-value="currentOrganization.type_t"
              item-key="key"
              label="label"
              @update:model-value="(v) => updateOrganization(v, 'type_t')"
            />
          </div>
        </div>
      </Card>
      <Card>
        <template #header>
          <base-text class="px-5 py-3">
            {{ $t('profileOrg.general_information') }}
          </base-text>
        </template>
        <div class="px-5 py-3">
          <div class="form-row" data-testid="testPrimaryContactsDiv">
            <div class="font-semibold">
              {{ $t('profileOrg.primary_contacts') }}
            </div>
            <div
              style="
                display: grid;
                grid-template-columns: max-content max-content max-content max-content;
                grid-column-gap: 15px;
                grid-row-gap: 5px;
              "
              class="py-1"
            >
              <template
                v-for="contact in organization.primary_contacts"
                :key="contact.id"
              >
                <span class="inline-block">
                  {{ contact.first_name }} {{ contact.last_name }}
                </span>
                <div>
                  <a
                    :href="`mailto:${contact.email}`"
                    :data-testid="`testEmail${contact.email}Link`"
                    :title="contact.email"
                    :alt="contact.email"
                  >
                    <font-awesome-icon icon="envelope" />
                  </a>
                </div>
                <div>
                  <a
                    v-show="contact.mobile"
                    :data-testid="`testMobile${contact.mobile}Link`"
                    :href="`tel:${contact.mobile}`"
                    :title="contact.mobile"
                    :alt="contact.mobile"
                  >
                    <font-awesome-icon icon="phone" />
                  </a>
                </div>
                <ccu-icon
                  :alt="$t('actions.delete')"
                  :data-testid="`testDelete${contact.email}Button`"
                  class="ml-1"
                  size="xs"
                  type="cancel"
                  :action="
                    () => {
                      return deletePrimaryContact(contact);
                    }
                  "
                />
              </template>
            </div>

            <UserSearchInput
              :key="JSON.stringify(organization.primary_contacts)"
              :placeholder="$t('profileOrg.add_primary_contacts')"
              data-testid="testAddPrimaryContactsSearch"
              @selected-user="(user) => makePrimaryContact(user)"
            />
          </div>
          <div class="form-row">
            <div>{{ $t('profileOrg.social_media') }}</div>
            <div class="form-row flex">
              <div class="w-32 flex items-center">
                <img src="@/assets/facebook.svg" class="w-8 mr-2" />
                <label class="pr-3 text-xs">{{
                  $t('profileOrg.facebook')
                }}</label>
              </div>
              <base-input
                class="w-full sm:w-84"
                data-testid="testFacebookTextInput"
                size="small"
                :value="currentOrganization.facebook"
                :placeholder="$t('profileOrg.facebook')"
                @input="(e) => updateOrganization(e.target.value, 'facebook')"
              />
            </div>
            <div class="form-row flex">
              <div class="w-32 flex items-center">
                <img src="@/assets/twitter.svg" class="ml-1 w-6 mr-2" />
                <label class="pr-3 text-xs">{{
                  $t('profileOrg.twitter')
                }}</label>
              </div>
              <base-input
                class="w-full sm:w-84"
                data-testid="testTwitterTextInput"
                size="small"
                :value="currentOrganization.twitter"
                :placeholder="$t('profileOrg.twitter')"
                @input="(e) => updateOrganization(e.target.value, 'twitter')"
              />
            </div>
          </div>
          <div class="form-row">
            <FloatingInput
              class="mr-2 w-full sm:w-84"
              data-testid="testDonationUrlTextInput"
              :placeholder="$t('profileOrg.donation_url')"
              :value="currentOrganization.donate_url"
              required
              @input="(e) => updateOrganization(e.target.value, 'donate_url')"
            />
          </div>
        </div>
      </Card>
    </div>
    <div class="mt-6">
      <Card>
        <template #header>
          <base-text class="px-5 py-3">
            {{ $t('profileOrg.capabilities') }}
          </base-text>
        </template>
        <CapabilityGrid
          :key="JSON.stringify(organizationCapabilities)"
          data-testid="testCapabilitiesMatrixInput"
          class="px-5 py-3"
          :organization-capabilities="organizationCapabilities"
          @updated="
            (matrix) => {
              updatedOrganizationCapabilitiesMatrix = matrix;
            }
          "
        />
      </Card>
    </div>
    <div
      class="mt-6 grid sm:grid-cols-2 gap-x-6"
      data-testid="testCurrentIncidentsContent"
    >
      <Card>
        <template #header>
          <base-text class="px-5 py-3">
            {{ $t('requestRedeploy.request_redeploy') }}
          </base-text>
        </template>
        <RequestRedeploy />
      </Card>
      <Card>
        <template #header>
          <base-text class="px-5 py-3">
            {{ $t('profileOrg.current_incidents') }}
          </base-text>
        </template>
        <div class="px-5 py-1 font-semibold">
          {{ $t('profileOrg.approved') }}
        </div>
        <div
          class="px-5 py-1 grid grid-cols-2 gap-x-6"
          data-testid="testApprovedIncidentsDiv"
        >
          <div
            v-for="incident in currentOrganization.approved_incidents"
            :key="`${incident}`"
          >
            {{ getIncidentName(incident) }}
          </div>
        </div>
        <div class="px-5 py-1 font-semibold">
          {{ $t('profileOrg.pending') }}
        </div>
        <div
          class="px-5 py-1 grid grid-cols-2 gap-x-6"
          data-testid="testPendingIncidentsDiv"
        >
          <div
            v-for="incident in currentOrganization.pending_incidents"
            :key="`${incident}`"
          >
            {{ getIncidentName(incident) }}
          </div>
        </div>
      </Card>
    </div>
    <div class="mt-6 grid sm:grid-cols-2 gap-x-6">
      <Card>
        <template #header>
          <base-text class="px-5 py-3">
            {{ $t('profileOrg.primary_response_area') }}
          </base-text>
        </template>
        <div
          v-if="canEditLocation"
          class="py-2 flex items-center justify-center"
        >
          <base-button
            v-if="currentOrganization.primary_location"
            data-testid="testEditPrimaryLocationButton"
            :text="$t('profileOrg.edit_response_area')"
            :alt="$t('profileOrg.edit_response_area')"
            variant="solid"
            class="px-2 py-1"
            :action="
              () => {
                showingLocationModal = true;
                settingLocation = 'primary_location';
              }
            "
          ></base-button>
          <base-button
            v-else
            data-testid="testAddPrimaryLocationButton"
            class="px-2 py-1"
            variant="solid"
            :text="$t('profileOrg.add_response_area')"
            :alt="$t('profileOrg.add_response_area')"
            :action="
              () => {
                showingLocationModal = true;
                settingLocation = 'primary_location';
              }
            "
          ></base-button>
        </div>
        <div v-else class="py-2 flex items-center justify-center">
          <base-button
            :text="$t('profileOrg.contact_help_change_response')"
            :alt="$t('profileOrg.contact_help_change_response')"
            data-testid="testContactHelpChangeResponseButton"
            variant="solid"
            class="px-2 py-1"
            disabled
          ></base-button>
        </div>
        <div id="primary-location" class="w-full h-64"></div>
      </Card>
      <Card>
        <template #header>
          <base-text class="px-5 py-3">
            {{ $t('profileOrg.secondary_response_area') }}
          </base-text>
        </template>
        <div
          v-if="canEditLocation"
          class="py-2 flex items-center justify-center"
        >
          <base-button
            v-if="currentOrganization.secondary_location"
            data-testid="testEditSecondaryLocationButton"
            :text="$t('profileOrg.edit_response_area')"
            :alt="$t('profileOrg.edit_response_area')"
            variant="solid"
            class="px-2 py-1"
            :action="
              () => {
                showingLocationModal = true;
                settingLocation = 'secondary_location';
              }
            "
          ></base-button>
          <base-button
            v-else
            data-testid="testAddSecondaryLocationButton"
            class="px-2 py-1"
            variant="solid"
            :text="$t('profileOrg.add_response_area')"
            :alt="$t('profileOrg.add_response_area')"
            :action="
              () => {
                showingLocationModal = true;
                settingLocation = 'secondary_location';
              }
            "
          ></base-button>
        </div>
        <div v-else class="py-2 flex items-center justify-center">
          <base-button
            :text="$t('profileOrg.contact_help_change_response')"
            :alt="$t('profileOrg.contact_help_change_response')"
            data-testid="testContactHelpChangeResponse2Button"
            variant="solid"
            class="px-2 py-1"
            disabled
          ></base-button>
        </div>
        <div id="secondary-location" class="w-full h-64"></div>
      </Card>
      <modal
        v-if="showingLocationModal"
        data-testid="testSelectLocationModal"
        :title="$t('profileOrg.select_location')"
        modal-style="height: 90%"
        modal-classes="sm:w-3/5"
        @close="showingLocationModal = false"
        @ok="saveCurrentLocation"
      >
        <LocationTool
          :organization="currentOrganization.id"
          class="h-full p-3"
          :locations="existingLocation"
          @changed="setCurrentLocation"
        />
      </modal>
    </div>
    <div class="w-full bg-white shadow mt-6 mb-32">
      <div
        class="border-b px-4 py-2 font-semibold flex justify-between items-center"
      >
        {{ $t('profileOrg.custom_materials') }}
        <base-button
          variant="solid"
          data-testid="testSaveButton"
          class="px-4 py-2"
          :text="$t('actions.save')"
          :alt="$t('actions.save')"
          :action="saveOrganization"
        />
      </div>
      <div class="px-8 pb-6 mt-4">
        <div class="my-1">
          {{ $t('profileOrg.custom_work_order_instructions') }}
        </div>
        <textarea
          :value="currentOrganization.custom_ops_message"
          :placeholder="$t('profileOrg.add_work_order_instructions')"
          :disabled="!currentUser.isPrimaryContact && !currentUser.isAdmin"
          data-testid="testCustomOpsMessageTextArea"
          rows="4"
          class="text-base border border-crisiscleanup-dark-100 placeholder-crisiscleanup-dark-200 outline-none p-1 resize-none w-full sm:w-72"
          @input="
            (e) => updateOrganization(e.target.value, 'custom_ops_message')
          "
        />
      </div>
      <hr />
      <div class="px-8 pb-6 mt-4">
        <div class="my-1">{{ $t('profileOrg.add_custom_tos') }}</div>
        <div class="flex items-center">
          <font-awesome-icon
            class="mx-1 text-crisiscleanup-dark-400 mr-2"
            size="lg"
            icon="file"
          />
          <base-input
            size="small"
            data-testid="testAddCustomTosTextInput"
            class="w-full sm:w-64 mr-2"
            input-classes="text-xs"
            disabled
            :model-value="
              termsOfService ? termsOfService.filename_original : ''
            "
          ></base-input>
          <ccu-icon
            v-if="termsOfService"
            data-testid="testDeleteIcon"
            :alt="$t('actions.delete')"
            size="small"
            class="p-1 py-2"
            type="trash"
            @click="
              () => {
                deleteFile(termsOfService.file);
              }
            "
          />
        </div>
        <DragDrop
          class="cursor-pointer w-full sm:w-64 py-2"
          data-testid="testTermsOfServiceFile"
          container-class="items-start"
          :disabled="
            uploading || (!currentUser.isPrimaryContact && !currentUser.isAdmin)
          "
          :multiple="false"
          @files="
            (files) => {
              handleFileUpload(files, 'fileTypes.terms_of_service');
            }
          "
        >
          <base-button
            class="cursor-pointer px-3 py-1"
            data-testid="testAddTermsButton"
            variant="solid"
            :text="$t('actions.add_terms')"
            :alt="$t('actions.add_terms')"
            :show-spinner="uploading"
            :disabled="
              uploading ||
              (!currentUser.isPrimaryContact && !currentUser.isAdmin)
            "
          />
        </DragDrop>
        <textarea
          :value="currentOrganization.custom_legal_tos"
          :disabled="!currentUser.isPrimaryContact && !currentUser.isAdmin"
          :placeholder="$t('profileOrg.add_tos_text')"
          data-testid="testCustomLegalTosTextArea"
          rows="4"
          class="text-base border border-crisiscleanup-dark-100 placeholder-crisiscleanup-dark-200 outline-none p-1 resize-none w-full sm:w-72"
          @input="(e) => updateOrganization(e.target.value, 'custom_legal_tos')"
        />
      </div>
      <hr />
      <div class="px-8 pb-6 mt-4">
        <div class="my-1">{{ $t('profileOrg.add_custom_liability') }}</div>
        <div class="flex items-center">
          <font-awesome-icon
            class="mx-1 text-crisiscleanup-dark-400 mr-2"
            size="lg"
            icon="file"
          />
          <base-input
            size="small"
            data-testid="testAddCustomLiabilityInput"
            class="w-full sm:w-64 mr-2"
            input-classes="text-xs"
            disabled
            :model-value="
              liabilityWaiver ? liabilityWaiver.filename_original : ''
            "
          ></base-input>
          <ccu-icon
            v-if="liabilityWaiver"
            data-testid="testDeleteLiabilityWaiverButton"
            :alt="$t('actions.delete')"
            size="small"
            class="p-1 py-2"
            type="trash"
            @click="
              () => {
                deleteFile(liabilityWaiver.file);
              }
            "
          />
        </div>
        <DragDrop
          class="cursor-pointer w-full sm:w-64 py-2"
          data-testid="testLiabilityWaiverFile"
          container-class="items-start"
          :disabled="
            uploading || (!currentUser.isPrimaryContact && !currentUser.isAdmin)
          "
          :multiple="false"
          @files="
            (files) => {
              handleFileUpload(files, 'fileTypes.liability_waiver');
            }
          "
        >
          <base-button
            class="cursor-pointer px-3 py-1"
            data-testid="testCustomSurvivorWaiverButton"
            variant="solid"
            :text="$t('profileOrg.custom_survivor_waiver')"
            :alt="$t('profileOrg.custom_survivor_waiver')"
            :show-spinner="uploading"
            :disabled="
              uploading ||
              (!currentUser.isPrimaryContact && !currentUser.isAdmin)
            "
          />
        </DragDrop>
        <textarea
          :value="currentOrganization.custom_legal_survivor_waiver"
          :disabled="!currentUser.isPrimaryContact && !currentUser.isAdmin"
          :placeholder="$t('profileOrg.add_survivor_waiver_text')"
          data-testid="testAddSurvivorWaiverTextTextArea"
          rows="4"
          class="text-base border border-crisiscleanup-dark-100 placeholder-crisiscleanup-dark-200 outline-none p-1 resize-none w-full sm:w-72"
          @update:modelValue="
            (e) =>
              updateOrganization(e.target.value, 'custom_legal_survivor_waiver')
          "
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as L from 'leaflet';
import axios from 'axios';
import type { GeoJSON } from 'leaflet';
import { useToast } from 'vue-toastification';
import DragDrop from '@/components/DragDrop.vue';
import LocationTool from '@/components/locations/LocationTool.vue';
import { mapTileLayer } from '@/utils/map';
import Organization from '@/models/Organization';
import Role from '@/models/Role';
import UserRole from '@/models/UserRole';
import Location from '@/models/Location';
import Incident from '@/models/Incident';
import User from '@/models/User';
import { getErrorMessage } from '@/utils/errors';
import UserSearchInput from '@/components/UserSearchInput.vue';
import LocationType from '@/models/LocationType';
import FloatingInput from '@/components/FloatingInput.vue';
import Card from '@/components/cards/Card.vue';
import CapabilityGrid from '@/components/CapabilityGrid.vue';
import RequestRedeploy from '@/components/RequestRedeploy.vue';
import useCapabilities from '@/hooks/useCapabilities';
import { useCurrentUser } from '@/hooks';
import PhoneNumberInput from '@/components/PhoneNumberInput.vue';
import moment from 'moment';

export default defineComponent({
  name: 'Profile',
  components: {
    PhoneNumberInput,
    RequestRedeploy,
    CapabilityGrid,
    Card,
    FloatingInput,
    UserSearchInput,
    DragDrop,
    LocationTool,
  },
  setup(props) {
    const store = useStore();
    const $toasted = useToast();
    const { t } = useI18n();
    const { saveCapabilities } = useCapabilities();

    const showingLocationModal = ref(false);
    const currentPolygon = ref<L.Marker | null>(null);
    const primaryLocationMap = ref<L.Map | null>(null);
    const secondaryLocationMap = ref<L.Map | null>(null);
    const settingLocation = ref('');
    const organizationCapabilities = ref([]);
    const updatedOrganizationCapabilitiesMatrix = ref(null);
    const uploading = ref(false);
    const loading = ref(false);

    // Computed properties
    const organizationTypes = computed(() =>
      [
        'orgType.survivor_client_services',
        'orgType.voad',
        'orgType.coad',
        'orgType.government',
        'orgType.ltr',
        'orgType.coalition',
      ].map((key) => {
        return { key, label: t(key) };
      }),
    );
    const roles = computed(() => Role.all());
    const { currentUser, currentOrganization } = useCurrentUser();
    const organization = currentOrganization;
    const canEditLocation = computed(() => {
      return (
        organization.value &&
        organization.value.approved_roles &&
        organization.value.approved_roles.some((role) => [11, 8].includes(role))
      );
    });
    const existingLocation = computed(() => {
      if (settingLocation.value === 'primary_location') {
        return currentOrganization.value &&
          currentOrganization.value.primary_location
          ? [currentOrganization.value.primary_location]
          : [];
      }

      if (settingLocation.value === 'secondary_location') {
        return currentOrganization.value &&
          currentOrganization.value.secondary_location
          ? [currentOrganization.value.secondary_location]
          : [];
      }

      return [];
    });
    const logoUrl = computed(() => {
      if (currentOrganization.value.files.length > 0) {
        const logos = currentOrganization.value.files.filter(
          (file) => file.file_type_t === 'fileTypes.logo',
        );
        logos.sort((a, b) => {
          return moment(b.created_at).diff(moment(a.created_at));
        });
        if (logos.length > 0) {
          return logos[0].small_thumbnail_url;
        }
      }

      return '';
    });
    const termsOfService = computed(() => {
      if (currentOrganization.value.files.length > 0) {
        return currentOrganization.value.files.find(
          (file) => file.file_type_t === 'fileTypes.terms_of_service',
        );
      }

      return null;
    });
    const liabilityWaiver = computed(() => {
      if (currentOrganization.value.files.length > 0) {
        return currentOrganization.value.files.find(
          (file) => file.file_type_t === 'fileTypes.liability_waiver',
        );
      }

      return null;
    });

    onMounted(async () => {
      primaryLocationMap.value = L.map('primary-location', {
        zoomControl: false,
      }).setView([35.746_512_259_918_5, -96.411_509_631_256_56], 3);
      secondaryLocationMap.value = L.map('secondary-location', {
        zoomControl: false,
      }).setView([35.746_512_259_918_5, -96.411_509_631_256_56], 3);
      createTileLayer().addTo(primaryLocationMap.value);
      createTileLayer().addTo(secondaryLocationMap.value);
      await reloadMaps();
      await getOrganizationCapabilities();
    });

    // Methods
    async function getOrganizationCapabilities() {
      const _organizationCapabilities = await axios.get(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/organization_organizations_capabilities`,
        {
          params: {
            organization: currentOrganization.value.id,
          },
        },
      );
      organizationCapabilities.value = _organizationCapabilities.data.results;
    }

    function setCurrentLocation(location) {
      currentPolygon.value = location;
    }

    async function makePrimaryContact(user) {
      const role = Role.query().where('id', 3).first();
      if (!role) {
        throw new Error("Role not found: '3'. Can't make primary contact.");
      }

      await UserRole.api().post(`/user_roles`, {
        user_role: role.id,
        user: user.id,
      });
      await saveOrganization();
    }

    async function deletePrimaryContact(user) {
      const results = await UserRole.api().get(`/user_roles?user=${user.id}`, {
        dataKey: 'results',
      });
      const user_roles = (results.entities!.user_roles || []) as UserRole[];
      const currentUserRole = user_roles.find(
        (ur) => Number(ur.user_role) === 3,
      );
      if (!currentUserRole) {
        throw new Error(
          "User role not found: '3'. Can't delete primary contact.",
        );
      }

      await UserRole.api().delete(`/user_roles/${currentUserRole.id}`, {});
      await saveOrganization();
    }

    async function reloadMaps() {
      const { primary_location, secondary_location } =
        currentOrganization.value;
      if (primary_location) {
        primaryLocationMap.value.eachLayer((layer) => {
          if (layer instanceof L.TileLayer) {
            return;
          }

          primaryLocationMap.value.removeLayer(layer);
        });
        await Location.api().fetchById(primary_location);
        const location = Location.find(primary_location);
        if (!location) {
          throw new Error('Location not found. Cannot reload map.');
        }

        const geojsonFeature = {
          type: 'Feature',
          properties: location.attr,
          geometry: location.poly || location.geom || location.point,
        } as GeoJSON.GeoJsonObject;
        L.geoJSON(geojsonFeature, {
          weight: '1',
        }).addTo(primaryLocationMap.value);
      }

      if (secondary_location) {
        secondaryLocationMap.value.eachLayer((layer) => {
          if (layer instanceof L.TileLayer) {
            return;
          }

          secondaryLocationMap.value.removeLayer(layer);
        });
        await Location.api().fetchById(secondary_location);
        const location = Location.find(secondary_location);
        const geojsonFeature = {
          type: 'Feature',
          properties: location.attr,
          geometry: location.poly || location.geom || location.point,
        } as GeoJSON.GeoJsonObject;
        L.geoJSON(geojsonFeature, {
          weight: '1',
        }).addTo(secondaryLocationMap.value);
      }
    }

    async function saveOrganization() {
      try {
        await Organization.api().patch(
          `/organizations/${currentOrganization.value.id}`,
          currentOrganization.value.$toJson(),
        );
        await saveCapabilities(
          updatedOrganizationCapabilitiesMatrix.value,
          organizationCapabilities.value,
          organization.value,
          false,
        );
        await getOrganizationCapabilities();
        await $toasted.success(t('profileOrg.sucessfully_saved_organization'));
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      }
    }

    async function saveCurrentLocation() {
      loading.value = true;
      let { geometry } = currentPolygon.value.toGeoJSON();
      const { type, features } = currentPolygon.value.toGeoJSON();
      let locationTypeKey = 'org_primary_response_area';
      if (settingLocation.value === 'secondary_location') {
        locationTypeKey = 'org_secondary_response_area';
      }

      const locationType = LocationType.query()
        .where('key', locationTypeKey)
        .get()[0];
      const location = {
        name: `${currentOrganization.value.name} ${t(locationType.name_t)}`,
        type: locationType.id,
      };
      if (type === 'FeatureCollection') {
        const [feature] = features;
        geometry = feature.geometry;
      }

      switch (geometry.type) {
        case 'Point': {
          location.point = geometry;
          break;
        }

        case 'Polygon': {
          location.poly = geometry;
          break;
        }

        case 'MultiPolygon': {
          location.geom = geometry;
          break;
        }
        // No default
      }

      try {
        const response = await Location.api().post('/locations', location);
        const locationId = response.response.data.id;
        await Location.api().fetchById(locationId);
        updateOrganization(locationId, settingLocation.value);
        await Organization.api().patch(
          `/organizations/${currentOrganization.value.id}`,
          {
            [settingLocation.value]: locationId,
          },
        );
        await reloadMaps();
        settingLocation.value = '';
      } catch (error) {
        console.error(error);
      } finally {
        loading.value = false;
      }
    }

    function createTileLayer() {
      return L.tileLayer(mapTileLayer, {
        // tileSize: 512,
        // zoomOffset: -1,
        maxZoom: 19,
      });
    }

    function updateOrganization(value: any, key: string) {
      Organization.update({
        where: currentOrganization.value.id,
        data: {
          [key]: value,
        },
      });
    }

    async function deleteFile(file: File) {
      await Organization.api().deleteFile(currentOrganization.value.id, file);
      await Organization.api().get(
        `/organizations/${currentOrganization.value.id}`,
      );
    }

    async function handleFileUpload(
      fileList: FileList,
      type: string,
      deleteOldFiles = true,
    ) {
      if (fileList.length === 0) {
        uploading.value = false;
        return;
      }

      const formData = new FormData();
      formData.append('upload', fileList[0]);
      formData.append('type_t', type);
      uploading.value = true;
      try {
        const result = await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/files`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Accept: 'application/json',
            },
          },
        );
        const file = result.data.id;

        const files = currentOrganization.value.files.filter(
          (picture) => picture.file_type_t === type,
        );

        if (deleteOldFiles) {
          const oldFiles = files.map((picture) =>
            Organization.api().deleteFile(
              currentOrganization.value.id,
              picture.file,
            ),
          );
          await Promise.all(oldFiles);
        }

        await Organization.api().addFile(
          currentOrganization.value.id,
          file,
          type,
        );
        await Organization.api().get(
          `/organizations/${currentOrganization.value.id}`,
        );
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      } finally {
        uploading.value = false;
      }
    }

    function getIncidentName(value: string) {
      const incident = Incident.query().where('id', Number(value)).first();
      return incident ? incident.name : '';
    }

    return {
      showingLocationModal,
      currentPolygon,
      primaryLocationMap,
      secondaryLocationMap,
      settingLocation,
      organizationCapabilities,
      updatedOrganizationCapabilitiesMatrix,
      organizationTypes,
      uploading,
      loading,

      roles,
      organization,
      currentUser,
      currentOrganization,
      canEditLocation,
      existingLocation,
      logoUrl,
      termsOfService,
      liabilityWaiver,
      setCurrentLocation,
      makePrimaryContact,
      deletePrimaryContact,
      reloadMaps,
      saveOrganization,
      saveCurrentLocation,
      createTileLayer,
      updateOrganization,
      deleteFile,
      handleFileUpload,
      getIncidentName,
    };
  },
});
</script>

<style lang="postcss" scoped>
.divider {
  width: 36rem;
  @apply my-4 border-b;
}

.org-form {
  width: 36rem;
}

.form-row {
  @apply pb-4;
}
</style>

<style>
.form-row #autosuggest__input {
  height: 3rem !important;
}

.form-row .icon-container {
  height: 3rem !important;
}

.form-row .form-field {
  padding: 0 !important;
  margin: 0 !important;
}
</style>
