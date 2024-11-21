<!-- SendBulkEmail.vue -->
<template>
  <div class="send-bulk-email">
    <h2>{{ $t('nav.send_bulk_email') }}</h2>
    <base-input
      v-model="subject"
      :placeholder="$t('bulkEmail.enter_email_subject')"
      class="mb-2"
    />
    <base-input
      v-model="htmlMessage"
      :placeholder="$t('bulkEmail.enter_email_body')"
      text-area
      rows="5"
      class="mb-2"
    />

    <!-- Toggle between Email List and CSV File -->
    <div class="mb-2">
      <label>
        <input v-model="inputMethod" type="radio" value="emailList" />
        {{ $t('bulkEmail.enter_email_list') }}
      </label>
      <label class="ml-4">
        <input v-model="inputMethod" type="radio" value="csvFile" />
        {{ $t('actions.upload_csv') }}
      </label>
    </div>

    <!-- Email List Input -->
    <div v-if="inputMethod === 'emailList'">
      <base-input
        v-model="emailList"
        :placeholder="$t('bulkEmail.enter_recipient_emails')"
        text-area
        rows="5"
        class="mb-2"
      />
      <!-- Display invalid emails if any -->
      <div v-if="invalidEmailsList.length > 0" class="mt-2">
        <p class="text-red-500">
          {{ $t('bulkEmail.invalid_emails_removed_list') }}
        </p>
        <ul class="list-disc list-inside text-red-500">
          <li v-for="email in invalidEmailsList" :key="email">{{ email }}</li>
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
        :action="sendEmails"
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
      <base-button
        type="bare"
        class="px-2 py-1 mt-4"
        variant="outline"
        :action="showAdminEmailAssets"
        :text="$t('bulkEmail.show_email_images')"
        :alt="$t('bulkEmail.show_email_images')"
      />
    </div>

    <!-- Task Status Display -->
    <div v-if="taskStatus" class="mt-4">
      <p>{{ $t('info.task_status') }}: {{ taskStatus.state }}</p>
      <div v-if="taskStatus.state === 'SUCCESS'">
        <p>{{ $t('info.emails_sent') }}</p>
        <!-- Display sent emails -->
        <div v-if="sentEmails.length > 0" class="mt-2">
          <p class="text-green-600">{{ $t('bulkEmail.emails_sucessfully_sent_to') }}</p>
          <ul class="list-disc list-inside text-green-600">
            <li v-for="email in sentEmails" :key="email">{{ email }}</li>
          </ul>
        </div>
        <!-- Display unsuccessful emails -->
        <div v-if="unsuccessfulEmails.length > 0" class="mt-2">
          <p class="text-red-500">{{ $t('bulkEmail.emails_failed_to_send') }}</p>
          <ul class="list-disc list-inside text-red-500">
            <li v-for="item in unsuccessfulEmails" :key="item.email">
              {{ item.email }}: {{ item.error }}
            </li>
          </ul>
        </div>
      </div>
      <div v-else-if="taskStatus.state === 'FAILURE'">
        <p>{{ $t('info.emails_failed') }}</p>
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
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';
import CmsViewer from '@/components/cms/CmsViewer.vue';
import useDialogs from '@/hooks/useDialogs';
import { ref } from 'vue';
import { getErrorMessage } from '@/utils/errors';
import AdminEmailAssets from '@/components/admin/AdminEmailAssets.vue';

const { t } = useI18n();
const $toasted = useToast();
const { component } = useDialogs();

const subject = ref('');
const htmlMessage = ref('');
const inputMethod = ref('emailList'); // 'emailList' or 'csvFile'
const emailList = ref('');
const csvFile = ref<File | null>(null);
const invalidEmailsList = ref<string[]>([]);
const csvErrors = ref<string[]>([]);
const taskStatus = ref<any>(null);
const sentEmails = ref<string[]>([]);
const unsuccessfulEmails = ref<{ email: string; error: string }[]>([]);
let statusInterval = null;

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  csvFile.value =
    target.files && target.files.length > 0 ? target.files[0] : null;
};

const validateEmail = (email: string) => {
  const emailRegex =
    /^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@(([^\s"(),.:;<>@[\\\]]+\.)+[^\s"(),.:;<>@[\\\]]{2,})$/i;
  return emailRegex.test(email);
};

const sendEmails = async () => {
  if (!subject.value || !htmlMessage.value) {
    $toasted.error(t('info.complete_all_fields_and_recipient'));
    return;
  }

  const formData = new FormData();
  formData.append('subject', subject.value);
  formData.append('html_message', htmlMessage.value);

  if (inputMethod.value === 'emailList') {
    if (!emailList.value.trim()) {
      $toasted.error(t('info.enter_one_recipient_email'));
      return;
    }

    const emails = emailList.value
      .split('\n')
      .map((email) => email.trim())
      .filter((email) => email !== '');

    // Validate emails
    const invalidEmails = emails.filter((email) => !validateEmail(email));
    const validEmails = emails.filter((email) => validateEmail(email));

    if (invalidEmails.length > 0) {
      // Remove invalid emails from emailList
      emailList.value = validEmails.join('\n');
      // Update invalidEmailsList
      invalidEmailsList.value = invalidEmails;
      if (validEmails.length === 0) {
        $toasted.error(t('info.all_emails_invalid_removed'));
      } else {
        $toasted.error(
          t('info.invalid_emails_removed') +
            invalidEmails.join(', ') +
            '. ' +
            t('info.please_click_send_again'),
        );
      }
      return;
    }

    if (validEmails.length === 0) {
      $toasted.error(t('info.no_valid_emails'));
      return;
    }

    // Append emails to formData
    formData.append('emails', JSON.stringify(validEmails));
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
    const response = await axios.post(`admins/send_bulk_email`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 202) {
      $toasted.success(t('info.success'));
      const taskId = response.data.task_id;
      checkTaskStatus(taskId);
      invalidEmailsList.value = [];
      csvErrors.value = [];
    }
  } catch (error) {
    $toasted.error(getErrorMessage(error));
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

        // Extract sent and unsuccessful emails from the task result
        if (taskStatus.value.result) {
          sentEmails.value = taskStatus.value.result.sent || [];
          unsuccessfulEmails.value = taskStatus.value.result.unsuccessful || [];
        }
      }
    } catch {
      $toasted.error(t('info.failed_to_check_task_status'));
      clearInterval(statusInterval);
    }
  }, 5000);
};

const showPreview = async () => {
  await component({
    title: t('actions.show_preview'),
    component: CmsViewer,
    classes: 'w-full h-96 overflow-auto p-3',
    modalClasses: 'bg-white max-w-3xl shadow',
    props: {
      title: subject.value,
      content: htmlMessage.value,
    },
  });
};

const showAdminEmailAssets = async () => {
  await component({
    title: t('~~Email Images'),
    component: AdminEmailAssets,
    classes: 'w-full h-96 overflow-auto p-3',
    modalClasses: 'bg-white max-w-3xl shadow',
  });
};
</script>

<style scoped>
.send-bulk-email label {
  font-weight: normal;
}
</style>
