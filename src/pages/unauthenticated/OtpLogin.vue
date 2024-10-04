<script lang="ts" setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/hooks/useAuth';
import Home from '@/layouts/Home.vue';
import { getAndToastErrorMessage } from '@/utils/errors';
import useDialogs from '@/hooks/useDialogs';
import useValidation from '@/hooks/useValidation';

const { requestOtp, verifyOtp, loginWithOtp, getMe } = useAuthStore();
const { selection } = useDialogs();
const { validatePhoneNumber } = useValidation();
const toast = useToast();
const router = useRouter();
const { t } = useI18n();
const phoneNumber = ref('');
const otp = ref('');
const selectedUserId = ref<number>();
const showOtpCodeModal = ref(false);
const form = ref(null);

const sendOtp = async () => {
  try {
    const isValid = form.value.reportValidity();
    if (!isValid) {
      return;
    }
    await requestOtp(phoneNumber.value);
    showOtpCodeModal.value = true;
    toast.success(t('loginWithPhone.success_check_phone'));
  } catch (error) {
    getAndToastErrorMessage(error);
  }
};

const verifyOtpAndLogin = async () => {
  try {
    const verifyResponse = await verifyOtp(phoneNumber.value, otp.value);
    if (!verifyResponse.otp_id) {
      throw new Error('OTP verification failed. Invalid otp_id');
    }

    selectedUserId.value = verifyResponse.accounts[0].id;
    if (verifyResponse.accounts.length > 1) {
      const result = (await selection({
        title: t('loginWithPhone.select_account'),
        content: '',
        label: 'label',
        itemKey: 'id',
        options: verifyResponse.accounts.map((a) => ({
          id: a.id,
          label: `${a.organization} - (${a.email})`,
        })),
        placeholder: t('loginWithPhone.select_account'),
      })) as number | boolean;
      if (result == false) {
        return;
      }
      selectedUserId.value = result as number;
    }

    await loginWithOtp(selectedUserId.value, verifyResponse.otp_id);
    showOtpCodeModal.value = false;
    toast.success(t('loginWithPhone.login_success'));
    await getMe();
    await router.push('/dashboard');
    // Navigate the user to the dashboard or home page after successful login
  } catch (error) {
    getAndToastErrorMessage(error);
  }
};
</script>

<template>
  <Home>
    <div class="grid--main">
      <div class="w-2/3">
        <section class="mb-4">
          <div class="text-3xl" data-testid="testOtpDiv">
            {{ $t('loginForm.login_with_cell') }}
          </div>
          <div>
            {{ $t('loginWithPhone.get_code') }}
          </div>
        </section>
        <form ref="form" class="w-108 flex flex-col gap-4" autocomplete="off">
          <base-input
            v-model="phoneNumber"
            data-testid="testPhoneNumberInput"
            size="large"
            :placeholder="$t('loginWithPhone.enter_cell')"
            :validator="validatePhoneNumber"
            required
          />
          <base-button
            size="large"
            data-testid="testSendOtpButton"
            class="px-5 py-2 m-1 flex-grow"
            variant="solid"
            :text="$t('actions.submit')"
            :alt="$t('actions.submit')"
            :action="sendOtp"
          />
        </form>

        <modal
          v-if="showOtpCodeModal"
          data-testid="testShowRequestAccessModalModal"
          :title="$t('loginWithPhone.code_verification')"
          modal-classes="w-108"
          @close="showOtpCodeModal = false"
        >
          <div class="flex justify-around m-5">
            <base-input
              v-model="otp"
              data-testid="testOtpInput"
              type="text"
              class="input"
              size="large"
              autocomplete="off"
              :placeholder="$t('loginWithPhone.enter_x_digit_code')"
              required
              @enter="verifyOtpAndLogin"
            />
          </div>
          <template #footer>
            <div class="flex p-1 justify-center">
              <base-button
                size="large"
                data-testid="testResendOtpButton"
                class="px-5 py-2 m-1 flex-grow"
                variant="outline"
                :text="$t('actions.resend_code')"
                :alt="$t('actions.resend_code')"
                :action="sendOtp"
              />
              <base-button
                size="large"
                data-testid="testVerifyOtpButton"
                class="px-5 py-2 m-1 flex-grow"
                variant="solid"
                :text="$t('actions.continue')"
                :alt="$t('actions.continue')"
                :action="verifyOtpAndLogin"
              />
            </div>
          </template>
        </modal>
      </div>
    </div>
  </Home>
</template>

<style scoped lang="scss"></style>
