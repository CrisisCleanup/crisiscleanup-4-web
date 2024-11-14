<template>
  <div
    class="grid grid-cols-1 md:grid-cols-4 h-full max-w-6xl m-auto mt-10 px-5"
  >
    <div class="flex flex-col md:w-64 items-center">
      <Avatar
        :initials="currentUser!.first_name"
        :url="currentUser!.profilePictureUrl"
        data-testid="testFirstNameAvatarIcon"
        class="p-1"
        size="large"
      />
      <DragDrop
        class="text-primary-dark cursor-pointer"
        data-testid="testProfilePictureUploadFile"
        :disabled="uploading"
        @files="handleProfilePictureUpload"
      >
        <base-button
          class="text-center pb-4 cursor-pointer"
          data-testid="testChangePhotoButton"
          :show-spinner="uploading"
          :disabled="uploading"
          :action="() => {}"
          :alt="$t('actions.change_photo')"
          >{{ $t('actions.change_photo') }}
        </base-button>
      </DragDrop>

      <base-button
        variant="solid"
        data-testid="testViewIdBadgeButton"
        class="py-2 px-4"
        :alt="$t('actions.view_id_badge')"
        :action="() => {}"
      >
        {{ $t('actions.view_id_badge') }}
      </base-button>
    </div>
    <div class="mt-3 text-xl md:col-span-3">
      <span>{{ $t('profileUser.your_profile') }}</span>
      <!-- Contact Section -->
      <UserProfileSection
        :title="$t('profileUser.contact')"
        :save-action="() => toggleSection('contact')"
        :expanded-sections="expandedSections"
        section-key="contact"
        class="mb-4"
        @toggle-section="toggleSection"
      >
        <template #collapsed>
          <div>{{ currentUser!.full_name }}</div>
          <div>{{ currentUser!.email }}</div>
          <div>{{ currentUser!.mobile }}</div>
        </template>
        <template #expanded>
          <div class="grid md:grid-cols-2 gap-3">
            <base-input
              :model-value="currentUser!.first_name"
              placeholder="profileUser.first_name_placeholder"
              data-testid="testFullNameInput"
              @update:model-value="(value) => updateUser(value, 'first_name')"
            />
            <base-input
              v-model="currentUser!.last_name"
              placeholder="profileUser.last_name_placeholder"
              data-testid="testLastNameInput"
              @update:model-value="(value) => updateUser(value, 'last_name')"
            />
            <base-input
              :model-value="currentUser!.email"
              placeholder="profileUser.email_placeholder"
              data-testid="testEmailInput"
              @update:model-value="(value) => updateUser(value, 'email')"
            />
            <PhoneNumberInput
              :model-value="currentUser!.mobile"
              placeholder="profileUser.mobile_placeholder"
              data-testid="testMobileInput"
              @update:model-value="(value) => updateUser(value, 'mobile')"
            />
          </div>
        </template>
      </UserProfileSection>
      <!-- Roles Section -->
      <UserProfileSection
        :title="$t('profileUser.user_roles')"
        :save-action="
          () => {
            toggleSection('roles');
            reloadCurrentUser();
          }
        "
        :expanded-sections="expandedSections"
        section-key="roles"
        class="mb-4"
        @toggle-section="toggleSection"
      >
        <template #collapsed>
          <div class="flex gap-2">
            <div v-for="role in currentUser!.allRoles" :key="role.id">
              <tag
                classes="tag flex items-center p-1 px-2 justify-center text-xs border bg-crisiscleanup-light-grey"
                >{{ $t(role.name_t) }}</tag
              >
            </div>
          </div>
        </template>
        <template #expanded>
          <div class="grid md:grid-cols-2 gap-3">
            <UserRolesSelect :user="currentUser!" />
          </div>
        </template>
      </UserProfileSection>
      <!-- Languages Section -->
      <UserProfileSection
        :title="$t('profileUser.languages')"
        :save-action="
          () => {
            updateUserLanguage();
            toggleSection('languages');
          }
        "
        :expanded-sections="expandedSections"
        section-key="languages"
        class="mb-4"
        @toggle-section="toggleSection"
      >
        <template #collapsed>
          <div class="flex gap-2">
            <div v-for="language in currentUser!.languages" :key="language.id">
              <tag
                classes="tag flex items-center p-1 px-2 justify-center text-xs border bg-crisiscleanup-light-grey"
                >{{ $t(language.name_t) }}</tag
              >
            </div>
          </div>
        </template>
        <template #expanded>
          <base-select
            :model-value="currentUser!.languageIds"
            data-testid="testLanguagesSelect"
            multiple
            :options="languages"
            item-key="id"
            label="name_t"
            size="large"
            class="w-full"
            @update:model-value="updateUserLanguageIds"
          />
        </template>
      </UserProfileSection>
      <!-- Social Media Section -->
      <UserProfileSection
        :title="$t('profileUser.linkedin')"
        :save-action="() => toggleSection('socialMedia')"
        :expanded-sections="expandedSections"
        section-key="socialMedia"
        class="mb-4"
        @toggle-section="toggleSection"
      >
        <template #collapsed>
          <div>
            <div>
              {{ $t('profileUser.facebook') }}:
              {{ currentUser!.facebook || $t('profileUser.no_facebook') }}
            </div>
            <div>
              {{ $t('profileUser.twitter') }}:
              {{ currentUser!.twitter || $t('profileUser.no_twitter_x') }}
            </div>
          </div>
        </template>
        <template #expanded>
          <div class="grid md:grid-cols-2 gap-3">
            <div class="mt-3">
              <div class="flex pb-4">
                <div class="flex items-center w-36">
                  <img
                    src="https://simpleicons.org/icons/facebook.svg"
                    class="w-6 mr-2"
                    :alt="$t('profileUser.facebook')"
                  />
                  <label class="pr-3">{{ $t('profileUser.facebook') }}</label>
                </div>
                <base-input
                  :model-value="currentUser!.facebook"
                  data-testid="testFacebookTextInput"
                  size="small"
                  :placeholder="$t('profileUser.facebook')"
                  @update:model-value="
                    (value) => {
                      const social = {
                        ...currentUser!.social,
                        facebook: value,
                      };
                      updateUser(social, 'social');
                    }
                  "
                />
              </div>
              <div class="flex pb-4">
                <div class="flex items-center w-36">
                  <img
                    src="https://simpleicons.org/icons/x.svg"
                    class="w-6 mr-2"
                    :alt="$t('profileUser.twitter')"
                  />
                  <label class="pr-3">{{ $t('profileUser.twitter') }}</label>
                </div>
                <base-input
                  :model-value="currentUser!.twitter"
                  data-testid="testTwitterTextInput"
                  size="small"
                  :placeholder="$t('profileUser.twitter')"
                  @update:model-value="
                    (value) => {
                      const social = {
                        ...currentUser!.social,
                        twitter: value,
                      };
                      updateUser(social, 'social');
                    }
                  "
                />
              </div>
            </div>
          </div>
        </template>
      </UserProfileSection>
      <!-- Change Password Section -->
      <UserProfileSection
        :title="$t('actions.change_password')"
        :save-action="() => toggleSection('changePassword')"
        :expanded-sections="expandedSections"
        section-key="changePassword"
        :expandable="false"
        class="mb-4"
        @toggle-section="toggleSection"
      >
        <template #collapsed>
          <div>
            <base-button
              variant="solid"
              data-testid="testChangePasswordButton"
              class="px-4 py-1 my-1"
              :alt="$t('actions.change_password')"
              :action="
                () => {
                  $router.push(`/password/new?email=${currentUser!.email}`);
                }
              "
            >
              {{ $t('actions.change_password') }}
            </base-button>
          </div>
        </template>
      </UserProfileSection>
      <!-- Beta Features -->
      <UserProfileSection
        :title="$t('profileUser.beta_features')"
        :save-action="() => toggleSection('betaFeatures')"
        :expanded-sections="expandedSections"
        section-key="betaFeatures"
        class="mb-4"
        @toggle-section="toggleSection"
      >
        <template #collapsed>
          <div class="gap-2">
            <div v-for="feature in betaFeatures" :key="feature.id">
              {{ feature.description }} :
              <span class="font-semibold">{{
                $can(`beta_feature.${feature.name}`)
                  ? $t('profileUser.enabled')
                  : $t('profileUser.disabled')
              }}</span>
            </div>
          </div>
        </template>
        <template #expanded>
          <div class="flex flex-col py-3">
            <div
              v-for="feature in betaFeatures"
              :key="feature.id"
              :data-testid="`testBetaFeature${feature.id}Div`"
              class="flex w-1/2"
            >
              <base-checkbox
                class="mr-1 text-sm"
                :model-value="$can(`beta_feature.${feature.name}`)"
                @update:model-value="
                  () => {
                    optInBetaFeature(feature.id);
                  }
                "
              >
                {{ feature.description }}
              </base-checkbox>
            </div>
          </div>
        </template>
      </UserProfileSection>
      <!-- Equipment -->
      <UserProfileSection
        :title="$t('profileUser.equipment')"
        :save-action="() => toggleSection('equipment')"
        :expanded-sections="expandedSections"
        section-key="equipment"
        class="mb-4"
        @toggle-section="toggleSection"
      >
        <template #collapsed>
          <div class="">
            <div v-for="e in userEquipment" :key="e.id">
              {{ $t(getEquipmentName(e.equipment)) }}
            </div>
          </div>
        </template>
        <template #expanded>
          <div class="py-3">
            <UserEquipmentSelect :user="currentUser!" />
          </div>
        </template>
      </UserProfileSection>
      <!-- Your Organization -->
      <UserProfileSection
        :title="$t('profileUser.your_organization')"
        :save-action="() => toggleSection('organization')"
        :expanded-sections="expandedSections"
        section-key="organization"
        class="mb-4"
        @toggle-section="toggleSection"
      >
        <template #collapsed>
          <div class="py-3 flex items-center">
            <div
              class="w-8 h-8 rounded-full bg-crisiscleanup-grey-300 border border-black"
            />
            <span class="px-4">{{ currentUser!.organization.name }}</span>
          </div>
        </template>
        <template #expanded>
          <div class="py-3 flex items-center">
            <div
              class="w-8 h-8 rounded-full bg-crisiscleanup-grey-300 border border-black"
            />
            <span class="px-4">{{ currentUser!.organization.name }}</span>
          </div>
          <div class="my-2">
            <base-button
              variant="solid"
              data-testid="testChangeOrganizationButton"
              class="px-4 py-1"
              :alt="$t('profileUser.change_organization')"
              :action="
                () => {
                  showChangeOrganizationModal = true;
                }
              "
            >
              {{ $t('profileUser.change_organization') }}
            </base-button>
            <ChangeOrganizationModal
              v-if="showChangeOrganizationModal"
              @cancel="showChangeOrganizationModal = false"
            />
          </div>
        </template>
      </UserProfileSection>
      <!-- Troubleshooting -->
      <UserProfileSection
        :title="$t('profileUser.troubleshooting')"
        :save-action="() => toggleSection('troubleshooting')"
        :expanded-sections="expandedSections"
        section-key="troubleshooting"
        class="mb-4"
        :expandable="false"
        @toggle-section="toggleSection"
      >
        <template #collapsed>
          <div>
            <base-button
              :text="$t('profileUser.reset_user_states')"
              :alt="$t('profileUser.reset_user_states')"
              data-testid="testResetUserStatesButton"
              variant="solid"
              class="px-4 py-1"
              :action="resetStates"
            />
            <p class="my-3">
              {{ $t('profileUser.clear_map_settings_viewport') }}
            </p>
            <base-button
              :text="$t('profileUser.reset_user_preferences')"
              :alt="$t('profileUser.reset_user_preferences')"
              data-testid="testResetUserPreferencesButton"
              variant="solid"
              class="px-4 py-1"
              :action="resetPreferences"
            />
            <p class="my-3">
              {{ $t('profileUser.clear_favorites_user_settings') }}
            </p>
            <a
              href="https://crisiscleanup.zendesk.com/hc/en-us/articles/25053795283597-Deleting-Your-User-Account"
              data-testid="testDeleteUserAccountButton"
              class="flex justify-center items-center gap-3 w-min px-4 py-1 text-crisiscleanup-light-smoke bg-crisiscleanup-red-100"
              target="_blank"
            >
              <span>{{ $t('profileUser.delete_account') }}</span>
              <ccu-icon
                :alt="$t('profileUser.delete_account_alt')"
                type="external-link"
                fa
                size="small"
                data-testid="testNewCaseIcon"
              />
            </a>
            <p class="my-3">
              {{ $t('profileUser.delete_account_info') }}
            </p>
          </div>
        </template>
      </UserProfileSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import baseButton from '@/components/BaseButton.vue';
