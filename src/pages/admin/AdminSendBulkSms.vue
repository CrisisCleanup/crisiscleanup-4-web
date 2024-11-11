<!-- SendBulkSMS.vue -->
<template>
  <div class="send-bulk-sms">
    <h2>{{ $t('Send Bulk SMS') }}</h2>
    <base-input
      v-model="messageText"
      :placeholder="$t('Enter SMS message')"
      text-area
      rows="5"
      class="mb-2"
    />
    <base-input
      v-model="phoneNumberList"
      :placeholder="$t('Enter recipient phone numbers, one per line')"
      text-area
      rows="5"
      class="mb-2"
    />
    <div class="flex gap-2">
      <base-button
        :action="sendSMS"
        :alt="$t('Send SMS')"
        variant="solid"
        class="px-2 py-1 mt-4"
      >
        {{ $t('Send SMS') }}
      </base-button>
      <base-button
        type="bare"
        class="px-2 py-1 mt-4"
        variant="outline"
        :action="showPreview"
        :text="$t('actions.show_preview')"
        :alt="$t('actions.show_preview')"
      />
    </div>
    <div v-if="taskStatus" class="mt-4">
      <p>{{ $t('Task Status') }}: {{ taskStatus.state }}</p>
      <div v-if="taskStatus.state === 'SUCCESS'">
        <p>{{ $t('SMS messages sent successfully.') }}</p>
      </div>
      <div v-else-if="taskStatus.state === 'FAILURE'">
        <p>{{ $t('Failed to send SMS messages.') }}</p>
      </div>
      <div v-else>
        <p>{{ $t('Processing...') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';
import CmsViewer from '@/components/cms/CmsViewer.vue';
import useDialogs from '@/hooks/useDialogs';

const { t } = useI18n();
const $toasted = useToast();
const { component } = useDialogs();

const messageText = ref('');
const phoneNumberList = ref('');
const taskStatus = ref(null);
let statusInterval = null;

const sendSMS = async () => {
  if (!messageText.value.trim() || !phoneNumberList.value.trim()) {
    $toasted.error(
      t('Please enter a message and add at least one recipient phone number.'),
    );
    return;
  }

  const phoneNumbers = phoneNumberList.value
    .split('\n')
    .map((number) => number.trim())
    .filter((number) => number !== '');

  // Validate phone numbers
  const invalidNumbers = phoneNumbers.filter(
    (number) => !validatePhoneNumber(number),
  );

  if (invalidNumbers.length > 0) {
    $toasted.error(t('Invalid phone numbers: ') + invalidNumbers.join(', '));
    return;
  }

  try {
    const response = await axios.post(`admins/send_bulk_sms`, {
      phone_numbers: phoneNumbers,
      message_text: messageText.value,
    });
    $toasted.success(t('SMS messages are being sent.'));
    const taskId = response.data.task_id;
    checkTaskStatus(taskId);
  } catch (error) {
    const errorMessage =
      error.response?.data?.detail || t('Failed to send SMS messages.');
    $toasted.error(errorMessage);
  }
};

const validatePhoneNumber = (number: string) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
  return phoneRegex.test(number);
};

const checkTaskStatus = (taskId: string) => {
  if (statusInterval) {
    clearInterval(statusInterval);
  }
  statusInterval = setInterval(async () => {
    try {
      const statusResponse = await axios.get(`tasks/${taskId}/`);
      taskStatus.value = statusResponse.data;
      if (['SUCCESS', 'FAILURE'].includes(taskStatus.value.state)) {
        clearInterval(statusInterval);
      }
    } catch {
      $toasted.error(t('Failed to check task status.'));
      clearInterval(statusInterval);
    }
  }, 5000);
};

const showPreview = async () => {
  if (!messageText.value.trim()) {
    $toasted.error(t('Please enter a message to preview.'));
    return;
  }

  await component({
    title: t('SMS Preview'),
    component: CmsViewer,
    classes: 'w-full h-96 overflow-auto p-3',
    modalClasses: 'bg-white max-w-md shadow',
    props: {
      content: messageText.value,
    },
  });
};
</script>

<style scoped>
/* Add any styles if necessary */
</style>
