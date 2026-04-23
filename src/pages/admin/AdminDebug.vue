<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import BaseCheckbox from '@/components/BaseCheckbox.vue';
import useCurrentUser from '@/hooks/useCurrentUser';
import { getErrorMessage } from '@/utils/errors';

const { t } = useI18n();
const $toasted = useToast();
const { currentUser, userPreferences, updateCurrentUser, isAdmin } =
  useCurrentUser();

const enableCallSimulator = computed({
  get: () => Boolean(userPreferences.value?.enable_call_simulator),
  set: (value) => {
    void setPreference('enable_call_simulator', value);
  },
});

async function setPreference(key: string, value: unknown) {
  if (!currentUser.value) return;
  try {
    await updateCurrentUser({
      preferences: {
        ...userPreferences.value,
        [key]: value,
      },
    });
    $toasted.success(t('info.preferences_saved', 'Preferences saved'));
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}
</script>

<template>
  <div v-if="isAdmin" class="p-6 max-w-3xl">
    <h1 class="text-xl font-semibold mb-2">
      {{ t('nav.debug', 'Debug') }}
    </h1>
    <p class="text-sm text-crisiscleanup-dark-300 mb-6">
      {{
        t(
          'adminDebug.description',
          'Toggles here affect only your own account and only take effect for admins.',
        )
      }}
    </p>

    <section class="border border-crisiscleanup-grey-100 rounded p-4">
      <h2 class="text-base font-semibold mb-2">
        {{ t('adminDebug.phone_section', 'Phone') }}
      </h2>
      <label class="flex items-start gap-3">
        <BaseCheckbox
          v-model="enableCallSimulator"
          data-testid="testEnableCallSimulatorCheckbox"
        />
        <span class="flex flex-col">
          <span class="font-medium">
            {{ t('adminDebug.enable_call_simulator', 'Enable Call Simulator') }}
          </span>
          <span class="text-xs text-crisiscleanup-dark-300">
            {{
              t(
                'adminDebug.enable_call_simulator_description',
                'Shows the "Call Simulator" tab inside the phone overlay. Lets you hydrate the phone UI from a DNIS / existing inbound or outbound record without placing a real call.',
              )
            }}
          </span>
        </span>
      </label>
    </section>
  </div>
</template>