import baseInput from '@/components/BaseInput.vue';
import { useAuthStore, useCurrentUser } from '@/hooks';
import Avatar from '@/components/Avatar.vue';
import DragDrop from '@/components/DragDrop.vue';
import { getErrorMessage } from '@/utils/errors';
import axios from 'axios';
import User from '@/models/User';
import { useToast } from 'vue-toastification';
import UserProfileSection from '@/components/UserProfileSection.vue';
import UserRolesSelect from '@/components/UserRolesSelect.vue';
import Tag from '@/components/Tag.vue';
import Language from '@/models/Language';
import useSetupLanguage from '@/hooks/useSetupLanguage';
import useAcl from '@/hooks/useAcl';
import type { BetaFeature } from '@/models/types';
import ChangeOrganizationModal from '@/components/modals/ChangeOrganizationModal.vue';
import UserEquipmentSelect from '@/components/UserEquipmentSelect.vue';
import UserEquipment from '@/models/UserEquipment';
import type { Collection } from '@vuex-orm/core';
import Equipment from '@/models/Equipment';
import PhoneNumberInput from '@/components/PhoneNumberInput.vue';

const {
  currentUser,
  userPreferences,
  updateCurrentUser,
  updateCurrentUserDebounced,
} = useCurrentUser();
const authStore = useAuthStore();
const store = useStore();
const uploading = ref(false);
const $toasted = useToast();
const { t } = useI18n();
const { setupLanguage } = useSetupLanguage();
const { $can } = useAcl();

