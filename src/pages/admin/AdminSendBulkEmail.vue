<!-- SendBulkEmail.vue -->
<template>
  <div class="send-bulk-email">
    <h2>{{ $t('Send Bulk Email') }}</h2>
    <base-input
      v-model="subject"
      :placeholder="$t('Enter email subject')"
      class="mb-2"
    />
    <base-input
      v-model="htmlMessage"
      :placeholder="
        $t('Enter email message (use {{placeholder}} for CSV data)')
      "
      text-area
      rows="5"
      class="mb-2"
    />

    <!-- Toggle between Email List and CSV File -->
    <div class="mb-2">
      <label>
        <input v-model="inputMethod" type="radio" value="emailList" />
        {{ $t('Enter Email List') }}
      </label>
      <label class="ml-4">
        <input v-model="inputMethod" type="radio" value="csvFile" />
        {{ $t('Upload CSV File') }}
      </label>
    </div>

    <!-- Email List Input -->
    <div v-if="inputMethod === 'emailList'">
      <base-input
        v-model="emailList"
        :placeholder="$t('Enter recipient emails, one per line')"
        text-area
        rows="5"
        class="mb-2"
      />
      <!-- Display invalid emails if any -->
      <div v-if="invalidEmailsList.length > 0" class="mt-2">
        <p class="text-red-500">
          {{ $t('The following emails were invalid and have been removed:') }}
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
        <p>{{ $t('Errors in CSV file:') }}</p>
        <ul class="list-disc list-inside">
          <li v-for="error in csvErrors" :key="error">{{ error }}</li>
        </ul>
      </div>
    </div>

    <div class="flex gap-2">
      <base-button
        :action="sendEmails"
        :alt="$t('Send Emails')"
        variant="solid"
        class="px-2 py-1 mt-4"
      >
        {{ $t('Send Emails') }}
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
        :text="$t('~~Show Email Images')"
        :alt="$t('~~Show Email Images')"
      />
    </div>

    <!-- Task Status Display -->
    <div v-if="taskStatus" class="mt-4">
      <p>{{ $t('Task Status') }}: {{ taskStatus.state }}</p>
      <div v-if="taskStatus.state === 'SUCCESS'">
        <p>{{ $t('Email sending process completed.') }}</p>
        <!-- Display sent emails -->
        <div v-if="sentEmails.length > 0" class="mt-2">
          <p class="text-green-600">{{ $t('Successfully sent to:') }}</p>
          <ul class="list-disc list-inside text-green-600">
            <li v-for="email in sentEmails" :key="email">{{ email }}</li>
          </ul>
        </div>
        <!-- Display unsuccessful emails -->
        <div v-if="unsuccessfulEmails.length > 0" class="mt-2">
          <p class="text-red-500">{{ $t('Failed to send to:') }}</p>
          <ul class="list-disc list-inside text-red-500">
            <li v-for="item in unsuccessfulEmails" :key="item.email">
              {{ item.email }}: {{ item.error }}
            </li>
          </ul>
        </div>
      </div>
      <div v-else-if="taskStatus.state === 'FAILURE'">
        <p>{{ $t('Failed to send emails.') }}</p>
        <!-- Display error details if available -->
        <p v-if="taskStatus.result">{{ taskStatus.result }}</p>
      </div>
      <div v-else>
        <p>{{ $t('Processing...') }}</p>
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
    $toasted.error(t('Please fill all fields and add at least one recipient.'));
    return;
  }

  const formData = new FormData();
  formData.append('subject', subject.value);
  formData.append('html_message', htmlMessage.value);

  if (inputMethod.value === 'emailList') {
    if (!emailList.value.trim()) {
      $toasted.error(t('Please enter at least one recipient email.'));
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
        $toasted.error(t('All emails were invalid and have been removed.'));
      } else {
        $toasted.error(
          t('Invalid email addresses have been removed: ') +
            invalidEmails.join(', ') +
            '. ' +
            t('Please click Send Emails again.'),
        );
      }
      return;
    }

    if (validEmails.length === 0) {
      $toasted.error(t('No valid email addresses to send.'));
      return;
    }

    validEmails.forEach((email: string) => {
      formData.append('emails', email);
    });
  } else if (inputMethod.value === 'csvFile') {
    if (!csvFile.value) {
      $toasted.error(t('Please upload a CSV file.'));
      return;
    }
    formData.append('csv_file', csvFile.value);
  } else {
    $toasted.error(t('Invalid input method.'));
    return;
  }

  try {
    const response = await axios.post(`admins/send_bulk_email`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 202) {
      $toasted.success(t('Emails are being sent.'));
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
      $toasted.error(t('Failed to check task status.'));
      clearInterval(statusInterval);
    }
  }, 5000);
};

const showPreview = async () => {
  await component({
    title: t('Email Preview'),
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
    title: t('Email Images'),
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
