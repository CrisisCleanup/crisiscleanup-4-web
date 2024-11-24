<!-- SendBulkSMS.vue -->
<template>
  <div class="send-bulk-sms">
    <h2>{{ $t('nav.send_bulk_sms') }}</h2>
    <base-input
      v-model="messageText"
      :placeholder="$t('bulkSms.enter_sms_message')"
      text-area
      rows="5"
      class="mb-2"
    />

    <!-- Toggle between Phone Number List and CSV File -->
    <div class="mb-2">
      <label>
        <input v-model="inputMethod" type="radio" value="phoneList" />
        {{ $t('bulkSms.enter_phone_number_list') }}
      </label>
      <label class="ml-4">
        <input v-model="inputMethod" type="radio" value="csvFile" />
        {{ $t('actions.upload_csv') }}
      </label>
    </div>

    <!-- Phone Number List Input -->
    <div v-if="inputMethod === 'phoneList'">
      <base-input
        v-model="phoneNumberList"
        :placeholder="$t('bulkSms.enter_recipient_phone_numbers')"
        text-area
        rows="5"
        class="mb-2"
      />
      <!-- Display invalid phone numbers if any -->
      <div v-if="invalidNumbersList.length > 0" class="mt-2">
        <p class="text-red-500">
          {{ $t('bulkSms.invalid_phone_numbers_removed_list') }}
        </p>
        <ul class="list-disc list-inside text-red-500">
          <li v-for="number in invalidNumbersList" :key="number">
            {{ number }}
          </li>
        </ul>
      </div>
    </div>

    <!-- CSV File Upload -->
    <div v-else-if="inputMethod === 'csvFile'">
      <input
        type="file"
        accept=".csv"
        class="mb-2"
        @change="handleFileUpload"
      />
      <!-- Display CSV parsing errors if any -->
      <div v-if="csvErrors.length > 0" class="mt-2 text-red-500">
        <p>{{ $t('info.errors_in_csv') }}</p>
        <ul class="list-disc list-inside">
          <li v-for="error in csvErrors" :key="error">{{ error }}</li>
        </ul>
      </div>
    </div>

    <div class="flex gap-2">
      <base-button
        :action="sendSMS"
        :alt="$t('actions.send_message')"
        variant="solid"
        class="px-2 py-1 mt-4"
      >
        {{ $t('actions.send_message') }}
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

    <!-- Task Status Display -->
    <div v-if="taskStatus" class="mt-4">
      <p>{{ $t('info.task_status') }}: {{ taskStatus.state }}</p>
      <div v-if="taskStatus.state === 'SUCCESS'">
        <p>{{ $t('info.sms_sent') }}</p>
        <!-- Display sent phone numbers -->
        <div v-if="sentNumbers.length > 0" class="mt-2">
          <p class="text-green-600">
            {{ $t('bulkSms.sms_sucessfully_sent_to') }}
          </p>
          <ul class="list-disc list-inside text-green-600">
            <li v-for="number in sentNumbers" :key="number">{{ number }}</li>
          </ul>
        </div>
        <!-- Display unsuccessful sends -->
        <div v-if="unsuccessfulNumbers.length > 0" class="mt-2">
          <p class="text-red-500">{{ $t('bulkSms.sms_failed_to_send') }}</p>
          <ul class="list-disc list-inside text-red-500">
            <li v-for="item in unsuccessfulNumbers" :key="item.number">
              {{ item.number }}: {{ item.error }}
            </li>
          </ul>
        </div>
      </div>
      <div v-else-if="taskStatus.state === 'FAILURE'">
        <p>{{ $t('info.sms_failed') }}</p>
        <!-- Display error details if available -->
        <p v-if="taskStatus.result">{{ taskStatus.result }}</p>
      </div>
      <div v-else>
        <p>{{ $t('info.processing') }}</p>
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
const inputMethod = ref('phoneList'); // 'phoneList' or 'csvFile'
const phoneNumberList = ref('');
const csvFile = ref<File | null>(null);
const invalidNumbersList = ref<string[]>([]);
const csvErrors = ref<string[]>([]);
const taskStatus = ref<any>(null);
const sentNumbers = ref<string[]>([]);
const unsuccessfulNumbers = ref<{ number: string; error: string }[]>([]);
let statusInterval = null;

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  csvFile.value =
    target.files && target.files.length > 0 ? target.files[0] : null;
};

const validatePhoneNumber = (number: string) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
  return phoneRegex.test(number);
};

const sendSMS = async () => {
  if (!messageText.value.trim()) {
    $toasted.error(t('info.complete_all_fields_and_recipient'));
    return;
  }

  const formData = new FormData();
  formData.append('message_text', messageText.value);

  if (inputMethod.value === 'phoneList') {
    if (!phoneNumberList.value.trim()) {
      $toasted.error(t('bulkSms.please_enter_one_phone_number'));
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
    const validNumbers = phoneNumbers.filter((number) =>
      validatePhoneNumber(number),
    );

    if (invalidNumbers.length > 0) {
      // Remove invalid numbers from phoneNumberList
      phoneNumberList.value = validNumbers.join('\n');
      // Update invalidNumbersList
      invalidNumbersList.value = invalidNumbers;
      if (validNumbers.length === 0) {
        $toasted.error(t('bulkSms.all_phone_numbers_invalid_removed'));
      } else {
        $toasted.error(
          t('bulkSms.invalid_phone_numbers_removed') +
            invalidNumbers.join(', ') +
            '. ' +
            t('info.please_click_send_sms_again'),
        );
      }
      return;
    }

    if (validNumbers.length === 0) {
      $toasted.error(t('bulkSms.no_valid_phone_numbers'));
      return;
    }

    validNumbers.forEach((number: string) => {
      formData.append('phone_numbers', number);
    });
  } else if (inputMethod.value === 'csvFile') {
    if (!csvFile.value) {
      $toasted.error(t('info.please_upload_csv'));
      return;
    }
    formData.append('csv_file', csvFile.value);
  } else {
    $toasted.error(t('info.invalid_input_method'));
    return;
  }

  try {
    const response = await axios.post(`admins/send_bulk_sms`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    $toasted.success(t('info.success'));
    const taskId = response.data.task_id;
    checkTaskStatus(taskId);
    invalidNumbersList.value = [];
    csvErrors.value = [];
  } catch (error) {
    const errorMessage =
      error.response?.data?.detail || t('info.failed_to_send_sms');
    $toasted.error(errorMessage);
  }
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

        // Extract sent and unsuccessful numbers from the task result
        if (taskStatus.value.result) {
          sentNumbers.value = taskStatus.value.result.sent || [];
          unsuccessfulNumbers.value =
            taskStatus.value.result.unsuccessful || [];
        }
      }
    } catch {
      $toasted.error(t('info.failed_to_check_task_status'));
      clearInterval(statusInterval);
    }
  }, 5000);
};

const showPreview = async () => {
  if (!messageText.value.trim()) {
    $toasted.error(t('bulkSms.enter_message_preview_sms'));
    return;
  }

  await component({
    title: t('actions.show_preview'),
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