const betaFeatures = ref<BetaFeature[]>([]);
const showChangeOrganizationModal = ref(false);
const userEquipment = ref<Collection<UserEquipment>>([]);

const languages = computed(() =>
  Language.all().map((l) => {
    return {
      ...l,
      name_t: t(l.name_t),
    };
  }),
);

const expandedSections = ref<Record<string, boolean>>({
  contact: false,
  roles: false,
  languages: false,
  socialMedia: false,
});

const reloadCurrentUser = async () => {
  await authStore.getMe();
  store.commit('acl/setUserAcl', currentUser?.value?.id);
};

const toggleSection = (section: string) => {
  expandedSections.value[section] = !expandedSections.value[section];
};

async function updateUser(value: unknown, key: string) {
  await updateCurrentUserDebounced({
    [key]: value,
  }).catch((error) => {
    $toasted.error(getErrorMessage(error));
  });
}

async function getBetaFeatures() {
  const { data } = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/beta_features`,
  );
  return data.results;
}

async function optInBetaFeature(feature_id: string) {
  await axios.post(
    `${
      import.meta.env.VITE_APP_API_BASE_URL
    }/beta_features/${feature_id}/opt_in`,
  );
  await authStore.getMe();
  store.commit('acl/setUserAcl', currentUser?.value?.id);
}

async function updateUserLanguageIds(value: string[]) {
  const [primary_language, secondary_language] = value;
  await updateUser(primary_language, 'primary_language');
  await updateUser(secondary_language, 'secondary_language');
  if (!primary_language) {
    await updateUser(null, 'primary_language');
  }
  if (!secondary_language) {
    await updateUser(null, 'secondary_language');
  }
}

async function updateUserLanguage() {
  await setupLanguage();
}

async function handleProfilePictureUpload(fileList: File[]) {
  if (fileList.length === 0) {
    uploading.value = false;
    return;
  }

  if (!currentUser.value) {
    // shouldn't be possible.
    const errorMsg = 'Tried to update photos without current user.';
    const err = new Error(errorMsg);
    getErrorMessage(err);
    throw err;
  }

  const formData = new FormData();
  formData.append('upload', fileList[0]);
  formData.append('type_t', 'fileTypes.user_profile_picture');
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

    const profilePictures = currentUser.value.files.filter(
      (picture) => picture.file_type_t === 'fileTypes.user_profile_picture',
    );

    const oldImages = profilePictures.map((picture) =>
      User.api().deleteFile(authStore.currentUserId.value, picture.file),
    );
    await Promise.allSettled([
      ...oldImages,
      User.api().addFile(authStore.currentUserId.value, file),
    ]);
    await authStore.getMe();
  } catch (error) {
    await $toasted.error(getErrorMessage(error));
  } finally {
    uploading.value = false;
  }
}

async function resetStates() {
  await updateCurrentUser({
    states: {},
  });
}

async function resetPreferences() {
  await updateCurrentUser({
    preferences: {},
  });
}

async function getUserEquipment() {
  const results = await UserEquipment.api().get(`/user_equipment`, {
    dataKey: 'results',
  });
  console.log('results', results);
  return (results.entities?.user_equipment || []) as Collection<UserEquipment>;
}

function getEquipmentName(equipmentId: number) {
  const equipment = Equipment.find(equipmentId);
  return equipment?.name_t || '';
}

onMounted(async () => {
  const [betaFeaturesResponse, , userEquipmentResponse] = await Promise.all([
    getBetaFeatures(),
    Equipment.api().get(`/equipment`, {
      dataKey: 'results',
    }),
    getUserEquipment(),
  ]);

  betaFeatures.value = betaFeaturesResponse.filter(
    (feature: { opt_in: boolean }) => {
      return feature.opt_in;
    },
  );

  userEquipment.value = userEquipmentResponse;
});
</script>
