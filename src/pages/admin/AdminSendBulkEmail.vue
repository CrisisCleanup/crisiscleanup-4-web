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
      :placeholder="$t('Enter email message')"
      text-area
      rows="5"
      class="mb-2"
    />
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
    </div>
    <div v-if="taskStatus" class="mt-4">
      <p>{{ $t('Task Status') }}: {{ taskStatus.state }}</p>
      <div v-if="taskStatus.state === 'SUCCESS'">
        <p>{{ $t('Emails sent successfully.') }}</p>
      </div>
      <div v-else-if="taskStatus.state === 'FAILURE'">
        <p>{{ $t('Failed to send emails.') }}</p>
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

const { t } = useI18n();
const $toasted = useToast();
const { component } = useDialogs();

const subject = ref('');
const htmlMessage = ref('');
const emailList = ref('');
const invalidEmailsList = ref<string[]>([]);
const taskStatus = ref(null);
let statusInterval = null;
const editor = ref<HTMLElement | null>(null);

const sendEmails = async () => {
  if (!subject.value || !htmlMessage.value || !emailList.value.trim()) {
    $toasted.error(
      t('Please fill all fields and add at least one recipient email.'),
    );
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

  try {
    const response = await axios.post(`admins/send_bulk_email`, {
      emails: validEmails,
      subject: subject.value,
      html_message: htmlMessage.value,
    });

    if (response.status === 202) {
      $toasted.success(t('Emails are being sent.'));
      const taskId = response.data.task_id;
      checkTaskStatus(taskId);
      invalidEmailsList.value = [];
    }
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
};

const validateEmail = (email: string) => {
  const emailRegex =
    /^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@(([^\s"(),.:;<>@[\\\]]+\.)+[^\s"(),.:;<>@[\\\]]{2,})$/i;
  return emailRegex.test(email);
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
</script>

<style scoped>
.wysiwyg-editor {
  min-height: 150px;
  outline: none;
}
</style>
