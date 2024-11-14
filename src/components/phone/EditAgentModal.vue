<template>
  <modal
    modal-classes="bg-white max-w-md shadow"
    :closeable="true"
    @close="$emit('cancel')"
  >
    <template #header>
      <div class="text-lg border-b p-3" data-testid="testUpdateAgentDiv">
        {{ $t('editAgentModal.update_agent') }}
      </div>
    </template>

    <div class="p-5">
      <div class="section flex flex-col justify-around">
        <!-- Phone # -->
        <base-text
          :weight="200"
          class="section-header"
          data-testid="testPhoneNumberContent"
        >
          {{ $t('editAgentModal.phone_number') }}
        </base-text>
        <PhoneNumberInput
          :model-value="phoneNumber"
          data-testid="testPhoneNumberTextInput"
          size="medium"
          placeholder="+1 (000) 000-0000"
          @update:model-value="(value: string) => (phoneNumber = value)"
        />
      </div>
      <div class="section flex flex-col">
        <base-text
          :weight="200"
          class="section-header"
          data-testid="testLanguagesContent"
        >
          {{ $t('editAgentModal.languages') }}
        </base-text>
        <!-- Language -->
        <base-select
          class="flex-grow border border-crisiscleanup-dark-100"
          data-testid="testLanguagesSelect"
          :model-value="languages"
          multiple
          :options="supportedLanguages"
          item-key="id"
          label="name_t"
          size="large"
          select-classes="bg-white border text-xs p-1 profile-select"
          @update:model-value="(value: string[]) => (languages = value)"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex p-3 my-6 justify-center mb-3 footer">
        <base-button
          variant="solid"
          data-testid="testSaveButton"
          size="large"
          :alt="$t('actions.save')"
          :action="() => updateUserNeeded()"
          >{{ $t('actions.save') }}</base-button
        >
      </div>
    </template>
  </modal>
</template>

<script lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';
import PhoneNumberInput from '@/components/PhoneNumberInput.vue';
import Language from '../../models/Language';
import useCurrentUser from '../../hooks/useCurrentUser';
import useConnectFirst from '../../hooks/useConnectFirst';

export default defineComponent({
  name: 'EditAgentModal',
  components: { PhoneNumberInput },
  setup(props, context) {
    const number = ref('');
    const languages = ref<string[]>([]);
    const phoneNumber = ref('');
    const { currentUser, updateCurrentUser } = useCurrentUser();
    const { loadAgent } = useConnectFirst(context);
    const $toasted = useToast();
    const { t } = useI18n();

    async function updateUserNeeded() {
      if (phoneNumber.value) {
        await updateCurrentUser({ mobile: phoneNumber.value });
      }

      if (languages.value.length > 0) {
        await updateCurrentUser({ primary_language: undefined });
        await updateCurrentUser({ secondary_language: undefined });
        const [primary_language, secondary_language] = languages.value;
        await updateCurrentUser({ primary_language });
        await updateCurrentUser({ secondary_language });
      }

      try {
        await loadAgent();
        context.emit('cancel');
      } catch (error: any) {
        // this.$log.error('Failed to save user', e);
        $toasted.error(error);
      }
    }

    const supportedLanguages = computed(() => {
      const languages = Language.all().map((l) => {
        return {
          ...l,
          name_t: t(l.name_t),
        };
      });
      const ids = new Set([2, 3, 7, 91, 11, 165, 166]);
      return languages.filter((l) => ids.has(Number(l.id)));
    });

    onMounted(() => {
      phoneNumber.value = currentUser?.value?.mobile || '';
      languages.value = currentUser?.value?.languages.map((l) => l.id) || [];
    });

    return {
      number,
      languages,
      phoneNumber,
      updateUserNeeded,
      supportedLanguages,
    };
  },
  mounted() {},
});
</script>

<style scoped lang="scss">
.section {
  @apply py-1;
  &-header {
    @apply text-crisiscleanup-dark-400 py-1;
  }
}
.footer {
  @apply shadow-inner;
  position: relative;
  margin: 0;
}
</style>
