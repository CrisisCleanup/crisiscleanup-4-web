<template>
  <form
    class="h-full flex justify-center mt-10 md:mt-0"
    data-testid="testProfileDiv"
  >
    <div class="h-full flex flex-col w-11/12 md:w-3/4 my-6">
      <div class="h-full w-full bg-white flex flex-col">
        <div
          class="md:border-b px-4 py-2 font-semibold flex justify-between items-center h-16"
        >
          {{ currentUser!.full_name }}
          <div class="flex justify-end gap-2">
            <base-button
              data-testid="testLogoutButton"
              class="px-4 py-2 bg-red-600 text-white md:hidden"
              :text="$t('actions.logout')"
              :alt="$t('actions.logout')"
              :action="logoutApp"
            />
            <base-button
              variant="solid"
              data-testid="testSaveButton"
              class="px-4 py-2"
              :text="$t('actions.save')"
              :alt="$t('actions.save')"
              :action="saveUser"
            />
          </div>
        </div>
        <div class="">
          <div class="flex md:flex-row flex-col">
            <div class="flex flex-col p-8 md:w-64 items-center">
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
                  :alt="$t('actions.change_photo')"
                  >{{ $t('actions.change_photo') }}
                </base-button>
              </DragDrop>

              <base-button
                variant="solid"
                data-testid="testViewIdBadgeButton"
                class="py-2 px-4"
                :alt="$t('actions.view_id_badge')"
              >
                {{ $t('actions.view_id_badge') }}
              </base-button>
            </div>
            <div class="user-form p-10 md:p-8">
              <form ref="form" @submit.prevent="handleSubmit">
                <div class="user-details">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2 pb-4">
                    <div class="form-field">
                      <label for="first_name">{{
                        $t('profileUser.first_name_placeholder')
                      }}</label>
                      <base-input
                        name="first_name"
                        data-testid="testFirstNameTextInput"
                        size="large"
                        :model-value="currentUser!.first_name"
                        :placeholder="$t('profileUser.first_name_placeholder')"
                        required
                        @update:model-value="
                          (value) => updateUser(value, 'first_name')
                        "
                      />
                    </div>
                    <div class="form-field">
                      <label for="mobile">{{
                        $t('profileUser.mobile_placeholder')
                      }}</label>
                      <base-input
                        name="mobile"
                        data-testid="testMobileTextInput"
                        size="large"
                        :model-value="currentUser!.mobile"
                        :placeholder="$t('profileUser.mobile_placeholder')"
                        :validator="validatePhoneNumber"
                        @update:model-value="
                          (value) => updateUser(value, 'mobile')
                        "
                      />
                    </div>
                    <div class="form-field mr-2">
                      <label for="last_name">{{
                        $t('profileUser.last_name_placeholder')
                      }}</label>
                      <base-input
                        name="last_name"
                        data-testid="testLastNameTextInput"
                        size="large"
                        :model-value="currentUser!.last_name"
                        :placeholder="$t('profileUser.last_name_placeholder')"
                        required
                        @update:model-value="
                          (value) => updateUser(value, 'last_name')
                        "
                      />
                    </div>
                    <div class="form-field">
                      <label for="email">{{
                        $t('profileUser.email_placeholder')
                      }}</label>
                      <base-input
                        name="email"
                        data-testid="testEmailTextInput"
                        :model-value="currentUser!.email"
                        size="large"
                        :placeholder="$t('profileUser.email_placeholder ')"
                        required
                        @update:model-value="
                          (value) => updateUser(value, 'email')
                        "
                      />
                    </div>
                  </div>
                </div>
                <hr class="p-2 m-auto" />
                <div class="grid grid-cols-1 pb-4 gap-2">
                  <div class="w-full">
                    <p>{{ $t('profileUser.user_roles') }}</p>
                    <UserRolesSelect
                      class="w-full flex-grow"
                      data-testid="testUserRolesSelect"
                      :user="currentUser!"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-1 pb-4 gap-2">
                  <div>
                    <p>{{ $t('usersVue.equipment') }}</p>
                    <UserEquipmentSelect :user="currentUser!" />
                  </div>
                </div>
                <div>{{ $t('profileUser.languages') }}</div>
                <div class="flex pb-4">
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
                </div>
                <div class="mt-3">
                  <h3 class="text-base">{{ $t('profileUser.linkedin') }}</h3>
                  <div class="flex pb-4">
                    <div class="w-32 flex items-center">
                      <img
                        src="https://simpleicons.org/icons/facebook.svg"
                        class="w-8 mr-4"
                        :alt="$t('profileUser.facebook')"
                      />
                      <label class="pr-3">{{
                        $t('profileUser.facebook')
                      }}</label>
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
                    <div class="w-32 flex items-center">
                      <img
                        src="https://simpleicons.org/icons/twitter.svg"
                        class="w-8 mr-2"
                        :alt="$t('profileUser.twitter')"
                      />
                      <label class="pr-3">{{
                        $t('profileUser.twitter')
                      }}</label>
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
                <hr class="my-3 m-auto" />
              </form>
              <div class="my-2">
                <base-button
                  variant="solid"
                  data-testid="testChangePasswordButton"
                  class="px-4 py-1"
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
              <div class="beta-features">
                <h3>{{ $t('profileUser.beta_features') }}</h3>
                <div class="flex flex-col py-3">
                  <div
                    v-for="feature in betaFeatures"
                    :key="feature.id"
                    :data-testid="`testBetaFeature${feature.id}Div`"
                    class="flex w-1/2"
                  >
                    <base-checkbox
                      class="mr-1"
                      :model-value="
                        can(`beta_feature.${feature.name || feature.key}`)
                      "
                      @update:model-value="
                        (value) => {
                          optInBetaFeature(feature.id);
                        }
                      "
                    >
                    </base-checkbox>
                    {{ feature.description }}
                  </div>
                </div>
              </div>
              <div class="mt-6">
                <h3>{{ $t('profileUser.your_organization') }}</h3>
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
              </div>
              <div class="mt-6" data-testid="testNotificationSettingsDiv">
                <h3>{{ $t('profileUser.notification_settings') }}</h3>
                <div class="flex flex-col py-3">
                  <base-radio
                    class="mb-2"
                    data-testid="testHasNotificationsYesRadio"
                    name="Yes"
                    type="boolean"
                    :model-value="
                      currentUser!.notificationSettings.has_notifications
                    "
                    @click="() => setNotifications('has_notifications', true)"
                  />
                  <base-radio
                    class="mb-2"
                    data-testid="testHasNotificationsNoRadio"
                    name="No"
                    type="boolean"
                    :model-value="
                      !currentUser!.notificationSettings.has_notifications
                    "
                    @click="() => setNotifications('has_notifications', false)"
                  />
                  <div
                    v-if="currentUser!.notificationSettings.has_notifications"
                    class="flex justify-between flex-wrap"
                  >
                    <div
                      v-for="(value, key) in notifications"
                      :key="key"
                      :data-testid="`testNotificationSettingsKey${key}Div`"
                      class="flex w-1/2"
                    >
                      <base-checkbox
                        class="mr-1"
                        :model-value="currentUser!.notificationSettings[key]"
                        @update:model-value="
                          (value) => setNotifications(key, value)
                        "
                      >
                      </base-checkbox>
                      {{ value }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-2">
                <h3 class="pb-4">{{ $t('profileUser.troubleshooting') }}</h3>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<script lang="ts">
import { computed, reactive, toRefs } from 'vue';
import { useToast } from 'vue-toastification';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { getErrorMessage } from '@/utils/errors';
import Avatar from '@/components/Avatar.vue';
import User from '@/models/User';
import Role from '@/models/Role';
import Language from '@/models/Language';
import DragDrop from '@/components/DragDrop.vue';
import UserRolesSelect from '@/components/UserRolesSelect.vue';
import useSetupLanguage from '@/hooks/useSetupLanguage';
import useValidation from '@/hooks/useValidation';
import ChangeOrganizationModal from '@/components/modals/ChangeOrganizationModal.vue';
import { useCurrentUser, useAuthStore } from '@/hooks';
import useAcl from '@/hooks/useAcl';
import UserEquipmentSelect from '@/components/UserEquipmentSelect.vue';

export default defineComponent({
  name: 'Profile',
  components: {
    UserEquipmentSelect,
    Avatar,
    ChangeOrganizationModal,
    DragDrop,
    UserRolesSelect,
  },
  setup() {
    const $toasted = useToast();
    const route = useRoute();
    const { validatePhoneNumber } = useValidation();
    const { t } = useI18n();
    const { $can } = useAcl();

    const form = ref<HTMLFormElement | undefined>(undefined);
    const state = reactive({
      mode: 'view',
      uploading: false,
      showChangeOrganizationModal: false,
      notifications: {
        new_incident: t('profileUser.notification_new_incident'),
        request_work_type: t('profileUser.notification_request_work'),
        new_or_move_user: t('profileUser.notification_new_moving_user'),
        affiliate_requests: t('profileUser.notification_affiliate'),
        periodic_reports: t('profileUser.notification_periodic_reports'),
        custom_reports: t('profileUser.notification_custom_reports'),
        organization_registration: t(
          'profileUser.notification_org_registration',
        ),
        location_approval: t('profileUser.notification_location_approval'),
        move_user_to_organization: t('profileUser.notification_moving_users'),
        incident_access_approval: t('profileUser.notification_incident_access'),
        user_role_approval: t('profileUser.notification_user_roles'),
        organization_role_approval: t('profileUser.notification_org_roles'),
        phone_volunteer_needs: t('profileUser.notification_phone_needs'),
      },
      nav: {
        request_reset_password: '/password/new',
      },
      betaFeatures: [],
    });
    const {
      currentUser,
      userPreferences,
      updateCurrentUser,
      updateCurrentUserDebounced,
    } = useCurrentUser();

    const authStore = useAuthStore();
    const store = useStore();

    const name = computed(() => currentUser.value?.full_name ?? '');

    const roles = computed(() => Role.all());

    const languages = computed(() =>
      Language.all().map((l) => {
        return {
          ...l,
          name_t: t(l.name_t),
        };
      }),
    );

    const userRoles = computed(() => {
      if (!currentUser.value) return [];
      return Role.query()
        .whereIdIn(currentUser.value?.active_roles ?? [])
        .get();
    });

    function handleSubmit(e: unknown) {
      e.preventDefault();
    }

    async function setNotifications(key: string, value: unknown) {
      await updateCurrentUser({
        preferences: {
          ...userPreferences.value,
          notification_settings: {
            ...userPreferences.value?.notification_settings,
            [key]: value,
          },
        },
      });
    }

    async function handleProfilePictureUpload(fileList: File[]) {
      if (fileList.length === 0) {
        state.uploading = false;
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
      state.uploading = true;
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
          User.api().deleteFile(authStore.currentUserId.value!, picture.file),
        );
        await Promise.allSettled([
          ...oldImages,
          User.api().addFile(authStore.currentUserId.value!, file),
        ]);
        await authStore.getMe();
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
      } finally {
        state.uploading = false;
      }
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
      store.commit('acl/setUserAcl', currentUser.value.id);
    }

    async function updateUser(value: unknown, key: string) {
      await updateCurrentUserDebounced({
        [key]: value,
      }).catch((error) => {
        $toasted.error(getErrorMessage(error));
      });
    }

    async function updateUserLanguage() {
      const { setupLanguage } = useSetupLanguage();
      await setupLanguage();
    }

    async function saveUser() {
      const isValid = form?.value?.reportValidity();
      if (!isValid) {
        return;
      }

      try {
        await updateCurrentUser({
          ...currentUser.value!.$toJson(),
          preferences: userPreferences.value,
          states: userPreferences.value,
        });
        await $toasted.success(t('profileUser.save_user_success'));
        state.mode = 'view';
        await updateUserLanguage();
      } catch (error) {
        await $toasted.error(getErrorMessage(error));
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

    async function updateUserLanguageIds(value: string[]) {
      const [primary_language, secondary_language] = value;
      await updateUser(primary_language, 'primary_language');
      await updateUser(secondary_language, 'secondary_language');
      if (!primary_language) {
        await updateUser(undefined, 'primary_language');
      }
      if (!secondary_language) {
        await updateUser(undefined, 'secondary_language');
      }
    }

    onMounted(async () => {
      if (route.query.move) {
        state.showChangeOrganizationModal = true;
      }
      state.betaFeatures = await getBetaFeatures();
      state.betaFeatures = state.betaFeatures.filter(
        (feature: { opt_in: boolean }) => {
          return feature.opt_in;
        },
      );
    });

    const stateRefs = toRefs(state);
    return {
      ...stateRefs,
      name,
      roles,
      languages,
      userRoles,
      currentUser,
      handleSubmit,
      setNotifications,
      handleProfilePictureUpload,
      updateUser,
      saveUser,
      resetPreferences,
      resetStates,
      validatePhoneNumber,
      updateUserLanguageIds,
      form,
      logoutApp: authStore.logout,
      can: $can,
      optInBetaFeature,
    };
  },
});
</script>

<style scoped>
.user-form {
  .form-field {
    @apply flex flex-col ml-0;
  }
}
.profile-image {
  height: 175px;
  width: 175px;
}
</style>

<style>
.profile-select .vs__selected {
  @apply text-xs bg-white !important;
}
</style>
